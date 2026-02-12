import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmailSettings extends Document {
  // Sending limits
  dailyLimit: number;
  monthlyLimit: number;
  
  // Warning thresholds (percentage)
  dailyWarningThreshold: number; // e.g., 80 means warn at 80% of daily limit
  monthlyWarningThreshold: number;
  
  // Current usage (reset automatically)
  dailySent: number;
  monthlySent: number;
  lastDailyReset: Date;
  lastMonthlyReset: Date;
  
  // Notification settings
  notifyAdminOnLimit: boolean;
  adminEmail: string;
  
  // Resend configuration
  resendApiKey?: string; // Encrypted
  defaultFromEmail: string;
  defaultFromName: string;
  
  // Feature flags
  emailEnabled: boolean;
  trackOpens: boolean;
  trackClicks: boolean;
  
  updatedBy: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  isDailyLimitReached(): boolean;
  isMonthlyLimitReached(): boolean;
  shouldShowDailyWarning(): boolean;
  shouldShowMonthlyWarning(): boolean;
  incrementSent(count?: number): Promise<void>;
  resetDaily(): Promise<void>;
  resetMonthly(): Promise<void>;
}


const EmailSettingsSchema = new Schema<IEmailSettings>(
  {
    dailyLimit: {
      type: Number,
      default: 100,
      min: 0,
    },
    monthlyLimit: {
      type: Number,
      default: 3000,
      min: 0,
    },
    dailyWarningThreshold: {
      type: Number,
      default: 80,
      min: 0,
      max: 100,
    },
    monthlyWarningThreshold: {
      type: Number,
      default: 80,
      min: 0,
      max: 100,
    },
    dailySent: {
      type: Number,
      default: 0,
    },
    monthlySent: {
      type: Number,
      default: 0,
    },
    lastDailyReset: {
      type: Date,
      default: Date.now,
    },
    lastMonthlyReset: {
      type: Date,
      default: Date.now,
    },
    notifyAdminOnLimit: {
      type: Boolean,
      default: true,
    },
    adminEmail: {
      type: String,
      default: '',
    },
    resendApiKey: {
      type: String,
      select: false, // Don't include in queries by default
    },
    defaultFromEmail: {
      type: String,
      default: 'noreply@yourdomain.com',
    },
    defaultFromName: {
      type: String,
      default: 'Your Platform',
    },
    emailEnabled: {
      type: Boolean,
      default: true,
    },
    trackOpens: {
      type: Boolean,
      default: true,
    },
    trackClicks: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Static method to get or create settings
EmailSettingsSchema.statics.getSettings = async function(): Promise<IEmailSettings> {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Method to check if daily limit is reached
EmailSettingsSchema.methods.isDailyLimitReached = function(): boolean {
  return this.dailySent >= this.dailyLimit;
};

// Method to check if monthly limit is reached
EmailSettingsSchema.methods.isMonthlyLimitReached = function(): boolean {
  return this.monthlySent >= this.monthlyLimit;
};

// Method to check if daily warning should be shown
EmailSettingsSchema.methods.shouldShowDailyWarning = function(): boolean {
  const percentage = (this.dailySent / this.dailyLimit) * 100;
  return percentage >= this.dailyWarningThreshold && !this.isDailyLimitReached();
};

// Method to check if monthly warning should be shown
EmailSettingsSchema.methods.shouldShowMonthlyWarning = function(): boolean {
  const percentage = (this.monthlySent / this.monthlyLimit) * 100;
  return percentage >= this.monthlyWarningThreshold && !this.isMonthlyLimitReached();
};

// Method to increment sent count
EmailSettingsSchema.methods.incrementSent = async function(count: number = 1): Promise<void> {
  this.dailySent += count;
  this.monthlySent += count;
  await this.save();
};

// Method to reset daily counter
EmailSettingsSchema.methods.resetDaily = async function(): Promise<void> {
  this.dailySent = 0;
  this.lastDailyReset = new Date();
  await this.save();
};

// Method to reset monthly counter
EmailSettingsSchema.methods.resetMonthly = async function(): Promise<void> {
  this.monthlySent = 0;
  this.lastMonthlyReset = new Date();
  await this.save();
};

interface IEmailSettingsModel extends Model<IEmailSettings> {
  getSettings(): Promise<IEmailSettings>;
}

const EmailSettings: IEmailSettingsModel =
  (mongoose.models.EmailSettings as IEmailSettingsModel) || 
  mongoose.model<IEmailSettings, IEmailSettingsModel>('EmailSettings', EmailSettingsSchema);

export default EmailSettings;
