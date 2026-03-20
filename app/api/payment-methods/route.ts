import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb/connection';
import { PaymentMethod } from '@/lib/mongodb/models';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';
import mongoose from 'mongoose';


// GET /api/payment-methods - Admin list all payment methods
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !hasPermission(session.user.role, 'payment.method.manage')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await connectDB();

    const url = new URL(request.url);
    const isActive = url.searchParams.get('isActive');
    const type = url.searchParams.get('type');
    const country = url.searchParams.get('country');
    const search = url.searchParams.get('search');

    const query: Record<string, unknown> = {};

    if (isActive === 'true') query.isActive = true;
    if (isActive === 'false') query.isActive = false;
    if (type) query.type = type;
    if (country) {
      const countryCode = country.trim().toUpperCase();
      query.$or = [{ isGlobal: true }, { countries: countryCode }];
    }

    if (search?.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$and = [
        ...(Array.isArray(query.$and) ? query.$and : []),
        {
          $or: [
            { 'name.en': { $regex: escaped, $options: 'i' } },
            { 'name.de': { $regex: escaped, $options: 'i' } },
            { 'name.ar': { $regex: escaped, $options: 'i' } },
            { paymentAddress: { $regex: escaped, $options: 'i' } },
            { bankName: { $regex: escaped, $options: 'i' } },
            { accountHolderName: { $regex: escaped, $options: 'i' } },
          ],
        },
      ];
    }

    const paymentMethods = await PaymentMethod.find(query)
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    const serialized = paymentMethods.map((method: any) => ({
      ...method,
      _id: method._id.toString(),
      createdBy: method.createdBy?.toString?.() || method.createdBy || null,
      updatedBy: method.updatedBy?.toString?.() || method.updatedBy || null,
      createdAt: method.createdAt?.toISOString?.() || method.createdAt,
      updatedAt: method.updatedAt?.toISOString?.() || method.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: serialized,
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}

// POST /api/payment-methods - Admin create payment method
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !hasPermission(session.user.role, 'payment.method.manage')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await connectDB();

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }


    const nameEn = body?.name?.en?.trim?.();
    const nameDe = body?.name?.de?.trim?.() || nameEn;
    const nameAr = body?.name?.ar?.trim?.() || nameEn;
    const type = body?.type;
    const paymentAddress = body?.paymentAddress?.trim?.();
    const logo = body?.logo;
    const isGlobal = body?.isGlobal === true;
    const countries = Array.isArray(body?.countries)
      ? body.countries
          .filter((c: unknown) => typeof c === 'string')
          .map((c: string) => c.trim().toUpperCase())
          .filter(Boolean)
      : [];

    if (!nameEn || !type || !paymentAddress || !logo) {
      return NextResponse.json(
        {
          success: false,
          error: 'name.en, type, paymentAddress, and logo are required',
        },
        { status: 400 }
      );
    }

    const allowedTypes = ['bank_transfer', 'mobile_wallet', 'crypto', 'paypal', 'custom'];
    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment method type' },
        { status: 400 }
      );
    }

    if (!isGlobal && countries.length === 0) {
      return NextResponse.json(
        { success: false, error: 'countries is required when isGlobal is false' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid authenticated user id' },
        { status: 400 }
      );
    }

    const adminUserId = new mongoose.Types.ObjectId(session.user.id);

    const paymentMethod = await PaymentMethod.create({

      name: {
        en: nameEn,
        de: nameDe,
        ar: nameAr,
      },
      description: {
        en: body?.description?.en || '',
        de: body?.description?.de || '',
        ar: body?.description?.ar || '',
      },
      instructions: {
        en: body?.instructions?.en || '',
        de: body?.instructions?.de || '',
        ar: body?.instructions?.ar || '',
      },
      type,
      isGlobal,
      countries: isGlobal ? [] : countries,
      paymentAddress,
      accountHolderName: body?.accountHolderName || '',
      bankName: body?.bankName || '',
      swiftCode: body?.swiftCode || '',
      additionalDetails: body?.additionalDetails || '',
      logo,
      qrCode: body?.qrCode || '',
      requiresOperationNumber: body?.requiresOperationNumber === true,
      requiresScreenshot: body?.requiresScreenshot !== false,
      operationNumberLabel: {
        en: body?.operationNumberLabel?.en || 'Transaction Number',
        de: body?.operationNumberLabel?.de || 'Transaktionsnummer',
        ar: body?.operationNumberLabel?.ar || 'رقم العملية',
      },
      isActive: body?.isActive !== false,
      sortOrder:
        typeof body?.sortOrder === 'number' && body.sortOrder >= 0 ? body.sortOrder : 0,
      createdBy: adminUserId,
      updatedBy: adminUserId,

    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...paymentMethod.toObject(),
          _id: paymentMethod._id.toString(),
          createdBy: paymentMethod.createdBy?.toString?.() || paymentMethod.createdBy,
          updatedBy: paymentMethod.updatedBy?.toString?.() || paymentMethod.updatedBy,
          createdAt: paymentMethod.createdAt?.toISOString(),
          updatedAt: paymentMethod.updatedAt?.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating payment method:', error);

    const errorMessage =
      error?.message ||
      error?.errors?.[Object.keys(error?.errors || {})[0]]?.message ||
      'Failed to create payment method';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
