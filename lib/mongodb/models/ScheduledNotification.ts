import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IScheduledNotification extends Document {
  userId: Types.ObjectId;
  type: string;
  title: {
    en: string;
    de: string;
    ar: string;
  };
  message: {
    en: string;
    de: string;
    ar: string;
  };
  data?: Record<string, any>;
  actionUrl?: string;
  sendAt: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  lessonId?: Types.ObjectId;
  courseId?: Types.ObjectId;
  sentAt?: Date;
  error?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledNotificationSchema = new Schema<IScheduledNotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: [
        'live_lesson_reminder',
        'live_lesson_instructor_reminder',
        'live_lesson_final_reminder',
      ],
    },
    title: {
      en: { type: String, required: true, trim: true },
      de: { type: String, required: true, trim: true },
      ar: { type: String, required: true, trim: true },
    },
    message: {
      en: { type: String, required: true, trim: true },
      de: { type: String, required: true, trim: true },
      ar: { type: String, required: true, trim: true },
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    actionUrl: {
      type: String,
      trim: true,
    },
    sendAt: {
      type: Date,
      required: [true, 'Send time is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    lessonId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      index: true,
    },
    sentAt: {
      type: Date,
    },
    error: {
      type: String,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying
ScheduledNotificationSchema.index({ status: 1, sendAt: 1 });
ScheduledNotificationSchema.index({ userId: 1, status: 1 });

// Method to mark as sent
ScheduledNotificationSchema.methods.markAsSent = async function(): Promise<void> {
  this.status = 'sent';
  this.sentAt = new Date();
  await this.save();
};

// Method to mark as failed
ScheduledNotificationSchema.methods.markAsFailed = async function(error: string): Promise<void> {
  this.status = 'failed';
  this.error = error;
  this.retryCount += 1;
  await this.save();
};

// Static method to cancel notifications for a lesson
ScheduledNotificationSchema.statics.cancelForLesson = async function(
  lessonId: string
): Promise<number> {
  const result = await this.updateMany(
    { lessonId: new Types.ObjectId(lessonId), status: 'pending' },
    { $set: { status: 'cancelled' } }
  );
  return result.modifiedCount;
};

const ScheduledNotification: Model<IScheduledNotification> =
  mongoose.models.ScheduledNotification ||
  mongoose.model<IScheduledNotification>('ScheduledNotification', ScheduledNotificationSchema);

export default ScheduledNotification;
