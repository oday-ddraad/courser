import { config } from 'dotenv';
import { readFile } from 'fs/promises';
import path from 'path';

config({ path: '.env.local' });

import connectDB from '../lib/mongodb/connection';
import User from '../lib/mongodb/models/User';
import Upload from '../lib/mongodb/models/Upload';


async function migrateFilesToMongoDB() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    console.log('Finding users with existing files...');
    
    // Find all users with documents that have fileUrl (old format)
    const users = await User.find({
      'documents.fileUrl': { $exists: true }
    });
    
    console.log(`Found ${users.length} users with files to migrate`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const user of users) {
      console.log(`\nProcessing user: ${user.email} (${user._id})`);
      
      for (const doc of user.documents || []) {
        // Check for old fileUrl property (pre-migration format)
        const oldDoc = doc as any;
        if (!oldDoc.fileUrl) {
          console.log(`  - Skipping document without fileUrl: ${doc.name}`);
          continue;
        }

        
        try {
          // Extract file path from fileUrl
          // fileUrl format: /api/file/documents/[userId]/[filename]
          const filePath = oldDoc.fileUrl.replace('/api/file/', 'uploads/');

          const fullPath = path.join(process.cwd(), filePath);
          
          console.log(`  - Reading file: ${fullPath}`);
          
          // Read file from disk
          const fileBuffer = await readFile(fullPath);
          
          // Extract filename from path
          const filename = path.basename(filePath);
          
          // Create upload document in MongoDB
          const upload = await Upload.create({
            userId: user._id,
            filename: filename,
            originalName: doc.name || filename,
            mimeType: oldDoc.fileType || 'application/octet-stream',
            fileData: fileBuffer,
            size: fileBuffer.length,
            documentName: doc.name || 'Document',
            uploadedAt: doc.uploadedAt || new Date(),
          });
          
          // Update the document reference in user
          (doc as any).uploadId = upload._id;
          // Remove the old fileUrl
          oldDoc.fileUrl = undefined;

          
          migratedCount++;
          console.log(`  ✓ Migrated: ${doc.name} -> Upload ID: ${upload._id}`);
          
        } catch (error: any) {
          errorCount++;
          console.error(`  ✗ Error migrating ${doc.name}:`, error.message);
        }
      }
      
      // Save the updated user documents
      await user.save();
      console.log(`  Saved user with migrated documents`);
    }
    
    console.log(`\n========================================`);
    console.log(`Migration Complete!`);
    console.log(`Total files migrated: ${migratedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`========================================`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateFilesToMongoDB();
