import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb/connection';
import { PaymentMethod } from '@/lib/mongodb/models';
import { authOptions } from '@/lib/auth/config';

// GET /api/payment-methods/available?country=XX
// Returns active methods filtered by user's selected country + global methods
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await connectDB();

    const url = new URL(request.url);
    const countryParam = url.searchParams.get('country');
    const country = countryParam ? countryParam.trim().toUpperCase() : null;

    const query: Record<string, unknown> = {
      isActive: true,
    };

    if (country) {
      query.$or = [{ isGlobal: true }, { countries: country }];
    } else {
      query.isGlobal = true;
    }

    const paymentMethods = await PaymentMethod.find(query)
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    const safeMethods = paymentMethods.map((method: any) => ({
      _id: method._id.toString(),
      name: method.name,
      description: method.description,
      instructions: method.instructions,
      type: method.type,
      isGlobal: method.isGlobal,
      countries: method.countries || [],
      paymentAddress: method.paymentAddress,
      accountHolderName: method.accountHolderName || '',
      bankName: method.bankName || '',
      swiftCode: method.swiftCode || '',
      additionalDetails: method.additionalDetails || '',
      logo: method.logo,
      qrCode: method.qrCode || '',
      requiresOperationNumber: method.requiresOperationNumber,
      requiresScreenshot: method.requiresScreenshot,
      operationNumberLabel: method.operationNumberLabel,
      isActive: method.isActive,
      sortOrder: method.sortOrder,
      createdAt: method.createdAt?.toISOString?.() || method.createdAt,
      updatedAt: method.updatedAt?.toISOString?.() || method.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: safeMethods,
    });
  } catch (error) {
    console.error('Error fetching available payment methods:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch available payment methods' },
      { status: 500 }
    );
  }
}
