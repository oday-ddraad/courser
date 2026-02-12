import connectDB from '../lib/mongodb/connection';
import { initializeEmailTemplates } from '../lib/email/init-templates';

/**
 * Seed email templates script
 * Run with: pnpm seed:templates
 */
async function seedEmailTemplates() {
  try {
    console.log('🚀 Connecting to database...');
    await connectDB();
    
    console.log('📧 Initializing email templates...');
    const result = await initializeEmailTemplates();
    
    if (result.success) {
      console.log('\n✅ Email templates seeded successfully!');
      console.log(`   Created: ${result.created} templates`);
      console.log(`   Existing: ${result.existing} templates`);
      process.exit(0);
    } else {
      console.error('\n❌ Failed to seed email templates:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error seeding email templates:', error);
    process.exit(1);
  }
}

// Run the seed function
seedEmailTemplates();
