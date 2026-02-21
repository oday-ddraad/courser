import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: 
    | 'payment_approved' 
    | 'payment_rejected' 
    | 'course_enrolled' 
    | 'live_stream_starting' 
    | 'lesson_available' 
    | 'course_completed' 
    | 'admin_message' 
    | 'instructor_message'
    | 'course_approved'
    | 'course_rejected'
    | 'course_submitted';

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
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}


const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: [
        'payment_approved',
        'payment_rejected',
        'course_enrolled',
        'live_stream_starting',
        'lesson_available',
        'course_completed',
        'admin_message',
        'instructor_message',
        'course_approved',
        'course_rejected',
        'course_submitted',
      ],
      required: [true, 'Notification type is required'],
    },

    title: {
      en: { type: String, required: [true, 'English title is required'], trim: true },
      de: { type: String, required: [true, 'German title is required'], trim: true },
      ar: { type: String, required: [true, 'Arabic title is required'], trim: true },
    },
    message: {
      en: { type: String, required: [true, 'English message is required'], trim: true },
      de: { type: String, required: [true, 'German message is required'], trim: true },
      ar: { type: String, required: [true, 'Arabic message is required'], trim: true },
    },

    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    actionUrl: {
      type: String,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ type: 1 });

// Mark as read method
NotificationSchema.methods.markAsRead = async function(): Promise<void> {
  this.isRead = true;
  this.readAt = new Date();
  await this.save();
};

const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
