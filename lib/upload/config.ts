import path from 'path';
import { promises as fs } from 'fs';

// Upload configuration
export const UPLOAD_CONFIG = {
  // Upload directory - outside public folder for security
  uploadDir: path.join(process.cwd(), 'uploads'),
  
  // Max file size: 5MB
  maxFileSize: 5 * 1024 * 1024,
  
  // Allowed file types
  allowedTypes: [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ],
  
  // Allowed extensions
  allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
};

// Ensure upload directory exists
export async function ensureUploadDir(): Promise<string> {
  const uploadDir = UPLOAD_CONFIG.uploadDir;
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
  return uploadDir;
}

// Generate secure filename
export function generateFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(originalName).toLowerCase();
  return `${timestamp}-${random}${extension}`;
}

// Validate file type
export function validateFileType(mimeType: string, filename: string): boolean {
  const extension = path.extname(filename).toLowerCase();
  return (
    UPLOAD_CONFIG.allowedTypes.includes(mimeType) &&
    UPLOAD_CONFIG.allowedExtensions.includes(extension)
  );
}

// Get file path for user document
export function getUserFilePath(userId: string, filename: string): string {
  return path.join(UPLOAD_CONFIG.uploadDir, 'documents', userId, filename);
}

// Ensure user document directory exists
export async function ensureUserDir(userId: string): Promise<string> {
  const userDir = path.join(UPLOAD_CONFIG.uploadDir, 'documents', userId);
  try {
    await fs.access(userDir);
  } catch {
    await fs.mkdir(userDir, { recursive: true });
  }
  return userDir;
}

// Get public URL for file (used in database)
export function getFileUrl(userId: string, filename: string): string {
  // Store relative path in database, will be served via API
  return `/api/file/documents/${userId}/${filename}`;
}
