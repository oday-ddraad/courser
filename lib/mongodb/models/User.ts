import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'instructor' | 'user';
  locale: 'en' | 'de' | 'ar';
  country: string; // ISO 3166-1 alpha-2 country code (e.g., 'US', 'DE', 'SA', 'SY')
  phoneNumber?: string; // E.164 format (e.g., +1234567890)
  phoneVerified?: Date;
  whatsappNotificationsEnabled: boolean;
  avatar?: string;
  emailVerified?: Date;
  isActive: boolean;
  instructorProfile?: {
    bio: {
      en: string;
      de: string;
      ar: string;
    };
    specialization: string[];
    rating: number;
    totalStudents: number;
    totalCourses: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'instructor', 'user'],
      default: 'user',
    },
    locale: {
      type: String,
      enum: ['en', 'de', 'ar'],
      default: 'en',
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      uppercase: true,
      minlength: 2,
      maxlength: 2,
    },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true, // Allow null/undefined values
      trim: true,
      match: [/^\+[1-9]\d{1,14}$/, 'Please provide a valid phone number in E.164 format (e.g., +1234567890)'],
    },
    phoneVerified: {
      type: Date,
      default: null,
    },
    whatsappNotificationsEnabled: {
      type: Boolean,
      default: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    emailVerified: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    instructorProfile: {
      bio: {
        en: { type: String, default: '' },
        de: { type: String, default: '' },
        ar: { type: String, default: '' },
      },
      specialization: {
        type: [String],
        default: [],
      },
      rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      totalStudents: {
        type: Number,
        default: 0,
      },
      totalCourses: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
// Note: email already has unique: true in schema definition
UserSchema.index({ role: 1 });
UserSchema.index({ country: 1 });
UserSchema.index({ isActive: 1 });

// Only include instructorProfile if role is instructor
// Using async function to avoid TypeScript callback typing issues
UserSchema.pre('save', async function (this: IUser) {
  if (this.role !== 'instructor') {
    this.instructorProfile = undefined;
  }
});

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
