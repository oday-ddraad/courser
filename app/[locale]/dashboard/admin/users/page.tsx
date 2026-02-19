import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/mongodb/connection';
import { User } from '@/lib/mongodb/models';
import UsersManagement from '@/components/admin/UsersManagement';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'User Management - Admin Dashboard',
  };
}

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'admin') {
    redirect('/forbidden');
  }

  await connectDB();

  // Get initial users data
  const users = await User.find()
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const totalCount = await User.countDocuments();

  const serializedUsers = users.map(user => {
    // Serialize documents array if it exists
    const serializedDocuments = user.documents?.map((doc: any, index: number) => ({
      name: doc.name,
      uploadId: doc.uploadId?.toString(),
      fileType: doc.fileType,
      uploadedAt: doc.uploadedAt?.toISOString?.() || null,
      _id: doc._id?.toString() || `doc-${index}`,
    }));

    return {
      ...user,
      _id: user._id.toString(),
      createdAt: user.createdAt?.toISOString(),
      updatedAt: user.updatedAt?.toISOString(),
      phoneVerified: user.phoneVerified?.toISOString?.() || null,
      whatsappConsentAt: user.whatsappConsentAt?.toISOString?.() || null,
      profileCompletedAt: user.profileCompletedAt?.toISOString?.() || null,
      emailVerified: user.emailVerified?.toISOString?.() || null,
      documents: serializedDocuments,
    };
  });



  return (
    <UsersManagement 
      initialUsers={serializedUsers} 
      totalCount={totalCount} 
    />
  );

}
