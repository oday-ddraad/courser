import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMeeting extends Document {
  roomName: string;
  courseSlug?: string;
  lessonId?: string;
  createdBy: mongoose.Types.ObjectId;
  status: 'active' | 'ended' | 'expired';
  startedAt: Date;
  endedAt?: Date;
  expiresAt: Date;
  participants: mongoose.Types.ObjectId[];
  maxParticipants?: number;
  settings: mongoose.Types.ObjectId; // Reference to JitsiSettings
  jwtToken?: string;
  meetingUrl: string;
  isActive: boolean;
  endedBy?: mongoose.Types.ObjectId;
  endReason?: 'admin_ended' | 'expired' | 'error';
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  endMeeting(endedBy: mongoose.Types.ObjectId, reason?: 'admin_ended' | 'expired' | 'error'): Promise<IMeeting>;
  isJoinable(): boolean;
}


const MeetingSchema = new Schema<IMeeting>(
  {
    roomName: {
      type: String,
      required: true,
      index: true,
    },
    courseSlug: {
      type: String,
      index: true,
    },
    lessonId: {
      type: String,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'ended', 'expired'],
      default: 'active',
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    participants: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    maxParticipants: {
      type: Number,
      default: 100,
    },
    settings: {
      type: Schema.Types.ObjectId,
      ref: 'JitsiSettings',
    },
    jwtToken: {
      type: String,
      select: false, // Don't include by default for security
    },
    meetingUrl: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    endedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    endReason: {
      type: String,
      enum: ['admin_ended', 'expired', 'error'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
MeetingSchema.index({ status: 1, isActive: 1 });
MeetingSchema.index({ roomName: 1, status: 1 });
MeetingSchema.index({ courseSlug: 1, lessonId: 1, status: 1 });
MeetingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired meetings

// Pre-save middleware to ensure expiresAt is set
MeetingSchema.pre('save', function() {
  if (!this.expiresAt) {
    // Default expiry: 24 hours from now
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
});



// Method to end meeting
MeetingSchema.methods.endMeeting = async function(
  this: IMeeting,
  endedBy: mongoose.Types.ObjectId,
  reason: 'admin_ended' | 'expired' | 'error' = 'admin_ended'
): Promise<IMeeting> {
  this.status = 'ended';
  this.isActive = false;
  this.endedAt = new Date();
  this.endedBy = endedBy;
  this.endReason = reason;
  this.jwtToken = undefined; // Clear JWT token
  return this.save();
};

// Method to check if meeting is joinable
MeetingSchema.methods.isJoinable = function(this: IMeeting): boolean {
  return this.status === 'active' && 
         this.isActive && 
         new Date() < this.expiresAt;
};


// Static method to find active meeting by room
MeetingSchema.statics.findActiveByRoom = function(roomName: string) {
  return this.findOne({
    roomName,
    status: 'active',
    isActive: true,
    expiresAt: { $gt: new Date() },
  });
};

const Meeting: Model<IMeeting> =
  mongoose.models.Meeting || mongoose.model<IMeeting>('Meeting', MeetingSchema);

export default Meeting;
