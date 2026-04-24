import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb/connection';
import SiteSettings, { ISiteSettings } from '@/lib/mongodb/models/SiteSettings';
import { authOptions } from '@/lib/auth/config';

export async function GET() {
  await dbConnect();
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = !!session && session.user.role === 'admin';

    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = new SiteSettings({
        whatsappLink: '',
        instagramLink: '',
        facebookLink: '',
        telegramLink: '',
        updatedBy: session?.user?.id,
      });
      await settings.save();
    }

    // Public can read links for widget; admin gets full payload
    if (!isAdmin) {
      return NextResponse.json({
        success: true,
        data: {
          whatsappLink: settings.whatsappLink || '',
          instagramLink: settings.instagramLink || '',
          facebookLink: settings.facebookLink || '',
          telegramLink: settings.telegramLink || '',
        },
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  await dbConnect();
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { whatsappLink, instagramLink, facebookLink, telegramLink } = body;

    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = new SiteSettings({
        whatsappLink: whatsappLink || '',
        instagramLink: instagramLink || '',
        facebookLink: facebookLink || '',
        telegramLink: telegramLink || '',
        updatedBy: session.user.id,
      });
    } else {
      settings.whatsappLink = whatsappLink || '';
      settings.instagramLink = instagramLink || '';
      settings.facebookLink = facebookLink || '';
      settings.telegramLink = telegramLink || '';
      settings.updatedBy = session.user.id;
      settings.updatedAt = new Date();
    }

    await settings.save();

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error updating site settings:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
