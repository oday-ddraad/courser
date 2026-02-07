import mongoose from 'mongoose';
import { Course, User } from '../lib/mongodb/models';
import connectDB from '../lib/mongodb/connection';

const sampleCourses = [
  {
    slug: 'english-for-beginners',
    title: {
      en: 'English for Beginners',
      de: 'Englisch für Anfänger',
      ar: 'الإنجليزية للمبتدئين',
    },
    description: {
      en: 'Start your English learning journey with this comprehensive beginner course. Learn basic grammar, vocabulary, and conversation skills.',
      de: 'Beginnen Sie Ihre Englisch-Lernreise mit diesem umfassenden Anfängerkurs. Lernen Sie Grundgrammatik, Vokabular und Konversationsfähigkeiten.',
      ar: 'ابدأ رحلة تعلم الإنجليزية مع هذا الكورس الشامل للمبتدئين. تعلم القواعد الأساسية والمفردات ومهارات المحادثة.',
    },
    content: {
      en: 'This course covers all the basics of English language learning.',
      de: 'Dieser Kurs deckt alle Grundlagen des Englischlernens ab.',
      ar: 'يغطي هذا الكورس جميع أساسيات تعلم اللغة الإنجليزية.',
    },
    thumbnail: '/images/courses/english-beginners.jpg',
    price: 15000,
    currency: 'SYP',
    level: 'beginner',
    duration: 20,
    category: 'Languages',
    tags: ['english', 'beginner', 'language', 'grammar'],
    isPublished: true,
    isLiveStream: false,
    enrollmentCount: 1250,
    rating: 4.7,
    reviews: [],
    lessons: [
      {
        order: 1,
        title: {
          en: 'Introduction to English',
          de: 'Einführung in Englisch',
          ar: 'مقدمة في الإنجليزية',
        },
        description: {
          en: 'Learn the basics of English pronunciation and alphabet.',
          de: 'Lernen Sie die Grundlagen der englischen Aussprache und des Alphabets.',
          ar: 'تعلم أساسيات النطق والأبجدية الإنجليزية.',
        },
        content: {
          en: 'Welcome to English learning!',
          de: 'Willkommen beim Englischlernen!',
          ar: 'مرحباً بك في تعلم الإنجليزية!',
        },
        duration: 30,
        isPreview: true,
        resources: [],
      },
      {
        order: 2,
        title: {
          en: 'Basic Greetings',
          de: 'Grundlegende Begrüßungen',
          ar: 'التحيات الأساسية',
        },
        description: {
          en: 'Learn how to greet people in English.',
          de: 'Lernen Sie, wie man Menschen auf Englisch begrüßt.',
          ar: 'تعلم كيفية التحية باللغة الإنجليزية.',
        },
        content: {
          en: 'Hello, Hi, Good morning...',
          de: 'Hallo, Hi, Guten Morgen...',
          ar: 'مرحباً، أهلاً، صباح الخير...',
        },
        duration: 25,
        isPreview: false,
        resources: [],
      },
    ],
    materials: [],
    groups: [],
  },
  {
    slug: 'german-intermediate',
    title: {
      en: 'German Intermediate Level',
      de: 'Deutsch Mittelstufe',
      ar: 'الألمانية المستوى المتوسط',
    },
    description: {
      en: 'Take your German to the next level with advanced grammar and conversation practice.',
      de: 'Bringen Sie Ihr Deutsch auf die nächste Stufe mit fortgeschrittener Grammatik und Konversationspraxis.',
      ar: 'ارتقِ بمستواك في الألمانية مع القواعد المتقدمة وممارسة المحادثة.',
    },
    content: {
      en: 'Advanced German course for intermediate learners.',
      de: 'Fortgeschrittener Deutschkurs für Mittelstufe-Lerner.',
      ar: 'كورس ألماني متقدم للمتعلمين في المستوى المتوسط.',
    },
    thumbnail: '/images/courses/german-intermediate.jpg',
    price: 25000,
    currency: 'SYP',
    level: 'intermediate',
    duration: 35,
    category: 'Languages',
    tags: ['german', 'intermediate', 'language', 'grammar'],
    isPublished: true,
    isLiveStream: false,
    enrollmentCount: 890,
    rating: 4.5,
    reviews: [],
    lessons: [
      {
        order: 1,
        title: {
          en: 'Complex Sentences',
          de: 'Komplexe Sätze',
          ar: 'الجمل المعقدة',
        },
        description: {
          en: 'Master complex sentence structures in German.',
          de: 'Beherrschen Sie komplexe Satzstrukturen im Deutschen.',
          ar: 'أتقن تراكيب الجمل المعقدة في الألمانية.',
        },
        content: {
          en: 'Subordinate clauses and more...',
          de: 'Nebensätze und mehr...',
          ar: 'الجمل التابعة وأكثر...',
        },
        duration: 45,
        isPreview: true,
        resources: [],
      },
    ],
    materials: [],
    groups: [],
  },
  {
    slug: 'arabic-advanced',
    title: {
      en: 'Advanced Arabic Mastery',
      de: 'Arabisch Fortgeschritten',
      ar: 'إتقان العربية المتقدم',
    },
    description: {
      en: 'Master classical and modern Arabic with this comprehensive advanced course.',
      de: 'Beherrschen Sie klassisches und modernes Arabisch mit diesem umfassenden Fortgeschrittenenkurs.',
      ar: 'أتقن العربية الفصحى والحديثة مع هذا الكورس المتقدم الشامل.',
    },
    content: {
      en: 'Advanced Arabic grammar, literature, and rhetoric.',
      de: 'Fortgeschrittene arabische Grammatik, Literatur und Rhetorik.',
      ar: 'القواعد والأدب والبلاغة العربية المتقدمة.',
    },
    thumbnail: '/images/courses/arabic-advanced.jpg',
    price: 35000,
    currency: 'SYP',
    level: 'advanced',
    duration: 50,
    category: 'Languages',
    tags: ['arabic', 'advanced', 'language', 'literature'],
    isPublished: true,
    isLiveStream: true,
    enrollmentCount: 650,
    rating: 4.9,
    reviews: [],
    lessons: [
      {
        order: 1,
        title: {
          en: 'Classical Arabic Literature',
          de: 'Klassische arabische Literatur',
          ar: 'الأدب العربي الكلاسيكي',
        },
        description: {
          en: 'Explore the rich tradition of Arabic literature.',
          de: 'Erkunden Sie die reiche Tradition der arabischen Literatur.',
          ar: 'استكشف التراث الغني للأدب العربي.',
        },
        content: {
          en: 'Poetry, prose, and rhetoric...',
          de: 'Poesie, Prosa und Rhetorik...',
          ar: 'الشعر والنثر والبلاغة...',
        },
        duration: 60,
        isPreview: true,
        isLiveStream: true,
        scheduledDateTime: new Date('2025-02-01T18:00:00Z'),
        jitsiRoomName: 'arabic-advanced-live-1',
        resources: [],
      },
    ],
    materials: [],
    groups: [],
  },
  {
    slug: 'business-english',
    title: {
      en: 'Business English Professional',
      de: 'Business Englisch Professionell',
      ar: 'الإنجليزية التجارية الاحترافية',
    },
    description: {
      en: 'Learn professional business English for the corporate world.',
      de: 'Lernen Sie professionelles Business Englisch für die Unternehmenswelt.',
      ar: 'تعلم الإنجليزية التجارية الاحترافية لعالم الشركات.',
    },
    content: {
      en: 'Business communication, presentations, and negotiations.',
      de: 'Geschäftskommunikation, Präsentationen und Verhandlungen.',
      ar: 'التواصل التجاري والعروض التقديمية والمفاوضات.',
    },
    thumbnail: '/images/courses/business-english.jpg',
    price: 20000,
    currency: 'SYP',
    level: 'intermediate',
    duration: 25,
    category: 'Business',
    tags: ['english', 'business', 'professional', 'corporate'],
    isPublished: true,
    isLiveStream: false,
    enrollmentCount: 2100,
    rating: 4.6,
    reviews: [],
    lessons: [
      {
        order: 1,
        title: {
          en: 'Email Writing',
          de: 'E-Mail-Schreiben',
          ar: 'كتابة البريد الإلكتروني',
        },
        description: {
          en: 'Master professional email communication.',
          de: 'Beherrschen Sie professionelle E-Mail-Kommunikation.',
          ar: 'أتقن التواصل عبر البريد الإلكتروني الاحترافي.',
        },
        content: {
          en: 'Formal and informal emails...',
          de: 'Formelle und informelle E-Mails...',
          ar: 'رسائل رسمية وغير رسمية...',
        },
        duration: 40,
        isPreview: true,
        resources: [],
      },
    ],
    materials: [],
    groups: [],
  },
  {
    slug: 'german-for-beginners',
    title: {
      en: 'German for Complete Beginners',
      de: 'Deutsch für absolute Anfänger',
      ar: 'الألمانية للمبتدئين الكاملين',
    },
    description: {
      en: 'Start learning German from scratch with this beginner-friendly course.',
      de: 'Beginnen Sie mit diesem anfängerfreundlichen Kurs von Grund auf Deutsch zu lernen.',
      ar: 'ابدأ تعلم الألمانية من الصفر مع هذا الكورس المناسب للمبتدئين.',
    },
    content: {
      en: 'German basics for absolute beginners.',
      de: 'Deutsch-Grundlagen für absolute Anfänger.',
      ar: 'أساسيات الألمانية للمبتدئين الكاملين.',
    },
    thumbnail: '/images/courses/german-beginners.jpg',
    price: 12000,
    currency: 'SYP',
    level: 'beginner',
    duration: 30,
    category: 'Languages',
    tags: ['german', 'beginner', 'language', 'basics'],
    isPublished: true,
    isLiveStream: false,
    enrollmentCount: 1500,
    rating: 4.4,
    reviews: [],
    lessons: [
      {
        order: 1,
        title: {
          en: 'German Alphabet',
          de: 'Deutsches Alphabet',
          ar: 'الأبجدية الألمانية',
        },
        description: {
          en: 'Learn the German alphabet and pronunciation.',
          de: 'Lernen Sie das deutsche Alphabet und die Aussprache.',
          ar: 'تعلم الأبجدية الألمانية والنطق.',
        },
        content: {
          en: 'A, B, C... with umlauts!',
          de: 'A, B, C... mit Umlauten!',
          ar: 'أ، ب، ت... مع الحروف المتحركة!',
        },
        duration: 20,
        isPreview: true,
        resources: [],
      },
    ],
    materials: [],
    groups: [],
  },
  {
    slug: 'conversational-arabic',
    title: {
      en: 'Conversational Arabic',
      de: 'Konversationelles Arabisch',
      ar: 'العربية المحادثة',
    },
    description: {
      en: 'Learn everyday Arabic conversation for travel and daily life.',
      de: 'Lernen Sie alltägliche arabische Konversation für Reisen und Alltag.',
      ar: 'تعلم المحادثة العربية اليومية للسفر والحياة اليومية.',
    },
    content: {
      en: 'Practical Arabic conversation skills.',
      de: 'Praktische arabische Konversationsfähigkeiten.',
      ar: 'مهارات المحادثة العربية العملية.',
    },
    thumbnail: '/images/courses/conversational-arabic.jpg',
    price: 18000,
    currency: 'SYP',
    level: 'beginner',
    duration: 22,
    category: 'Languages',
    tags: ['arabic', 'conversation', 'travel', 'daily'],
    isPublished: true,
    isLiveStream: false,
    enrollmentCount: 980,
    rating: 4.8,
    reviews: [],
    lessons: [
      {
        order: 1,
        title: {
          en: 'At the Restaurant',
          de: 'Im Restaurant',
          ar: 'في المطعم',
        },
        description: {
          en: 'Learn how to order food and interact in restaurants.',
          de: 'Lernen Sie, wie man Essen bestellt und in Restaurants interagiert.',
          ar: 'تعلم كيفية طلب الطعام والتفاعل في المطاعم.',
        },
        content: {
          en: 'Menu, ordering, paying...',
          de: 'Menü, Bestellung, Bezahlung...',
          ar: 'القائمة، الطلب، الدفع...',
        },
        duration: 35,
        isPreview: true,
        resources: [],
      },
    ],
    materials: [],
    groups: [],
  },
];

