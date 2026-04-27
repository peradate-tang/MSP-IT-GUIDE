import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async onModuleInit() {
    const count = await this.categoriesRepository.count();
    if (count === 0) {
      await this.categoriesRepository.save([
        { name: 'Network', description: 'Networking guides and configurations', icon: '🌐', sortOrder: 1 },
        { name: 'Security', description: 'Cybersecurity best practices', icon: '🔒', sortOrder: 2 },
        { name: 'Server', description: 'Server setup and maintenance', icon: '🖥️', sortOrder: 3 },
        { name: 'Database', description: 'Database administration', icon: '🗄️', sortOrder: 4 },
        { name: 'Cloud', description: 'Cloud services and deployment', icon: '☁️', sortOrder: 5 },
        { name: 'Troubleshooting', description: 'Common IT issues and fixes', icon: '🔧', sortOrder: 6 },
      ]);
    }
  }

  findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({ order: { sortOrder: 'ASC' } });
  }

  async findOne(id: number): Promise<Category> {
    const cat = await this.categoriesRepository.findOne({ where: { id } });
    if (!cat) throw new NotFoundException(`Category #${id} not found`);
    return cat;
  }

  async create(data: Partial<Category>): Promise<Category> {
    const cat = this.categoriesRepository.create(data);
    return this.categoriesRepository.save(cat);
  }

  async update(id: number, data: Partial<Category>): Promise<Category> {
    await this.findOne(id);
    await this.categoriesRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.categoriesRepository.delete(id);
  }
}
