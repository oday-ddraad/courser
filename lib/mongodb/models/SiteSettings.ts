import mongoose, { Schema, Document, models } from 'mongoose';

export interface ISiteSettings extends Document {
  whatsappLink: string;
  instagramLink: string;
  facebookLink: string;
  telegramLink: string;
  updatedAt: Date;
  updatedBy: Schema.Types.ObjectId;
}

const SiteSettingsSchema: Schema = new Schema({
  whatsappLink: { type: String, default: '' },
  instagramLink: { type: String, default: '' },
  facebookLink: { type: String, default: '' },
  telegramLink: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

export default models.SiteSettings || mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema);
