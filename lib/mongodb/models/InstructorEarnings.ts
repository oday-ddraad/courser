import mongoose, { Schema, Document, Model, Types } from 'mongoose';

interface IRevenueShareConfig {
  courseId: Types.ObjectId;
  sharePercentage: number;
  setBy: Types.ObjectId;
  setAt: Date;
}

interface IPayoutHistory {
  _id?: Types.ObjectId;
  amount: number;
  currency: 'USD' | 'EUR' | 'SYP';
  paidAt: Date;
  paidBy: Types.ObjectId;
  note?: string;
  reference?: string;
}

interface IManualAdjustment {
  _id?: Types.ObjectId;
  amount: number;
  reason: string;
  adjustedBy: Types.ObjectId;
  adjustedAt: Date;
}

export interface IInstructorEarnings extends Document {
  instructorId: Types.ObjectId;
  totalRevenue: number;
  totalRefunded: number;
  netRevenue: number;
  currency: 'USD' | 'EUR' | 'SYP';

  paidAmount: number;
  pendingAmount: number;

  revenueShareConfig: IRevenueShareConfig[];
  payoutHistory: IPayoutHistory[];
  manualAdjustments: IManualAdjustment[];

  lastResetAt?: Date;
  lastResetBy?: Types.ObjectId;
  resetNote?: string;

  createdAt: Date;
  updatedAt: Date;
}

const InstructorEarningsSchema = new Schema<IInstructorEarnings>(
  {
    instructorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRefunded: {
      type: Number,
      default: 0,
      min: 0,
    },
    netRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'SYP'],
      default: 'USD',
      required: true,
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingAmount: {
      type: Number,
      default: 0,
    },

    revenueShareConfig: [
      {
        courseId: {
          type: Schema.Types.ObjectId,
          ref: 'Course',
          required: true,
        },
        sharePercentage: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
        setBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        setAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    payoutHistory: [
      {
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        currency: {
          type: String,
          enum: ['USD', 'EUR', 'SYP'],
          required: true,
          default: 'USD',
        },
        paidAt: {
          type: Date,
          required: true,
          default: Date.now,
        },
        paidBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        note: {
          type: String,
          default: '',
          trim: true,
        },
        reference: {
          type: String,
          default: '',
          trim: true,
        },
      },
    ],

    manualAdjustments: [
      {
        amount: {
          type: Number,
          required: true,
        },
        reason: {
          type: String,
          required: true,
          trim: true,
        },
        adjustedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        adjustedAt: {
          type: Date,
          required: true,
          default: Date.now,
        },
      },
    ],

    lastResetAt: {
      type: Date,
      default: null,
    },
    lastResetBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resetNote: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);





// Indexes
InstructorEarningsSchema.index({ instructorId: 1 }, { unique: true });
InstructorEarningsSchema.index({ totalRevenue: -1 });
InstructorEarningsSchema.index({ 'revenueShareConfig.courseId': 1 });

const InstructorEarnings: Model<IInstructorEarnings> =
  mongoose.models.InstructorEarnings ||
  mongoose.model<IInstructorEarnings>('InstructorEarnings', InstructorEarningsSchema);

export default InstructorEarnings;
