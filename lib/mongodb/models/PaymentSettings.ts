import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPaymentSettings extends Document {
  maxPendingPaymentsPerStudent: number;
  paymentExpiryHours: number;
  reminderAfterHours: number;
  allowResubmission: boolean;
  maxResubmissions: number;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSettingsSchema = new Schema<IPaymentSettings>(
  {
    maxPendingPaymentsPerStudent: {
      type: Number,
      default: 3,
      min: 1,
      max: 20,
    },
    paymentExpiryHours: {
      type: Number,
      default: 48,
      min: 1,
      max: 168,
    },
    reminderAfterHours: {
      type: Number,
      default: 24,
      min: 1,
      max: 167,
    },
    allowResubmission: {
      type: Boolean,
      default: true,
    },
    maxResubmissions: {
      type: Number,
      default: 5,
      min: 1,
      max: 50,
    },
  },
  { timestamps: true }
);

// Singleton-style usage: keep one settings doc, but index is optional for flexibility
PaymentSettingsSchema.index({ updatedAt: -1 });

const PaymentSettings: Model<IPaymentSettings> =
  mongoose.models.PaymentSettings ||
  mongoose.model<IPaymentSettings>('PaymentSettings', PaymentSettingsSchema);

export default PaymentSettings;
