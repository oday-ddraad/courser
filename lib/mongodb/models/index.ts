// Export all models from a single file for easier imports
export { default as User, type IUser } from './User';
export { default as Course, type ICourse, type ILesson, type IReview, type IMaterial, type IGroup } from './Course';

export { default as Enrollment, type IEnrollment } from './Enrollment';
export { default as Notification, type INotification } from './Notification';
export { default as ChatMessage, type IChatMessage } from './ChatMessage';
export { default as Category, type ICategory } from './Category';

// Email system models
export { default as EmailTemplate, type IEmailTemplate } from './EmailTemplate';
export { default as EmailLog, type IEmailLog, type EmailStatus } from './EmailLog';
export { default as EmailSettings, type IEmailSettings } from './EmailSettings';

// WhatsApp OTP system models
export { default as OTP, type IOTP } from './OTP';
export { default as WhatsAppSettings, type IWhatsAppSettings } from './WhatsAppSettings';

// Jitsi/JaaS meeting model
export { default as Meeting, type IMeeting } from './Meeting';

// Scheduled notifications for event-driven reminders
export { default as ScheduledNotification, type IScheduledNotification } from './ScheduledNotification';

export { default as PaymentMethod, type IPaymentMethod } from './PaymentMethod';
export { default as Payment, type IPayment } from './Payment';
export { default as InstructorEarnings, type IInstructorEarnings } from './InstructorEarnings';
export { default as PaymentSettings, type IPaymentSettings } from './PaymentSettings';
