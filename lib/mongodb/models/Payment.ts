import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IPayment extends Document {
  enrollmentId: Types.ObjectId;
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  paymentMethodId: Types.ObjectId;

  amount: number;
  currency: 'USD' | 'EUR' | 'SYP';

  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired' | 'refunded';

  referenceCode: string;
  expiresAt: Date;
  reminderSentAt?: Date;

  operationNumber?: string;
  receiptScreenshots: string[];
  userNotes?: string;

  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  adminNotes?: string;

  refundedBy?: Types.ObjectId;
  refundedAt?: Date;
  refundReason?: string;

  submissionCount: number;
  lastSubmittedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    paymentMethodId: {
      type: Schema.Types.ObjectId,
      ref: 'PaymentMethod',
      required: true,
      index: true,
    },

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

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled', 'expired', 'refunded'],
      default: 'pending',
      index: true,
    },

    referenceCode: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    reminderSentAt: {
      type: Date,
      default: null,
    },

    operationNumber: {
      type: String,
      default: '',
      trim: true,
    },
    receiptScreenshots: [
      {
        type: String,
      },
    ],
    userNotes: {
      type: String,
      default: '',
      trim: true,
    },

    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
    },
    adminNotes: {
      type: String,
      default: '',
      trim: true,
    },

    refundedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
    refundReason: {
      type: String,
      default: '',
      trim: true,
    },

    submissionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastSubmittedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes
PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ courseId: 1, status: 1 });
PaymentSchema.index({ enrollmentId: 1 }, { unique: true });
PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ reviewedBy: 1 });
PaymentSchema.index({ paymentMethodId: 1 });
PaymentSchema.index({ referenceCode: 1 }, { unique: true, sparse: true });
PaymentSchema.index({ expiresAt: 1, status: 1 });

const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
