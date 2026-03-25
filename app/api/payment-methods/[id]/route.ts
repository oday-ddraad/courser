import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb/connection';
import { PaymentMethod } from '@/lib/mongodb/models';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';
import mongoose from 'mongoose';

// GET /api/payment-methods/[id] - Admin get single payment method
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !hasPermission(session.user.role, 'payment.method.manage')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment method id' },
        { status: 400 }
      );
    }

    const paymentMethod = await PaymentMethod.findById(id).lean();

    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Payment method not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...paymentMethod,
        _id: (paymentMethod as any)._id.toString(),
        createdBy:
          (paymentMethod as any).createdBy?.toString?.() ||
          (paymentMethod as any).createdBy ||
          null,
        updatedBy:
          (paymentMethod as any).updatedBy?.toString?.() ||
          (paymentMethod as any).updatedBy ||
          null,
        createdAt:
          (paymentMethod as any).createdAt?.toISOString?.() ||
          (paymentMethod as any).createdAt,
        updatedAt:
          (paymentMethod as any).updatedAt?.toISOString?.() ||
          (paymentMethod as any).updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching payment method:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment method' },
      { status: 500 }
    );
  }
}

// PUT /api/payment-methods/[id] - Admin update payment method
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !hasPermission(session.user.role, 'payment.method.manage')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment method id' },
        { status: 400 }
      );
    }

    const paymentMethod = await PaymentMethod.findById(id);

    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Payment method not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    if (body.name) {
      paymentMethod.name.en = body.name.en || paymentMethod.name.en;
      paymentMethod.name.de = body.name.de || paymentMethod.name.de;
      paymentMethod.name.ar = body.name.ar || paymentMethod.name.ar;
    }

    if (body.description) {
      paymentMethod.description.en = body.description.en || '';
      paymentMethod.description.de = body.description.de || '';
      paymentMethod.description.ar = body.description.ar || '';
    }

    if (body.instructions) {
      paymentMethod.instructions.en = body.instructions.en || '';
      paymentMethod.instructions.de = body.instructions.de || '';
      paymentMethod.instructions.ar = body.instructions.ar || '';
    }

    if (body.type !== undefined) paymentMethod.type = body.type;
    if (body.paymentAddress !== undefined) paymentMethod.paymentAddress = body.paymentAddress;
    if (body.accountHolderName !== undefined) {
      paymentMethod.accountHolderName = body.accountHolderName;
    }
    if (body.bankName !== undefined) paymentMethod.bankName = body.bankName;
    if (body.swiftCode !== undefined) paymentMethod.swiftCode = body.swiftCode;
    if (body.additionalDetails !== undefined) {
      paymentMethod.additionalDetails = body.additionalDetails;
    }
    if (body.logo !== undefined) paymentMethod.logo = body.logo;
    if (body.qrCode !== undefined) paymentMethod.qrCode = body.qrCode;
    if (body.requiresOperationNumber !== undefined) {
      paymentMethod.requiresOperationNumber = body.requiresOperationNumber === true;
    }
    if (body.requiresScreenshot !== undefined) {
      paymentMethod.requiresScreenshot = body.requiresScreenshot === true;
    }

    if (body.operationNumberLabel) {
      paymentMethod.operationNumberLabel = {
        en: body.operationNumberLabel.en || paymentMethod.operationNumberLabel?.en || 'Transaction Number',
        de: body.operationNumberLabel.de || paymentMethod.operationNumberLabel?.de || 'Transaktionsnummer',
        ar: body.operationNumberLabel.ar || paymentMethod.operationNumberLabel?.ar || 'رقم العملية',
      };
    }

    if (body.isGlobal !== undefined) {
      paymentMethod.isGlobal = body.isGlobal === true;
      if (paymentMethod.isGlobal) {
        paymentMethod.countries = [];
      }
    }

    if (Array.isArray(body.countries)) {
      paymentMethod.countries = body.countries
        .filter((c: unknown) => typeof c === 'string')
        .map((c: string) => c.trim().toUpperCase())
        .filter(Boolean);
    }

    if (body.isActive !== undefined) paymentMethod.isActive = body.isActive === true;
    if (body.sortOrder !== undefined && typeof body.sortOrder === 'number' && body.sortOrder >= 0) {
      paymentMethod.sortOrder = body.sortOrder;
    }

    if (!paymentMethod.isGlobal && (!paymentMethod.countries || paymentMethod.countries.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'countries is required when isGlobal is false' },
        { status: 400 }
      );
    }

    paymentMethod.updatedBy = new mongoose.Types.ObjectId(session.user.id);
    await paymentMethod.save();

    return NextResponse.json({
      success: true,
      data: {
        ...paymentMethod.toObject(),
        _id: paymentMethod._id.toString(),
        createdBy: paymentMethod.createdBy?.toString?.() || paymentMethod.createdBy,
        updatedBy: paymentMethod.updatedBy?.toString?.() || paymentMethod.updatedBy,
        createdAt: paymentMethod.createdAt?.toISOString(),
        updatedAt: paymentMethod.updatedAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating payment method:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update payment method' },
      { status: 500 }
    );
  }
}

// DELETE /api/payment-methods/[id] - Admin delete payment method
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !hasPermission(session.user.role, 'payment.method.manage')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment method id' },
        { status: 400 }
      );
    }

    const deleted = await PaymentMethod.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Payment method not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment method deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete payment method' },
      { status: 500 }
    );
  }
}
