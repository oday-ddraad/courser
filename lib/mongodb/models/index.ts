// Export all models from a single file for easier imports
export { default as User, type IUser } from './User';
export { default as Course, type ICourse, type ILesson, type IMaterial, type IGroup, type IReview } from './Course';
export { default as Enrollment, type IEnrollment } from './Enrollment';
export { default as ChatMessage, type IChatMessage } from './ChatMessage';
export { default as Notification, type INotification } from './Notification';


// Add other models here as we create them:
// export { default as Payment, IPayment } from './Payment';
// export { default as Notification, INotification } from './Notification';
// etc.
