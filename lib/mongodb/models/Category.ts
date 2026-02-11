import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory extends Document {
  name: {
    en: string;
    de: string;
    ar: string;
  };
  slug: string;
  description?: {
    en: string;
    de: string;
    ar: string;
  };
  icon?: string;
  color?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      en: { type: String, required: true, trim: true },
      de: { type: String, required: true, trim: true },
      ar: { type: String, required: true, trim: true },
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      en: { type: String, default: '' },
      de: { type: String, default: '' },
      ar: { type: String, default: '' },
    },
    icon: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: '#3B82F6', // Default blue color
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ sortOrder: 1 });
CategorySchema.index({ 'name.en': 'text', 'name.de': 'text', 'name.ar': 'text' });

const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export default Category;
