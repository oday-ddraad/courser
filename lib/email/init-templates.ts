import EmailTemplate from '@/lib/mongodb/models/EmailTemplate';
import User from '@/lib/mongodb/models/User';
import mongoose from 'mongoose';

// Default email templates embedded in the application
const defaultEmailTemplates = [
  {
    name: 'welcome',
    description: 'Welcome email sent to new users upon registration',
    subject: 'Welcome to {{platformName}} - Your Learning Journey Begins!',
    category: 'transactional' as const,
    variables: ['name', 'platformName', 'loginUrl', 'supportEmail'],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to {{platformName}}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome to {{platformName}}!</h1>
  </div>
  <div class="content">
    <h2>Hi {{name}},</h2>
    <p>We're thrilled to have you join our learning community! Your account has been successfully created and you're ready to start exploring courses.</p>
    <p>Here's what you can do next:</p>
    <ul>
      <li>Browse our extensive course catalog</li>
      <li>Enroll in courses that interest you</li>
      <li>Track your learning progress</li>
      <li>Connect with instructors and fellow learners</li>
    </ul>
    <center>
      <a href="{{loginUrl}}" class="button">Start Learning</a>
    </center>
    <p>If you have any questions, our support team is here to help at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
    <p>Happy learning!<br>The {{platformName}} Team</p>
  </div>
  <div class="footer">
    <p>© {{platformName}}. All rights reserved.</p>
  </div>
</body>
</html>`,
    textContent: `Welcome to {{platformName}}!

Hi {{name}},

We're thrilled to have you join our learning community! Your account has been successfully created and you're ready to start exploring courses.

Here's what you can do next:
- Browse our extensive course catalog
- Enroll in courses that interest you
- Track your learning progress
- Connect with instructors and fellow learners

Start Learning: {{loginUrl}}

If you have any questions, our support team is here to help at {{supportEmail}}

Happy learning!
The {{platformName}} Team

© {{platformName}}. All rights reserved.`,
  },
  {
    name: 'password-reset',
    description: 'Password reset email with secure reset link',
    subject: 'Password Reset Request - {{platformName}}',
    category: 'transactional' as const,
    variables: ['name', 'platformName', 'resetUrl', 'supportEmail', 'expiryHours'],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - {{platformName}}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Password Reset Request</h1>
  </div>
  <div class="content">
    <h2>Hi {{name}},</h2>
    <p>We received a request to reset your password for your {{platformName}} account.</p>
    <div class="alert">
      <strong>Important:</strong> This link will expire in {{expiryHours}} hours for security reasons.
    </div>
    <p>To reset your password, click the button below:</p>
    <center>
      <a href="{{resetUrl}}" class="button">Reset Password</a>
    </center>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #667eea;">{{resetUrl}}</p>
    <p>If you didn't request this password reset, please ignore this email or contact our support team at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a> if you have concerns.</p>
    <p>Best regards,<br>The {{platformName}} Security Team</p>
  </div>
  <div class="footer">
    <p>© {{platformName}}. All rights reserved.</p>
  </div>
</body>
</html>`,
    textContent: `Password Reset Request - {{platformName}}

Hi {{name}},

We received a request to reset your password for your {{platformName}} account.

IMPORTANT: This link will expire in {{expiryHours}} hours for security reasons.

To reset your password, click the link below:
{{resetUrl}}

If you didn't request this password reset, please ignore this email or contact our support team at {{supportEmail}} if you have concerns.

Best regards,
The {{platformName}} Security Team

© {{platformName}}. All rights reserved.`,
  },
  {
    name: 'course-enrollment',
    description: 'Confirmation email when user enrolls in a course',
    subject: 'Enrollment Confirmed: {{courseName}}',
    category: 'transactional' as const,
    variables: ['name', 'courseName', 'instructorName', 'courseUrl', 'platformName', 'startDate', 'supportEmail'],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Course Enrollment - {{platformName}}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .course-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Enrollment Confirmed!</h1>
  </div>
  <div class="content">
    <h2>Hi {{name}},</h2>
    <p>Congratulations! You have successfully enrolled in:</p>
    <div class="course-info">
      <h3 style="margin-top: 0; color: #10b981;">{{courseName}}</h3>
      <p><strong>Instructor:</strong> {{instructorName}}</p>
      <p><strong>Start Date:</strong> {{startDate}}</p>
    </div>
    <p>You're all set to begin your learning journey. Access your course materials and start learning right away!</p>
    <center>
      <a href="{{courseUrl}}" class="button">Access Course</a>
    </center>
    <p>What to expect:</p>
    <ul>
      <li>High-quality video lessons</li>
      <li>Interactive exercises and quizzes</li>
      <li>Downloadable resources</li>
      <li>Certificate upon completion</li>
    </ul>
    <p>Need help? Contact us at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
    <p>Happy learning!<br>The {{platformName}} Team</p>
  </div>
  <div class="footer">
    <p>© {{platformName}}. All rights reserved.</p>
  </div>
</body>
</html>`,
    textContent: `Enrollment Confirmed: {{courseName}}

Hi {{name}},

Congratulations! You have successfully enrolled in:
- Course: {{courseName}}
- Instructor: {{instructorName}}
- Start Date: {{startDate}}

You're all set to begin your learning journey. Access your course materials here:
{{courseUrl}}

What to expect:
- High-quality video lessons
- Interactive exercises and quizzes
- Downloadable resources
- Certificate upon completion

Need help? Contact us at {{supportEmail}}

Happy learning!
The {{platformName}} Team

© {{platformName}}. All rights reserved.`,
  },
  {
    name: 'course-completion',
    description: 'Congratulations email with certificate when user completes a course',
    subject: '🎓 Course Completed: {{courseName}}',
    category: 'notification' as const,
    variables: ['name', 'courseName', 'instructorName', 'completionDate', 'certificateUrl', 'platformName', 'supportEmail'],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Course Completion - {{platformName}}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .achievement { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #fbbf24; }
    .certificate-icon { font-size: 60px; margin-bottom: 15px; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Congratulations!</h1>
  </div>
  <div class="content">
    <h2>Hi {{name}},</h2>
    <p>You did it! You've successfully completed:</p>
    <div class="achievement">
      <div class="certificate-icon">🏆</div>
      <h3 style="color: #f59e0b; margin: 10px 0;">{{courseName}}</h3>
      <p><strong>Instructor:</strong> {{instructorName}}</p>
      <p><strong>Completed on:</strong> {{completionDate}}</p>
    </div>
    <p>Your dedication and hard work have paid off. You should be proud of this achievement!</p>
    <center>
      <a href="{{certificateUrl}}" class="button">Download Certificate</a>
    </center>
    <p>What's next?</p>
    <ul>
      <li>Share your achievement on LinkedIn</li>
      <li>Explore more advanced courses</li>
      <li>Apply your new skills to real projects</li>
    </ul>
    <p>Keep up the great work!<br>The {{platformName}} Team</p>
  </div>
  <div class="footer">
    <p>© {{platformName}}. All rights reserved.</p>
  </div>
</body>
</html>`,
    textContent: `🎓 Course Completed: {{courseName}}

Hi {{name}},

You did it! You've successfully completed:
- Course: {{courseName}}
- Instructor: {{instructorName}}
- Completed on: {{completionDate}}

Your dedication and hard work have paid off. You should be proud of this achievement!

Download your certificate here:
{{certificateUrl}}

What's next?
- Share your achievement on LinkedIn
- Explore more advanced courses
- Apply your new skills to real projects

Keep up the great work!
The {{platformName}} Team

© {{platformName}}. All rights reserved.`,
  },
  {
    name: 'new-course-announcement',
    description: 'Email to notify users about new available courses',
    subject: 'New Course Available: {{courseName}}',
    category: 'marketing' as const,
    variables: ['name', 'courseName', 'instructorName', 'courseDescription', 'courseUrl', 'platformName', 'price', 'category'],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Course - {{platformName}}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #8b5cf6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .course-card { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .badge { display: inline-block; background: #8b5cf6; color: white; padding: 5px 12px; border-radius: 20px; font-size: 12px; margin-bottom: 10px; }
    .price { font-size: 24px; color: #8b5cf6; font-weight: bold; margin: 15px 0; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>✨ New Course Alert!</h1>
  </div>
  <div class="content">
    <h2>Hi {{name}},</h2>
    <p>We're excited to announce a brand new course that's now available on {{platformName}}!</p>
    <div class="course-card">
      <span class="badge">{{category}}</span>
      <h3 style="margin: 10px 0; color: #1f2937;">{{courseName}}</h3>
      <p><strong>Instructor:</strong> {{instructorName}}</p>
      <p>{{courseDescription}}</p>
      <div class="price">{{price}}</div>
      <center>
        <a href="{{courseUrl}}" class="button">Enroll Now</a>
      </center>
    </div>
    <p>Don't miss this opportunity to expand your skills and knowledge!</p>
    <p>Happy learning,<br>The {{platformName}} Team</p>
  </div>
  <div class="footer">
    <p>© {{platformName}}. All rights reserved.</p>
  </div>
</body>
</html>`,
    textContent: `New Course Available: {{courseName}}

Hi {{name}},

We're excited to announce a brand new course that's now available on {{platformName}}!

Course: {{courseName}}
Category: {{category}}
Instructor: {{instructorName}}
Price: {{price}}

Description:
{{courseDescription}}

Enroll now:
{{courseUrl}}

Don't miss this opportunity to expand your skills and knowledge!

Happy learning,
The {{platformName}} Team

© {{platformName}}. All rights reserved.`,
  },
  {
    name: 'instructor-welcome',
    description: 'Welcome email for new instructors joining the platform',
    subject: 'Welcome to {{platformName}} Instructor Community!',
    category: 'transactional' as const,
    variables: ['name', 'platformName', 'dashboardUrl', 'guideUrl', 'supportEmail', 'communityUrl'],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome Instructor - {{platformName}}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #ec4899; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #ec4899; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>👋 Welcome, Instructor!</h1>
  </div>
  <div class="content">
    <h2>Hi {{name}},</h2>
    <p>Welcome to the {{platformName}} Instructor Community! We're thrilled to have you join our team of educators.</p>
    <p>As an instructor, you now have access to powerful tools to create and manage courses:</p>
    <div class="feature">
      <strong>📚 Course Creation Tools</strong><br>
      Build engaging courses with videos, quizzes, and resources
    </div>
    <div class="feature">
      <strong>📊 Analytics Dashboard</strong><br>
      Track student progress and course performance
    </div>
    <div class="feature">
      <strong>💬 Student Engagement</strong><br>
      Interact with students through discussions and live sessions
    </div>
    <div class="feature">
      <strong>💰 Revenue Tracking</strong><br>
      Monitor your earnings and payment history
    </div>
    <center>
      <a href="{{dashboardUrl}}" class="button">Go to Instructor Dashboard</a>
    </center>
    <p><strong>Getting Started:</strong></p>
    <ul>
      <li>Complete your instructor profile</li>
      <li>Read our <a href="{{guideUrl}}">Instructor Guide</a></li>
      <li>Join our <a href="{{communityUrl}}">Instructor Community</a></li>
      <li>Create your first course</li>
    </ul>
    <p>Need assistance? Reach out to us at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
    <p>We're excited to see what you'll create!<br>The {{platformName}} Team</p>
  </div>
  <div class="footer">
    <p>© {{platformName}}. All rights reserved.</p>
  </div>
</body>
</html>`,
    textContent: `Welcome to {{platformName}} Instructor Community!

Hi {{name}},

Welcome to the {{platformName}} Instructor Community! We're thrilled to have you join our team of educators.

As an instructor, you now have access to powerful tools to create and manage courses:

📚 Course Creation Tools
Build engaging courses with videos, quizzes, and resources

📊 Analytics Dashboard
Track student progress and course performance

💬 Student Engagement
Interact with students through discussions and live sessions

💰 Revenue Tracking
Monitor your earnings and payment history

Go to Instructor Dashboard:
{{dashboardUrl}}

Getting Started:
- Complete your instructor profile
- Read our Instructor Guide: {{guideUrl}}
- Join our Instructor Community: {{communityUrl}}
- Create your first course

Need assistance? Reach out to us at {{supportEmail}}

We're excited to see what you'll create!
The {{platformName}} Team

© {{platformName}}. All rights reserved.`,
  },
  {
    name: 'account-activation',
    description: 'Email to activate/verify user account',
    subject: 'Activate Your {{platformName}} Account',
    category: 'transactional' as const,
    variables: ['name', 'platformName', 'activationUrl', 'supportEmail', 'expiryHours'],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Activation - {{platformName}}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .alert { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔐 Activate Your Account</h1>
  </div>
  <div class="content">
    <h2>Hi {{name}},</h2>
    <p>Thank you for signing up with {{platformName}}! To complete your registration and start learning, please activate your account.</p>
    <div class="alert">
      <strong>Note:</strong> This activation link will expire in {{expiryHours}} hours.
    </div>
    <center>
      <a href="{{activationUrl}}" class="button">Activate Account</a>
    </center>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #3b82f6;">{{activationUrl}}</p>
    <p>By activating your account, you'll get access to:</p>
    <ul>
      <li>All free courses on the platform</li>
      <li>Personalized course recommendations</li>
      <li>Progress tracking and certificates</li>
      <li>Community discussions</li>
    </ul>
    <p>If you didn't create an account with us, please ignore this email or contact <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
    <p>Welcome aboard!<br>The {{platformName}} Team</p>
  </div>
  <div class="footer">
    <p>© {{platformName}}. All rights reserved.</p>
  </div>
</body>
</html>`,
    textContent: `Activate Your {{platformName}} Account

Hi {{name}},

Thank you for signing up with {{platformName}}! To complete your registration and start learning, please activate your account.

Note: This activation link will expire in {{expiryHours}} hours.

Activate your account:
{{activationUrl}}

By activating your account, you'll get access to:
- All free courses on the platform
- Personalized course recommendations
- Progress tracking and certificates
- Community discussions

If you didn't create an account with us, please ignore this email or contact {{supportEmail}}

Welcome aboard!
The {{platformName}} Team

© {{platformName}}. All rights reserved.`,
  },
  {
    name: 'payment-confirmation',
    description: 'Payment receipt and confirmation email',
    subject: 'Payment Confirmation - {{platformName}}',
    category: 'transactional' as const,
    variables: ['name', 'platformName', 'orderId', 'courseName', 'amount', 'paymentMethod', 'paymentDate', 'receiptUrl', 'supportEmail'],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Confirmation - {{platformName}}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #059669; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .receipt { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border: 2px solid #d1fae5; }
    .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .receipt-row:last-child { border-bottom: none; font-weight: bold; color: #059669; font-size: 18px; }
    .success-icon { font-size: 50px; text-align: center; margin-bottom: 15px; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>✅ Payment Successful</h1>
  </div>
  <div class="content">
    <div class="success-icon">🎉</div>
    <h2 style="text-align: center;">Thank you, {{name}}!</h2>
    <p style="text-align: center;">Your payment has been successfully processed.</p>
    <div class="receipt">
      <h3 style="margin-top: 0; color: #059669; text-align: center;">Payment Receipt</h3>
      <div class="receipt-row">
        <span>Order ID:</span>
        <span>{{orderId}}</span>
      </div>
      <div class="receipt-row">
        <span>Course:</span>
        <span>{{courseName}}</span>
      </div>
      <div class="receipt-row">
        <span>Payment Method:</span>
        <span>{{paymentMethod}}</span>
      </div>
      <div class="receipt-row">
        <span>Date:</span>
        <span>{{paymentDate}}</span>
      </div>
      <div class="receipt-row">
        <span>Total Amount:</span>
        <span>{{amount}}</span>
      </div>
    </div>
    <center>
      <a href="{{receiptUrl}}" class="button">Download Receipt</a>
    </center>
    <p>You now have full access to <strong>{{courseName}}</strong>. Start learning right away!</p>
    <p>Questions about your purchase? Contact us at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
    <p>Thank you for choosing {{platformName}}!<br>The {{platformName}} Team</p>
  </div>
  <div class="footer">
    <p>© {{platformName}}. All rights reserved.</p>
  </div>
</body>
</html>`,
    textContent: `Payment Confirmation - {{platformName}}

Thank you, {{name}}!

Your payment has been successfully processed.

Payment Receipt
----------------
Order ID: {{orderId}}
Course: {{courseName}}
Payment Method: {{paymentMethod}}
Date: {{paymentDate}}
Total Amount: {{amount}}

Download your receipt: {{receiptUrl}}

You now have full access to {{courseName}}. Start learning right away!

Questions about your purchase? Contact us at {{supportEmail}}

Thank you for choosing {{platformName}}!
The {{platformName}} Team

© {{platformName}}. All rights reserved.`,
  },
  {
    name: 'lesson-reminder',
    description: 'Reminder for upcoming lessons or deadlines',
    subject: 'Reminder: {{lessonName}} in {{courseName}}',
    category: 'notification' as const,
    variables: ['name', 'courseName', 'lessonName', 'lessonDate', 'lessonTime', 'platformName', 'lessonUrl', 'instructorName'],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lesson Reminder - {{platformName}}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #6366f1; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .reminder-box { background: #e0e7ff; border-left: 4px solid #6366f1; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>⏰ Lesson Reminder</h1>
  </div>
  <div class="content">
    <h2>Hi {{name}},</h2>
    <div class="reminder-box">
      <p style="margin: 0; font-size: 18px;"><strong>Don't forget!</strong> You have an upcoming lesson.</p>
    </div>
    <div class="details">
      <h3 style="margin-top: 0; color: #6366f1;">{{lessonName}}</h3>
      <p><strong>Course:</strong> {{courseName}}</p>
      <p><strong>Instructor:</strong> {{instructorName}}</p>
      <p><strong>Date:</strong> {{lessonDate}}</p>
      <p><strong>Time:</strong> {{lessonTime}}</p>
    </div>
    <center>
      <a href="{{lessonUrl}}" class="button">Join Lesson</a>
    </center>
    <p>Make sure to:</p>
    <ul>
      <li>Test your audio and video beforehand</li>
      <li>Join a few minutes early</li>
      <li>Have your materials ready</li>
    </ul>
    <p>See you in class!<br>The {{platformName}} Team</p>
  </div>
  <div class="footer">
    <p>© {{platformName}}. All rights reserved.</p>
  </div>
</body>
</html>`,
    textContent: `Reminder: {{lessonName}} in {{courseName}}

Hi {{name}},

Don't forget! You have an upcoming lesson.

Lesson Details:
- Lesson: {{lessonName}}
- Course: {{courseName}}
- Instructor: {{instructorName}}
- Date: {{lessonDate}}
- Time: {{lessonTime}}

Join the lesson:
{{lessonUrl}}

Make sure to:
- Test your audio and video beforehand
- Join a few minutes early
- Have your materials ready

See you in class!
The {{platformName}} Team

© {{platformName}}. All rights reserved.`,
  },
];

/**
 * Initialize default email templates in the database
 * This function runs automatically when the app starts
 */
export async function initializeEmailTemplates(): Promise<{
  success: boolean;
  created: number;
  existing: number;
  error?: string;
}> {
  try {
    // Find or create a system user for createdBy field
    let systemUser = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
    
    if (!systemUser) {
      // Create a system user if no admin exists
      systemUser = await User.create({
        email: 'system@platform.local',
        password: 'system-temp-password-not-for-login',
        name: 'System',
        role: 'admin',
        locale: 'en',
        country: 'US',
        isActive: true,
      });
    }

    const createdBy = systemUser._id as mongoose.Types.ObjectId;
    let created = 0;
    let existing = 0;

    for (const templateData of defaultEmailTemplates) {
      const existingTemplate = await EmailTemplate.findOne({ name: templateData.name });
      
      if (!existingTemplate) {
        await EmailTemplate.create({
          ...templateData,
          createdBy,
          isActive: true,
        });
        created++;
      } else {
        existing++;
      }
    }

    return {
      success: true,
      created,
      existing,
    };
  } catch (error) {
    console.error('Error initializing email templates:', error);
    return {
      success: false,
      created: 0,
      existing: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Export template names for reference
export const templateNames = defaultEmailTemplates.map(t => t.name);

export default initializeEmailTemplates;
