import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWhatsAppSettings extends Document {
  monthlyLimit: number;
  warningThreshold: number; // Percentage (e.g., 80 for 80%)
  monthlyConversations: number;
  conversationsResetDate: Date;
  lastConversationDate?: Date;
  totalConversations: number;
  activeConversations: number; // Conversations within 24h window
  adminEmail: string;
  notifyAdminOnLimit: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface WhatsAppSettingsModel extends Model<IWhatsAppSettings> {
  getSettings(): Promise<IWhatsAppSettings>;
  incrementConversationCount(): Promise<void>;
  resetMonthlyCounters(): Promise<void>;
  checkAndUpdateActiveConversations(): Promise<number>;
}

const WhatsAppSettingsSchema = new Schema<IWhatsAppSettings, WhatsAppSettingsModel>(
  {
    monthlyLimit: {
      type: Number,
      default: 1000, // Default 1000 conversations per month
      min: 0,
    },
    warningThreshold: {
      type: Number,
      default: 80, // 80% warning threshold
      min: 0,
      max: 100,
    },
    monthlyConversations: {
      type: Number,
      default: 0,
      min: 0,
    },
    conversationsResetDate: {
      type: Date,
      default: () => new Date(),
    },
    lastConversationDate: {
      type: Date,
      default: null,
    },
    totalConversations: {
      type: Number,
      default: 0,
      min: 0,
    },
    activeConversations: {
      type: Number,
      default: 0,
      min: 0,
    },
    adminEmail: {
      type: String,
      default: '',
    },
    notifyAdminOnLimit: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Static method to get or create settings
WhatsAppSettingsSchema.statics.getSettings = async function(): Promise<IWhatsAppSettings> {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Increment conversation count
WhatsAppSettingsSchema.statics.incrementConversationCount = async function(): Promise<void> {
  const now = new Date();
  const settings = await this.getSettings();
  
  // Check if we need to reset monthly counters
  const resetDate = new Date(settings.conversationsResetDate);
  const currentMonth = now.getMonth();
  const resetMonth = resetDate.getMonth();
  
  if (currentMonth !== resetMonth || now.getFullYear() !== resetDate.getFullYear()) {
    settings.monthlyConversations = 0;
    settings.conversationsResetDate = now;
  }
  
  settings.monthlyConversations += 1;
  settings.totalConversations += 1;
  settings.lastConversationDate = now;
  
  await settings.save();
};

// Reset monthly counters
WhatsAppSettingsSchema.statics.resetMonthlyCounters = async function(): Promise<void> {
  await this.updateOne(
    {},
    {
      $set: {
        monthlyConversations: 0,
        conversationsResetDate: new Date(),
      },
    }
  );
};

// Check and update active conversations (within 24h window)
WhatsAppSettingsSchema.statics.checkAndUpdateActiveConversations = async function(): Promise<number> {
  const settings = await this.getSettings();
  const now = new Date();
  
  // If last conversation was more than 24h ago, reset active count
  if (settings.lastConversationDate) {
    const lastConv = new Date(settings.lastConversationDate);
    const hoursDiff = (now.getTime() - lastConv.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      settings.activeConversations = 0;
      await settings.save();
    }
  }
  
  return settings.activeConversations;
};

const WhatsAppSettings: WhatsAppSettingsModel =
  (mongoose.models.WhatsAppSettings as WhatsAppSettingsModel) ||
  mongoose.model<IWhatsAppSettings, WhatsAppSettingsModel>('WhatsAppSettings', WhatsAppSettingsSchema);

export default WhatsAppSettings;
