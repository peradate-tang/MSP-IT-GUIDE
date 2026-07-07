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
        { name: 'IT', description: 'Information Technology', icon: '💻', sortOrder: 1 },
        { name: 'Front Office', description: 'Front Office operations', icon: '🛎️', sortOrder: 2 },
        { name: 'Engineer', description: 'Engineering & Maintenance', icon: '⚙️', sortOrder: 3 },
        { name: 'Security', description: 'Security & Safety', icon: '🔐', sortOrder: 4 },
        { name: 'Food & Beverage', description: 'Food and Beverage operations', icon: '🍽️', sortOrder: 5 },
        { name: 'Housekeeping', description: 'Housekeeping & Laundry', icon: '🧹', sortOrder: 6 },
        { name: 'Human Resource', description: 'HR & Training', icon: '👥', sortOrder: 7 },
        { name: 'Finance', description: 'Finance & Accounting', icon: '💰', sortOrder: 8 },
        { name: 'Sales & Marketing', description: 'Sales & Marketing', icon: '📢', sortOrder: 9 },
      ]);
    } else {
      // Update icons to match department names for existing categories
      const iconMap: Record<string, string> = {
        'IT': '💻',
        'Front Office': '🛎️',
        'Engineer': '⚙️',
        'Security': '🔐',
        'Food & Beverage': '🍽️',
        'Housekeeping': '🧹',
        'Human Resource': '👥',
        'Finance': '💰',
        'Sales & Marketing': '📢',
        'Network': '🌐',
        'Server': '🖥️',
        'Database': '🗄️',
        'Cloud': '☁️',
        'Troubleshooting': '🔧',
      };
      const all = await this.categoriesRepository.find();
      for (const cat of all) {
        const newIcon = iconMap[cat.name];
        if (newIcon && cat.icon !== newIcon) {
          await this.categoriesRepository.update(cat.id, { icon: newIcon });
        }
      }
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
