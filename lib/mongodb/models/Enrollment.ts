import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IEnrollment extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  paymentId?: Types.ObjectId;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  paymentStatus?: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'free' | 'expired' | 'refunded';
  amountPaid?: number;
  currency?: 'USD' | 'EUR' | 'SYP';

  progress: {
    completedLessons: Types.ObjectId[];
    lastAccessedLesson?: Types.ObjectId;
    lastAccessedAt?: Date;
    completionPercentage: number;
    lessonWatchTimes: {
      lessonId: Types.ObjectId;
      watchTime: number; // in seconds
      percentage: number; // 0-100
      lastUpdated: Date;
    }[];
  };
  enrolledAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  completeLesson(lessonId: Types.ObjectId, totalLessons: number): IEnrollment;
  updateCompletionPercentage(totalLessons: number): number;
}



const EnrollmentSchema = new Schema<IEnrollment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled', 'free', 'expired', 'refunded'],
      default: 'pending',
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'SYP'],
      default: 'USD',
    },
    progress: {

      completedLessons: [{
        type: Schema.Types.ObjectId,
      }],
      lastAccessedLesson: {
        type: Schema.Types.ObjectId,
        default: null,
      },
      lastAccessedAt: {
        type: Date,
        default: null,
      },
      completionPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      lessonWatchTimes: [{
        lessonId: {
          type: Schema.Types.ObjectId,
          required: true,
        },
        watchTime: {
          type: Number,
          default: 0,
        },
        percentage: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
        lastUpdated: {
          type: Date,
          default: Date.now,
        },
      }],
    },

    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
EnrollmentSchema.index({ userId: 1 });
EnrollmentSchema.index({ courseId: 1 });
EnrollmentSchema.index({ status: 1 });
EnrollmentSchema.index({ enrolledAt: -1 });
EnrollmentSchema.index({ 'progress.completionPercentage': 1 });
EnrollmentSchema.index({ paymentStatus: 1 });


// Compound indexes for common queries
EnrollmentSchema.index({ userId: 1, status: 1 });
EnrollmentSchema.index({ courseId: 1, status: 1 });

// Method to update completion percentage
EnrollmentSchema.methods.updateCompletionPercentage = function(totalLessons: number) {
  if (totalLessons === 0) {
    this.progress.completionPercentage = 0;
  } else {
    this.progress.completionPercentage = Math.round(
      (this.progress.completedLessons.length / totalLessons) * 100
    );
  }
  
  // Auto-mark as completed if 100%
  if (this.progress.completionPercentage === 100 && this.status !== 'completed') {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  return this.progress.completionPercentage;
};

// Method to mark lesson as completed
EnrollmentSchema.methods.completeLesson = function(lessonId: Types.ObjectId, totalLessons: number) {
  const lessonIdStr = lessonId.toString();
  const alreadyCompleted = this.progress.completedLessons.some(
    (id: Types.ObjectId) => id.toString() === lessonIdStr
  );
  
  if (!alreadyCompleted) {
    this.progress.completedLessons.push(lessonId);
    this.updateCompletionPercentage(totalLessons);
  }
  
  this.progress.lastAccessedLesson = lessonId;
  this.progress.lastAccessedAt = new Date();
  
  return this;
};

const Enrollment: Model<IEnrollment> =
  mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);

export default Enrollment;
