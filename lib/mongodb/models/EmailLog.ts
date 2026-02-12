import mongoose, { Schema, Document, Model } from 'mongoose';

export type EmailStatus = 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed' | 'complained';

export interface IEmailLog extends Document {
  to: string;
  from: string;
  subject: string;
  templateId?: mongoose.Types.ObjectId;
  templateName?: string;
  status: EmailStatus;
  resendId?: string; // Resend message ID
  error?: string;
  metadata?: {
    userId?: mongoose.Types.ObjectId;
    courseId?: mongoose.Types.ObjectId;
    groupId?: mongoose.Types.ObjectId;
    notificationId?: mongoose.Types.ObjectId;
    [key: string]: any;
  };
  openedAt?: Date;
  clickedAt?: Date;
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmailLogSchema = new Schema<IEmailLog>(
  {
    to: {
      type: String,
      required: [true, 'Recipient email is required'],
      lowercase: true,
      trim: true,
    },
    from: {
      type: String,
      required: [true, 'Sender email is required'],
      lowercase: true,
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Email subject is required'],
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'EmailTemplate',
    },
    templateName: {
      type: String,
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'complained'],
      default: 'sent',
    },
    resendId: {
      type: String,
    },
    error: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    openedAt: {
      type: Date,
    },
    clickedAt: {
      type: Date,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance and querying
EmailLogSchema.index({ to: 1 });
EmailLogSchema.index({ status: 1 });
EmailLogSchema.index({ templateId: 1 });
EmailLogSchema.index({ sentAt: -1 });
EmailLogSchema.index({ createdAt: -1 });
EmailLogSchema.index({ 'metadata.userId': 1 });
EmailLogSchema.index({ 'metadata.courseId': 1 });

// Compound indexes for common queries
EmailLogSchema.index({ status: 1, sentAt: -1 });
EmailLogSchema.index({ templateId: 1, sentAt: -1 });

const EmailLog: Model<IEmailLog> =
  mongoose.models.EmailLog || mongoose.model<IEmailLog>('EmailLog', EmailLogSchema);

export default EmailLog;