async function seedCourses() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Find an instructor user or create a placeholder
    let instructor = await User.findOne({ role: 'instructor' });
    
    if (!instructor) {
      // Create a default instructor if none exists
      instructor = await User.create({
        email: 'instructor@example.com',
        password: 'password123',
        name: 'Default Instructor',
        role: 'instructor',
        locale: 'en',
        country: 'US',
        instructorProfile: {
          bio: {
            en: 'Experienced language instructor',
            de: 'Erfahrener Sprachlehrer',
            ar: 'مدرب لغات ذو خبرة',
          },
          specialization: ['English', 'German', 'Arabic'],
          rating: 4.8,
          totalStudents: 5000,
          totalCourses: 6,
        },
      });
      console.log('Created default instructor:', instructor._id);
    }

    // Clear existing courses
    await Course.deleteMany({});
    console.log('Cleared existing courses');

    // Insert sample courses
    const coursesWithInstructor = sampleCourses.map(course => ({
      ...course,
      instructorId: instructor._id,
      publishedAt: new Date(),
    }));

    const createdCourses = await Course.insertMany(coursesWithInstructor);
    console.log(`Created ${createdCourses.length} courses`);

    // Update instructor's course count
    instructor.instructorProfile!.totalCourses = createdCourses.length;
    await instructor.save();

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedCourses();
}

export default seedCourses;
