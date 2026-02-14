# WhatsApp OTP and Notifications Setup Guide

This guide explains how to set up and test the WhatsApp OTP verification and notification system.

## Overview

The WhatsApp integration provides:
- **OTP Verification**: Verify user phone numbers via WhatsApp
- **Notifications**: Send course-related notifications via WhatsApp
- **Webhook Handling**: Receive delivery status and incoming messages

## Prerequisites

1. Meta Business Account
2. WhatsApp Business API access
3. A phone number for WhatsApp Business

## Setup Steps

### 1. Meta Business Setup

1. Go to [Meta Business](https://business.facebook.com)
2. Create a Business Account if you don't have one
3. Navigate to **WhatsApp Manager**
4. Add a phone number and verify it
5. Note down your **Phone Number ID**

### 2. Get Access Token

1. Go to [Meta Developers](https://developers.facebook.com)
2. Create an app (Business type)
3. Add WhatsApp product to your app
4. Generate a **System User Access Token** with `whatsapp_business_messaging` permission
5. Note down your **Access Token**

### 3. Create Message Templates

In Meta Business Manager, create these templates (must be approved before use):

#### OTP Verification Template
- **Name**: `otp_verification`
- **Category**: Authentication
- **Language**: English
- **Body**: `Your verification code is: {{1}}. This code will expire in 10 minutes.`
- **Button**: URL button with `https://yourdomain.com/verify?code={{1}}`

#### Welcome Message Template
- **Name**: `welcome_message`
- **Category**: Utility
- **Language**: English
- **Body**: `Welcome {{1}}! Thank you for joining our learning platform.`

#### Course Enrollment Template
- **Name**: `course_enrollment`
- **Category**: Utility
- **Language**: English
- **Body**: `Hi {{1}}, you've successfully enrolled in "{{2}}". Start learning now!`

#### Live Stream Starting Template
- **Name**: `live_stream_starting`
- **Category**: Utility
- **Language**: English
- **Body**: `🔴 Live stream starting: "{{1}}" at {{2}}. Don't miss it!`

#### Payment Approved Template
- **Name**: `payment_approved`
- **Category**: Utility
- **Language**: English
- **Body**: `Hi {{1}}, your payment for "{{2}}" has been approved. Enjoy your course!`

### 4. Environment Variables

Add these to your `.env` file:

```env
# WhatsApp Business API
WHATSAPP_API_VERSION=v18.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_WEBHOOK_SECRET=your_webhook_secret_here
WHATSAPP_VERIFY_TOKEN=your_verify_token_here
```

**Note**: Generate random strings for `WHATSAPP_WEBHOOK_SECRET` and `WHATSAPP_VERIFY_TOKEN`.

### 5. Webhook Configuration

1. In Meta Developer Dashboard, go to your app
2. Navigate to **WhatsApp > Configuration**
3. Click **Edit** in Webhook section
4. Set **Callback URL**: `https://your-domain.com/api/whatsapp/webhook`
5. Set **Verify Token**: Same as `WHATSAPP_VERIFY_TOKEN` in your `.env`
6. Click **Verify and Save**
7. Subscribe to these webhook fields:
   - `messages`
   - `message_status`

## Testing

### 1. Check Service Status

Visit the admin testing page:
```
http://localhost:3000/en/dashboard/admin/whatsapp-otp
```

Or check via API:
```bash
curl http://localhost:3000/api/notifications/whatsapp
```

### 2. Send Test OTP

```bash
curl -X POST http://localhost:3000/api/whatsapp/otp/send \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"phoneNumber": "+1234567890", "purpose": "verification"}'
```

### 3. Verify OTP

```bash
curl -X POST http://localhost:3000/api/whatsapp/otp/verify \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"code": "123456", "purpose": "verification"}'
```

### 4. Send Test Notification

```bash
curl -X POST http://localhost:3000/api/notifications/whatsapp \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "userId": "user_id_here",
    "type": "welcome",
    "data": {"userName": "John"}
  }'
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/whatsapp/otp/send` | POST | Send OTP to phone number |
| `/api/whatsapp/otp/verify` | POST | Verify OTP code |
| `/api/whatsapp/webhook` | GET | Webhook verification |
| `/api/whatsapp/webhook` | POST | Webhook events |
| `/api/notifications/whatsapp` | GET | Check service status |
| `/api/notifications/whatsapp` | POST | Send WhatsApp notification |

## Database Schema

### User Model Updates
- `phoneNumber`: E.164 format phone number
- `phoneVerified`: Date when phone was verified
- `whatsappNotificationsEnabled`: Boolean flag

### OTP Model
- Stores hashed OTP codes
- 10-minute expiration
- Max 3 attempts
- Auto-cleanup after 24 hours

## Security Considerations

1. **Rate Limiting**: OTP requests limited to 1 per 60 seconds per user
2. **Max Attempts**: 3 attempts per OTP
3. **Hashing**: OTPs are SHA-256 hashed before storage
4. **Signature Verification**: Webhook signatures are verified using HMAC
5. **HTTPS Only**: Webhooks require HTTPS in production

## Troubleshooting

### "WhatsApp service not configured"
- Check all environment variables are set
- Verify `WHATSAPP_ACCESS_TOKEN` is valid

### "Template not found"
- Ensure templates are created and approved in Meta Business Manager
- Check template names match exactly (case-sensitive)

### Webhook verification failed
- Verify `WHATSAPP_VERIFY_TOKEN` matches in both .env and Meta dashboard
- Ensure callback URL is accessible and returns the challenge

### Messages not delivered
- Check phone number is registered and verified in Meta Business Manager
- Verify recipient has opted in to receive messages
- Check webhook logs for status updates

## Production Deployment

1. Use a persistent database (MongoDB Atlas recommended)
2. Set up proper SSL/TLS certificates
3. Configure webhook URL with HTTPS
4. Set up monitoring and alerting
5. Implement rate limiting at API gateway level
6. Use environment-specific access tokens

## Support

For issues related to:
- **Meta/WhatsApp API**: [Meta Developers Support](https://developers.facebook.com/support)
- **This Implementation**: Check logs and webhook events in Meta Developer Dashboard
