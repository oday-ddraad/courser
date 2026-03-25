import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb/connection';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';
import { InstructorEarnings } from '@/lib/mongodb/models';
import { triggerInstructorPayout } from '@/lib/services/pusherNotifications';

function serializeEarnings(doc: any) {
  return {
    ...doc,
    _id: doc._id?.toString?.() || doc._id,
    instructorId: doc.instructorId?.toString?.() || doc.instructorId,
    payoutHistory: Array.isArray(doc.payoutHistory)
      ? doc.payoutHistory.map((p: any) => ({
          ...p,
          _id: p._id?.toString?.() || p._id,
          paidBy: p.paidBy?.toString?.() || p.paidBy,
          paidAt: p.paidAt?.toISOString?.() || p.paidAt,
        }))
      : [],
    manualAdjustments: Array.isArray(doc.manualAdjustments)
      ? doc.manualAdjustments.map((m: any) => ({
          ...m,
          _id: m._id?.toString?.() || m._id,
          adjustedBy: m.adjustedBy?.toString?.() || m.adjustedBy,
          adjustedAt: m.adjustedAt?.toISOString?.() || m.adjustedAt,
        }))
      : [],
    createdAt: doc.createdAt?.toISOString?.() || doc.createdAt,
    updatedAt: doc.updatedAt?.toISOString?.() || doc.updatedAt,
    lastResetAt: doc.lastResetAt?.toISOString?.() || doc.lastResetAt,
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ instructorId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !hasPermission(session.user.role, 'payment.approve')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { instructorId } = await params;

    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      return NextResponse.json({ success: false, error: 'Invalid instructor id' }, { status: 400 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const amount = Number(body?.amount);
    const currency = typeof body?.currency === 'string' && body.currency.trim()
      ? body.currency.trim().toUpperCase()
      : 'USD';
    const reference = typeof body?.reference === 'string' ? body.reference.trim() : '';
    const note = typeof body?.note === 'string' ? body.note.trim() : '';

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: 'amount must be a positive number' }, { status: 400 });
    }

    await connectDB();

    const doc = await InstructorEarnings.findOne({
      instructorId: new mongoose.Types.ObjectId(instructorId),
    });

    if (!doc) {
      return NextResponse.json({ success: false, error: 'Instructor earnings not found' }, { status: 404 });
    }

    doc.paidAmount = (doc.paidAmount || 0) + amount;
    doc.pendingAmount = Math.max((doc.netRevenue || 0) - doc.paidAmount, 0);

    doc.payoutHistory.push({
      _id: new mongoose.Types.ObjectId(),
      amount,
      currency,
      paidAt: new Date(),
      paidBy: new mongoose.Types.ObjectId(session.user.id),
      note,
      reference,
    } as any);

    await doc.save();

    try {
      await triggerInstructorPayout(instructorId, {
        amount,
        currency,
        reference: reference || undefined,
        note: note || undefined,
      });
    } catch (notifyError) {
      console.error('Failed to send instructor payout notification:', notifyError);
    }

    return NextResponse.json({
      success: true,
      data: serializeEarnings(doc.toObject()),
      message: 'Payout recorded successfully',
    });
  } catch (error) {
    console.error('Error recording instructor payout:', error);
    return NextResponse.json({ success: false, error: 'Failed to record payout' }, { status: 500 });
  }
}
