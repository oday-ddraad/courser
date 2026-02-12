# Email Templates System

This document describes the email templates system for the courses platform.

## Overview

The email templates system provides pre-built, customizable email templates that are automatically initialized when the app first deploys. Templates are stored in MongoDB and can be managed through the admin dashboard.

## Available Templates

### 1. Welcome (`welcome`)
- **Purpose**: Welcome new users upon registration
- **Category**: Transactional
- **Variables**: `name`, `platformName`, `loginUrl`, `supportEmail`

### 2. Password Reset (`password-reset`)
- **Purpose**: Password reset instructions with secure link
- **Category**: Transactional
- **Variables**: `name`, `platformName`, `resetUrl`, `supportEmail`, `expiryHours`

### 3. Course Enrollment (`course-enrollment`)
- **Purpose**: Confirmation when user enrolls in a course
- **Category**: Transactional
- **Variables**: `name`, `courseName`, `instructorName`, `courseUrl`, `platformName`, `startDate`, `supportEmail`

### 4. Course Completion (`course-completion`)
- **Purpose**: Congratulations email with certificate download
- **Category**: Notification
- **Variables**: `name`, `courseName`, `instructorName`, `completionDate`, `certificateUrl`, `platformName`, `supportEmail`

### 5. New Course Announcement (`new-course-announcement`)
- **Purpose**: Notify users about new available courses
- **Category**: Marketing
- **Variables**: `name`, `courseName`, `instructorName`, `courseDescription`, `courseUrl`, `platformName`, `price`, `category`

### 6. Instructor Welcome (`instructor-welcome`)
- **Purpose**: Welcome message for new instructors
- **Category**: Transactional
- **Variables**: `name`, `platformName`, `dashboardUrl`, `guideUrl`, `supportEmail`, `communityUrl`

### 7. Account Activation (`account-activation`)
- **Purpose**: Account verification/activation email
- **Category**: Transactional
- **Variables**: `name`, `platformName`, `activationUrl`, `supportEmail`, `expiryHours`

### 8. Payment Confirmation (`payment-confirmation`)
- **Purpose**: Payment receipt and confirmation
- **Category**: Transactional
- **Variables**: `name`, `platformName`, `orderId`, `courseName`, `amount`, `paymentMethod`, `paymentDate`, `receiptUrl`, `supportEmail`

### 9. Lesson Reminder (`lesson-reminder`)
- **Purpose**: Reminder for upcoming lessons
- **Category**: Notification
- **Variables**: `name`, `courseName`, `lessonName`, `lessonDate`, `lessonTime`, `platformName`, `lessonUrl`, `instructorName`

## Usage

### Automatic Initialization

Email templates are automatically initialized when:
1. The app starts up (via `EmailTemplateInit` component)
2. The `/api/init` endpoint is called

Templates are only created if they don't already exist in the database.

### Manual Seeding

To manually seed templates using pnpm:

```bash
# Seed email templates
pnpm seed:templates

# Or use the alias
pnpm seed
```

### Using Templates in Code

```typescript
import { emailService } from '@/lib/services/email';
import EmailTemplate from '@/lib/mongodb/models/EmailTemplate';

// Get a template from the database
const template = await EmailTemplate.findOne({ name: 'welcome' });

// Send email using the template
await emailService.sendEmail({
  to: 'user@example.com',
  template: {
    name: template.name,
    subject: template.subject,
    htmlContent: template.htmlContent,
    textContent: template.textContent,
    variables: template.variables,
  },
  variables: {
    name: 'John Doe',
    platformName: 'My Learning Platform',
    loginUrl: 'https://example.com/login',
    supportEmail: 'support@example.com',
  },
});
```

## Template Structure

Each template includes:
- **HTML Version**: Styled HTML email with inline CSS
- **Text Version**: Plain text fallback for email clients that don't support HTML
- **Variables**: Dynamic placeholders using `{{variableName}}` syntax
- **Category**: Classification for organization (transactional, notification, marketing, other)

## Admin Dashboard

Templates can be managed through the admin dashboard at:
- `/dashboard/admin/email-templates` - View and manage templates
- `/dashboard/admin/settings/email-templates` - Template settings

## Customization

### Modifying Templates

1. Edit templates in the admin dashboard
2. Or modify `lib/email/init-templates.ts` and re-seed

### Creating New Templates

1. Add template definition to `lib/email/init-templates.ts`
2. Run `pnpm seed:templates` to add to database
3. Or create directly in the admin dashboard

## Environment Variables

Required for email functionality:
```env
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

## File Structure

```
lib/
  email/
    init-templates.ts          # Template definitions & initialization
app/
  api/
    init/
      route.ts                 # API endpoint for initialization
components/
  providers/
    EmailTemplateInit.tsx      # Auto-initialization component
scripts/
  seed-email-templates.ts      # Manual seeding script
```

## Best Practices

1. **Always provide text versions** for accessibility
2. **Use inline CSS** for email client compatibility
3. **Test templates** before deploying
4. **Keep variables simple** and well-documented
5. **Use semantic HTML** for better accessibility
