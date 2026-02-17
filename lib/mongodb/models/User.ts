import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'instructor' | 'user';
  locale: 'en' | 'de' | 'ar';
  country: string;
  phoneNumber?: string;
  phoneVerified?: Date | null;
  whatsappNotificationsEnabled: boolean;
  whatsappConsent: boolean;
  whatsappConsentAt?: Date | null;
  avatar?: string;
  emailVerified?: Date | null;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;

  // Profile completion tracking
  profileCompleted: boolean;
  profileCompletedAt?: Date | null;

  // Address
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };

  // Documents
  documents?: {
    name: string;
    fileUrl: string;
    fileType: string;
    uploadedAt: Date;
  }[];

  // OAuth
  provider: 'credentials' | 'google';
  googleId?: string;

  isActive: boolean;
  jaasUserId?: string;
  jaasTokenGeneratedAt?: Date;
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
      required: function(this: IUser) {
        return this.provider === 'credentials';
      },
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },

    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },

    role: {
      type: String,
      enum: ['admin', 'instructor', 'user'],
      default: 'user',
      index: true,
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
      trim: true,
      minlength: 2,
      maxlength: 2,
      index: true,
    },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      match: [/^\+[1-9]\d{1,14}$/, 'Please provide a valid phone number in E.164 format'],
    },
    phoneVerified: {
      type: Date,
      default: null,
    },
    whatsappNotificationsEnabled: {
      type: Boolean,
      default: true,
    },
    whatsappConsent: {
      type: Boolean,
      default: false,
    },
    whatsappConsentAt: {
      type: Date,
      default: null,
    },
    avatar: {
      type: String,
      default: '',
    },
    emailVerified: {
      type: Schema.Types.Mixed,
      default: null,
    },

    emailVerificationToken: {
      type: String,
      default: null,
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
    },

    // Profile completion tracking
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    profileCompletedAt: {
      type: Date,
      default: null,
    },

    // Address
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
    },

    // Documents
    documents: [{
      name: { type: String, required: true },
      fileUrl: { type: String, required: true },
      fileType: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now },
    }],

    // OAuth
    provider: {
      type: String,
      enum: ['credentials', 'google'],
      default: 'credentials',
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    isActive: {

      type: Boolean,
      default: true,
      index: true,
    },
    jaasUserId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    jaasTokenGeneratedAt: {
      type: Date,
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
UserSchema.index({ profileCompleted: 1 });
UserSchema.index({ provider: 1 });
UserSchema.index({ googleId: 1 });


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
