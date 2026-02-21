import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// Review subdocument interface
export interface IReview {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}


// Google Drive Material subdocument interface
export interface IGoogleDriveLink {
  _id?: Types.ObjectId;
  name: {
    en: string;
    de: string;
    ar: string;
  };
  url: string;
  type: 'folder' | 'file' | 'document' | 'spreadsheet' | 'presentation';
  createdAt: Date;
}

// Lesson subdocument interface
export interface ILesson {
  _id: Types.ObjectId;
  order: number;
  title: {
    en: string;
    de: string;
    ar: string;
  };
  description: {
    en: string;
    de: string;
    ar: string;
  };
  content: {
    en: string;
    de: string;
    ar: string;
  };
  videoUrl?: string;
  youtubeVideoId?: string; // For privacy-focused YouTube embedding
  duration: number; // in minutes
  isLiveStream: boolean;
  scheduledDateTime?: Date;
  jitsiRoomName?: string;
  resources: {
    type: 'pdf' | 'video' | 'link';
    url: string;
    name: string;
  }[];
  googleDriveLinks: IGoogleDriveLink[];
  isPreview: boolean;
  isPublished: boolean; // For progressive lesson release in uploaded courses
  createdAt: Date;
}


// Material subdocument interface
export interface IMaterial {
  _id: Types.ObjectId;
  name: {
    en: string;
    de: string;
    ar: string;
  };
  type: 'pdf' | 'video' | 'document';
  fileUrl: string;
  fileSize: number;
  isAccessibleAfterCourse: boolean;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
}

// Group subdocument interface
export interface IGroup {
  _id: Types.ObjectId;
  name: {
    en: string;
    de: string;
    ar: string;
  };
  description: {
    en: string;
    de: string;
    ar: string;
  };
  lessonIds: Types.ObjectId[];
  order: number;
  maxStudents: number;
  studentIds: Types.ObjectId[];
  instructorId?: Types.ObjectId;
  schedule: IGroupSchedule[];
  notificationSettings: IGroupNotificationSettings;
  createdAt: Date;
}

// Group Schedule subdocument interface
export interface IGroupSchedule {
  _id: Types.ObjectId;
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  time: string; // HH:MM format
  lessonType: 'live' | 'recorded';
  lessonId?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
}

// Group Notification Settings subdocument interface
export interface IGroupNotificationSettings {
  enabled: boolean;
  earlyMorningEnabled: boolean;
  earlyMorningTime: string; // HH:MM format
  oneHourEnabled: boolean;
  notificationTypes: ('email' | 'in_app')[];
  alertType: 'live_lesson' | 'recorded_lesson';
}

export interface ICourse extends Document {
  slug: string;
  instructorId: Types.ObjectId;
  title: {
    en: string;
    de: string;
    ar: string;
  };
  description: {
    en: string;
    de: string;
    ar: string;
  };
  content: {
    en: string;
    de: string;
    ar: string;
  };
  thumbnail: string;
  price: number;
  currency: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // total hours
  category: string;
  tags: string[];
  lessons: ILesson[];
  materials: IMaterial[];
  groups: IGroup[];
  
  // Course type and approval workflow
  courseType: 'live' | 'uploaded';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: Types.ObjectId;
  approvalDate?: Date;
  submittedForApprovalAt?: Date;
  rejectionReason?: string;
  
  // Price setting workflow
  priceSetBy?: Types.ObjectId;
  priceSetAt?: Date;
  
  // Publishing
  isPublished: boolean;
  isLiveStream: boolean;
  publishedAt?: Date;
  
  enrollmentCount: number;
  rating: number;
  reviews: IReview[];
  createdAt: Date;
  updatedAt: Date;
  calculateRating(): number;
}



