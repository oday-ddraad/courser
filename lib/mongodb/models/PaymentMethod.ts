import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IPaymentMethod extends Document {
  name: {
    en: string;
    de: string;
    ar: string;
  };
  description: {
    en: string;
    de: string;
    ar: string;
  };
  instructions: {
    en: string;
    de: string;
    ar: string;
  };
  type: 'bank_transfer' | 'mobile_wallet' | 'crypto' | 'paypal' | 'custom';

  // Country targeting
  isGlobal: boolean;
  countries: string[]; // ISO country codes

  // Payment details
  paymentAddress: string;
  accountHolderName?: string;
  bankName?: string;
  swiftCode?: string;
  additionalDetails?: string;

  // Visual assets (base64)
  logo: string;
  qrCode?: string;

  // Proof requirements
  requiresOperationNumber: boolean;
  requiresScreenshot: boolean;
  operationNumberLabel?: {
    en: string;
    de: string;
    ar: string;
  };

  // Status/display
  isActive: boolean;
  sortOrder: number;

  // Audit
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentMethodSchema = new Schema<IPaymentMethod>(
  {
    name: {
      en: { type: String, required: true, trim: true },
      de: { type: String, required: true, trim: true },
      ar: { type: String, required: true, trim: true },
    },
    description: {
      en: { type: String, default: '', trim: true },
      de: { type: String, default: '', trim: true },
      ar: { type: String, default: '', trim: true },
    },
    instructions: {
      en: { type: String, default: '', trim: true },
      de: { type: String, default: '', trim: true },
      ar: { type: String, default: '', trim: true },
    },
    type: {
      type: String,
      enum: ['bank_transfer', 'mobile_wallet', 'crypto', 'paypal', 'custom'],
      required: true,
    },

    isGlobal: {
      type: Boolean,
      default: false,
      index: true,
    },
    countries: [
      {
        type: String,
        uppercase: true,
        trim: true,
      },
    ],

    paymentAddress: {
      type: String,
      required: true,
      trim: true,
    },
    accountHolderName: {
      type: String,
      default: '',
      trim: true,
    },
    bankName: {
      type: String,
      default: '',
      trim: true,
    },
    swiftCode: {
      type: String,
      default: '',
      trim: true,
    },
    additionalDetails: {
      type: String,
      default: '',
      trim: true,
    },

    logo: {
      type: String,
      required: true,
    },
    qrCode: {
      type: String,
      default: '',
    },

    requiresOperationNumber: {
      type: Boolean,
      default: false,
    },
    requiresScreenshot: {
      type: Boolean,
      default: true,
    },
    operationNumberLabel: {
      en: { type: String, default: 'Transaction Number', trim: true },
      de: { type: String, default: 'Transaktionsnummer', trim: true },
      ar: { type: String, default: 'رقم العملية', trim: true },
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes
PaymentMethodSchema.index({ isGlobal: 1, isActive: 1 });
PaymentMethodSchema.index({ countries: 1, isActive: 1 });
PaymentMethodSchema.index({ type: 1 });
PaymentMethodSchema.index({ sortOrder: 1 });

const PaymentMethod: Model<IPaymentMethod> =
  mongoose.models.PaymentMethod ||
  mongoose.model<IPaymentMethod>('PaymentMethod', PaymentMethodSchema);

export default PaymentMethod;
