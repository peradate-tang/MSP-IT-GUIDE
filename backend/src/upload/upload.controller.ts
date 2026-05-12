import {
  Controller, Post, UseInterceptors, UploadedFile,
  UseGuards, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function uploadToCloudinary(buffer: Buffer, options: object): Promise<any> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    }).end(buffer);
  });
}

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (_, file, cb) => {
        if (!file.mimetype.match(/^image\//)) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const result = await uploadToCloudinary(file.buffer, {
      folder: 'msp-it-guide/images',
      resource_type: 'image',
    });
    // จำกัดความกว้างสูงสุด 1200px, คุณภาพ auto, format auto (webp/avif)
    const url = result.secure_url.replace('/upload/', '/upload/w_1200,c_limit,q_auto,f_auto/');
    return { url };
  }

  @Post('video')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (_, file, cb) => {
        if (!file.mimetype.match(/^video\//)) {
          return cb(new BadRequestException('Only video files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
    }),
  )
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const result = await uploadToCloudinary(file.buffer, {
      folder: 'msp-it-guide/videos',
      resource_type: 'video',
      // ลดความละเอียดเป็น 720p และ compress ก่อนเก็บ
      eager: [{ width: 1280, height: 720, crop: 'limit', quality: 70, format: 'mp4' }],
      eager_async: false,
    });
    // ใช้ eager URL ที่ถูก transcode แล้ว ถ้ามี ไม่งั้นใช้ original
    const url = result.eager?.[0]?.secure_url ?? result.secure_url;
    return { url };
  }
}
