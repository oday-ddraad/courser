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

const OTPSchema = new Schema<IOTP>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^\+[1-9]\d{1,14}$/, 'Please provide a valid phone number in E.164 format'],
    },
    code: {
      type: String,
      required: [true, 'OTP code is required'],
      select: false, // Don't return code by default for security
    },
    purpose: {
      type: String,
      enum: ['verification', 'password_reset', 'login'],
      default: 'verification',
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
      index: true, // Index for TTL cleanup
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

// TTL index to automatically delete expired OTPs after 24 hours
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

// Compound index for finding active OTPs by user and purpose
OTPSchema.index({ userId: 1, purpose: 1, isVerified: 1 });

// Static method to find active OTP
OTPSchema.statics.findActiveOTP = async function(
  userId: string,
  purpose: string
): Promise<IOTP | null> {
  return this.findOne({
    userId,
    purpose,
    isVerified: false,
    expiresAt: { $gt: new Date() },
  });
};

// Method to check if OTP is expired
OTPSchema.methods.isExpired = function(): boolean {
  return new Date() > this.expiresAt;
};

// Method to check if max attempts reached
OTPSchema.methods.isMaxAttemptsReached = function(): boolean {
  return this.attempts >= this.maxAttempts;
};

// Method to increment attempts
OTPSchema.methods.incrementAttempts = async function(): Promise<void> {
  this.attempts += 1;
  await this.save();
};

// Method to mark as verified
OTPSchema.methods.markVerified = async function(): Promise<void> {
  this.isVerified = true;
  await this.save();
};

interface OTPModel extends Model<IOTP> {
  findActiveOTP(userId: string, purpose: string): Promise<IOTP | null>;
}

const OTP: OTPModel =
  (mongoose.models.OTP as OTPModel) || mongoose.model<IOTP, OTPModel>('OTP', OTPSchema);

export default OTP;
