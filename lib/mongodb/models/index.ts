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

// Add other models here as we create them:
// export { default as Payment, IPayment } from './Payment';
// etc.
