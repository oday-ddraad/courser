import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOTP extends Document {
  userId: mongoose.Types.ObjectId;
  phoneNumber: string;
  code: string; // Hashed OTP code
  purpose: 'verification' | 'password_reset' | 'login';
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface OTPModel extends Model<IOTP> {
  findActiveOTP(userId: string, purpose: string): Promise<IOTP | null>;
}

const OTPSchema = new Schema<IOTP, OTPModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'OTP code is required'],
    },
    purpose: {
      type: String,
      enum: ['verification', 'password_reset', 'login'],
      default: 'verification',
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
      min: 1,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index for automatic cleanup of expired OTPs
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to find active (non-verified, non-expired) OTP
OTPSchema.statics.findActiveOTP = function(
  userId: string,
  purpose: string
): Promise<IOTP | null> {
  return this.findOne({
    userId,
    purpose,
    isVerified: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
};

const OTP: OTPModel =
  (mongoose.models.OTP as OTPModel) ||
  mongoose.model<IOTP, OTPModel>('OTP', OTPSchema);

export default OTP;