// Review Schema
const ReviewSchema = new Schema<IReview>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Google Drive Link Schema
const GoogleDriveLinkSchema = new Schema<IGoogleDriveLink>({
  name: {
    en: { type: String, required: true },
    de: { type: String, required: true },
    ar: { type: String, required: true },
  },
  url: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['folder', 'file', 'document', 'spreadsheet', 'presentation'],
    default: 'file',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Lesson Schema
const LessonSchema = new Schema<ILesson>({
  order: {
    type: Number,
    required: true,
  },
  title: {
    en: { type: String, required: true },
    de: { type: String, default: '' },
    ar: { type: String, default: '' },
  },
  description: {
    en: { type: String, default: '' },
    de: { type: String, default: '' },
    ar: { type: String, default: '' },
  },
  content: {
    en: { type: String, default: '' },
    de: { type: String, default: '' },
    ar: { type: String, default: '' },
  },
  videoUrl: {
    type: String,
    default: null,
  },
  youtubeVideoId: {
    type: String,
    default: null,
  },
  duration: {
    type: Number,
    default: 0,
  },
  isLiveStream: {
    type: Boolean,
    default: false,
  },
  scheduledDateTime: {
    type: Date,
    default: null,
  },
  jitsiRoomName: {
    type: String,
    default: null,
  },
  resources: [{
    type: {
      type: String,
      enum: ['pdf', 'video', 'link'],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  }],
  googleDriveLinks: [GoogleDriveLinkSchema],
  isPreview: {
    type: Boolean,
    default: false,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


// Material Schema
const MaterialSchema = new Schema<IMaterial>({
  name: {
    en: { type: String, required: true },
    de: { type: String, required: true },
    ar: { type: String, required: true },
  },
  type: {
    type: String,
    enum: ['pdf', 'video', 'document'],
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    default: 0,
  },
  isAccessibleAfterCourse: {
    type: Boolean,
    default: true,
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Group Schedule Schema
const GroupScheduleSchema = new Schema<IGroupSchedule>({
  dayOfWeek: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true,
  },
  time: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:MM format
  },
  lessonType: {
    type: String,
    enum: ['live', 'recorded'],
    required: true,
  },
  lessonId: {
    type: Schema.Types.ObjectId,
    ref: 'Lesson',
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Group Notification Settings Schema
const GroupNotificationSettingsSchema = new Schema<IGroupNotificationSettings>({
  enabled: {
    type: Boolean,
    default: true,
  },
  earlyMorningEnabled: {
    type: Boolean,
    default: true,
  },
  earlyMorningTime: {
    type: String,
    default: '08:00',
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:MM format
  },
  oneHourEnabled: {
    type: Boolean,
    default: true,
  },
  notificationTypes: [{
    type: String,
    enum: ['email', 'in_app'],
    default: ['email', 'in_app'],
  }],
  alertType: {
    type: String,
    enum: ['live_lesson', 'recorded_lesson'],
    default: 'live_lesson',
  },
});

// Group Schema
const GroupSchema = new Schema<IGroup>({
  name: {
    en: { type: String, required: true },
    de: { type: String, required: true },
    ar: { type: String, required: true },
  },
  description: {
    en: { type: String, default: '' },
    de: { type: String, default: '' },
    ar: { type: String, default: '' },
  },
  lessonIds: [{
    type: Schema.Types.ObjectId,
  }],
  order: {
    type: Number,
    default: 0,
  },
  maxStudents: {
    type: Number,
    default: 20,
    min: 1,
    max: 100,
  },
  studentIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  instructorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  schedule: [GroupScheduleSchema],
  notificationSettings: {
    type: GroupNotificationSettingsSchema,
    default: () => ({}),
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Main Course Schema
const CourseSchema = new Schema<ICourse>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    instructorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      en: { type: String, required: true },
      de: { type: String, default: '' },
      ar: { type: String, default: '' },
    },
    description: {
      en: { type: String, required: true },
      de: { type: String, default: '' },
      ar: { type: String, default: '' },
    },
    content: {
      en: { type: String, default: '' },
      de: { type: String, default: '' },
      ar: { type: String, default: '' },
    },
    thumbnail: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'SYP'],
      default: 'USD',
    },

    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    duration: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      required: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    lessons: [LessonSchema],
    materials: [MaterialSchema],
    groups: [GroupSchema],
    
    // Course type and approval workflow
    courseType: {
      type: String,
      enum: ['live', 'uploaded'],
      default: 'uploaded',
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvalDate: {
      type: Date,
      default: null,
    },
    submittedForApprovalAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    
    // Price setting workflow
    priceSetBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    priceSetAt: {
      type: Date,
      default: null,
    },
    
    // Publishing
    isPublished: {
      type: Boolean,
      default: false,
    },
    isLiveStream: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    enrollmentCount: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: [ReviewSchema],
  },
  {
    timestamps: true,
  }
);


// Indexes for performance and search
// Note: slug already has unique: true in schema definition, so no need for explicit index
CourseSchema.index({ instructorId: 1 });

CourseSchema.index({ isPublished: 1 });
CourseSchema.index({ category: 1 });
CourseSchema.index({ level: 1 });
CourseSchema.index({ price: 1 });
CourseSchema.index({ rating: -1 });
CourseSchema.index({ enrollmentCount: -1 });
CourseSchema.index({ createdAt: -1 });

// Text indexes for multi-language search
CourseSchema.index({ 'title.en': 'text', 'title.de': 'text', 'title.ar': 'text' });
CourseSchema.index({ 'description.en': 'text', 'description.de': 'text', 'description.ar': 'text' });
CourseSchema.index({ 'content.en': 'text', 'content.de': 'text', 'content.ar': 'text' });
CourseSchema.index({ tags: 'text' });

// Compound indexes for common queries
CourseSchema.index({ isPublished: 1, category: 1, level: 1 });
CourseSchema.index({ isPublished: 1, rating: -1, enrollmentCount: -1 });





// Method to calculate average rating
CourseSchema.methods.calculateRating = function() {
  const course = this as ICourse;
  if (course.reviews.length === 0) {
    course.rating = 0;
  } else {
    const sum = course.reviews.reduce((acc: number, review: IReview) => acc + review.rating, 0);
    course.rating = Math.round((sum / course.reviews.length) * 10) / 10;
  }
  return course.rating;
};

// Static method to get course with populated groups
CourseSchema.statics.findWithGroups = function(courseId: string) {
  return this.findById(courseId).populate('groups.studentIds', 'name email');
};

// Method to add lesson to course
CourseSchema.methods.addLesson = function(lessonData: Partial<ILesson>) {
  const course = this as ICourse;
  const newLesson: ILesson = {
    _id: new Types.ObjectId(),
    order: course.lessons.length + 1,
    title: lessonData.title || { en: '', de: '', ar: '' },
    description: lessonData.description || { en: '', de: '', ar: '' },
    content: lessonData.content || { en: '', de: '', ar: '' },
    duration: lessonData.duration || 0,
    isLiveStream: lessonData.isLiveStream || false,
    resources: lessonData.resources || [],
    googleDriveLinks: lessonData.googleDriveLinks || [],
    isPreview: lessonData.isPreview || false,
    isPublished: lessonData.isPublished || false,
    createdAt: new Date(),
    ...lessonData,
  };
  
  course.lessons.push(newLesson);
  return newLesson;
};


// Method to publish lesson (for progressive release)
CourseSchema.methods.publishLesson = function(lessonId: Types.ObjectId) {
  const course = this as ICourse;
  const lesson = course.lessons.find(l => l._id.toString() === lessonId.toString());
  if (lesson) {
    lesson.isPublished = true;
  }
  return lesson;
};





const Course: Model<ICourse> =
  mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);

export default Course;
