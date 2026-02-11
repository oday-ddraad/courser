import connectDB from '../lib/mongodb/connection';
import { Category } from '../lib/mongodb/models';

const defaultCategories = [
  {
    name: { en: 'English', de: 'Englisch', ar: 'الإنجليزية' },
    slug: 'english',
    description: { 
      en: 'Learn English from beginner to advanced levels',
      de: 'Lernen Sie Englisch von Anfänger bis Fortgeschrittene',
      ar: 'تعلم الإنجليزية من المستوى المبتدئ إلى المتقدم'
    },
    color: '#3B82F6',
    sortOrder: 1,
  },
  {
    name: { en: 'German', de: 'Deutsch', ar: 'الألمانية' },
    slug: 'german',
    description: { 
      en: 'Master German language with expert instructors',
      de: 'Beherrschen Sie die deutsche Sprache mit erfahrenen Lehrern',
      ar: 'أتقن اللغة الألمانية مع مدربين خبراء'
    },
    color: '#F59E0B',
    sortOrder: 2,
  },
  {
    name: { en: 'Arabic', de: 'Arabisch', ar: 'العربية' },
    slug: 'arabic',
    description: { 
      en: 'Learn Arabic for all levels and purposes',
      de: 'Lernen Sie Arabisch für alle Stufen und Zwecke',
      ar: 'تعلم العربية لجميع المستويات والأغراض'
    },
    color: '#10B981',
    sortOrder: 3,
  },
  {
    name: { en: 'Business', de: 'Business', ar: 'الأعمال' },
    slug: 'business',
    description: { 
      en: 'Business language courses for professionals',
      de: 'Business-Sprachkurse für Fachleute',
      ar: 'دورات لغة الأعمال للمحترفين'
    },
    color: '#8B5CF6',
    sortOrder: 4,
  },
  {
    name: { en: 'Conversation', de: 'Konversation', ar: 'المحادثة' },
    slug: 'conversation',
    description: { 
      en: 'Improve your speaking skills with conversation courses',
      de: 'Verbessern Sie Ihre Sprachfähigkeiten mit Konversationskursen',
      ar: 'حسن مهاراتك في التحدث مع دورات المحادثة'
    },
    color: '#EC4899',
    sortOrder: 5,
  },
];

async function seedCategories() {
  try {
    await connectDB();
    
    console.log('Seeding categories...');
    
    for (const categoryData of defaultCategories) {
      const existingCategory = await Category.findOne({ slug: categoryData.slug });
      
      if (!existingCategory) {
        await Category.create(categoryData);
        console.log(`✓ Created category: ${categoryData.name.en}`);
      } else {
        console.log(`✓ Category already exists: ${categoryData.name.en}`);
      }
    }
    
    console.log('\n✅ Categories seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();
