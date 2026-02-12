import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmailTemplate extends Document {
  name: string;
  description?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: string[]; // Template variables like ['name', 'courseName']
  category: 'notification' | 'marketing' | 'transactional' | 'other';
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EmailTemplateSchema = new Schema<IEmailTemplate>(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Email subject is required'],
      trim: true,
    },
    htmlContent: {
      type: String,
      required: [true, 'HTML content is required'],
    },
    textContent: {
      type: String,
    },
    variables: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      enum: ['notification', 'marketing', 'transactional', 'other'],
      default: 'other',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
EmailTemplateSchema.index({ name: 1 }, { unique: true });
EmailTemplateSchema.index({ category: 1 });
EmailTemplateSchema.index({ isActive: 1 });

const EmailTemplate: Model<IEmailTemplate> =
  mongoose.models.EmailTemplate || mongoose.model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema);

export default EmailTemplate;
