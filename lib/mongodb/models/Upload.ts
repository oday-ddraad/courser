import mongoose, { Schema, Document } from 'mongoose';

export interface IUpload extends Document {
  userId: mongoose.Types.ObjectId;
  filename: string;
  originalName: string;
  mimeType: string;
  fileData: Buffer;
  size: number;
  documentName: string;
  uploadedAt: Date;
}

const UploadSchema = new Schema<IUpload>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  fileData: {
    type: Buffer,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  documentName: {
    type: String,
    default: 'Document',
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries
UploadSchema.index({ userId: 1, uploadedAt: -1 });

const Upload = mongoose.models.Upload || mongoose.model<IUpload>('Upload', UploadSchema);

export default Upload;
