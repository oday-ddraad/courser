import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/lib/services/whatsapp';

/**
 * GET /api/whatsapp/webhook
 * Handle webhook verification from Meta
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (!mode || !token || !challenge) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify webhook
    const response = whatsappService.getWebhookChallenge(mode, token, challenge);

    if (response === null) {
      return NextResponse.json(
        { success: false, error: 'Verification failed' },
        { status: 403 }
      );
    }

    // Return the challenge for Meta to verify
    return new NextResponse(response, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });

  } catch (error) {
    console.error('Webhook verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/whatsapp/webhook
 * Handle incoming webhook events from WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    // Get signature from headers for verification
    const signature = request.headers.get('x-hub-signature-256') || '';

    // Get raw body for signature verification
    const body = await request.text();

    // Verify webhook signature
    const isValid = whatsappService.verifyWebhookSignature(body, signature);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse the webhook payload
    const payload = JSON.parse(body);

    // Process different types of events
    if (payload.object === 'whatsapp_business_account') {
      for (const entry of payload.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;

          // Handle messages
          if (value.messages) {
            for (const message of value.messages) {
              await handleIncomingMessage(message, value.contacts?.[0]);
            }
          }

          // Handle message status updates
          if (value.statuses) {
            for (const status of value.statuses) {
              await handleMessageStatus(status);
            }
          }
        }
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return 200 to prevent Meta from retrying
    return NextResponse.json({ success: true });
  }
}

/**
 * Handle incoming WhatsApp message
 */
async function handleIncomingMessage(message: any, contact: any) {
  try {
    const from = message.from; // Phone number
    const messageId = message.id;
    const timestamp = message.timestamp;

    console.log('Received WhatsApp message:', {
      from,
      messageId,
      timestamp,
      type: message.type,
    });

    // Handle different message types
    switch (message.type) {
      case 'text':
        console.log('Text message:', message.text?.body);
        // TODO: Implement chat response logic
        break;
      case 'image':
        console.log('Image message received');
        break;
      case 'document':
        console.log('Document message received');
        break;
      case 'audio':
        console.log('Audio message received');
        break;
      default:
        console.log('Unknown message type:', message.type);
    }

    // TODO: Store message in database if needed
    // TODO: Implement auto-reply logic if needed

  } catch (error) {
    console.error('Error handling incoming message:', error);
  }
}

/**
 * Handle message status updates
 */
async function handleMessageStatus(status: any) {
  try {
    const messageId = status.id;
    const statusType = status.status; // sent, delivered, read, failed
    const timestamp = status.timestamp;
    const recipientId = status.recipient_id;

    console.log('Message status update:', {
      messageId,
      status: statusType,
      timestamp,
      recipientId,
    });

    // TODO: Update message status in database if tracking
    // TODO: Handle failed messages (retry logic, notifications, etc.)

    if (statusType === 'failed' && status.errors) {
      console.error('Message failed:', status.errors);
    }

  } catch (error) {
    console.error('Error handling message status:', error);
  }
}
