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
  // A/B Testing fields
  abTest?: {
    enabled: boolean;
    variantA: {
      subject: string;
      htmlContent: string;
      textContent?: string;
    };
    variantB: {
      subject: string;
      htmlContent: string;
      textContent?: string;
    };
    splitPercentage: number; // Percentage for variant A (0-100)
    testDuration: number; // Days
    startDate?: Date;
    status: 'draft' | 'running' | 'completed' | 'paused';
    winner?: 'A' | 'B' | null;
    results?: {
      variantASent: number;
      variantBSent: number;
      variantAOpens: number;
      variantBOpens: number;
      variantAClicks: number;
      variantBClicks: number;
    };
  };
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
    // A/B Testing fields
    abTest: {
      enabled: {
        type: Boolean,
        default: false,
      },
      variantA: {
        subject: String,
        htmlContent: String,
        textContent: String,
      },
      variantB: {
        subject: String,
        htmlContent: String,
        textContent: String,
      },
      splitPercentage: {
        type: Number,
        default: 50,
        min: 0,
        max: 100,
      },
      testDuration: {
        type: Number,
        default: 7, // 7 days default
      },
      startDate: Date,
      status: {
        type: String,
        enum: ['draft', 'running', 'completed', 'paused'],
        default: 'draft',
      },
      winner: {
        type: String,
        enum: ['A', 'B', null],
        default: null,
      },
      results: {
        variantASent: { type: Number, default: 0 },
        variantBSent: { type: Number, default: 0 },
        variantAOpens: { type: Number, default: 0 },
        variantBOpens: { type: Number, default: 0 },
        variantAClicks: { type: Number, default: 0 },
        variantBClicks: { type: Number, default: 0 },
      },
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
