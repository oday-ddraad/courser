import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IChatMessage extends Document {
  courseId: Types.ObjectId;
  lessonId?: Types.ObjectId;
  userId: Types.ObjectId;
  message: string;
  attachments: {
    type: 'image' | 'file' | 'link';
    url: string;
    name: string;
    size: number;
  }[];
  isInstructorMessage: boolean;
  isPinned: boolean;
  editedAt?: Date;
  deletedAt?: Date;
  reactions: {
    emoji: string;
    userIds: Types.ObjectId[];
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    lessonId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    attachments: [{
      type: {
        type: String,
        enum: ['image', 'file', 'link'],
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      size: {
        type: Number,
        default: 0,
      },
    }],
    isInstructorMessage: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    reactions: [{
      emoji: {
        type: String,
        required: true,
      },
      userIds: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
      }],
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
ChatMessageSchema.index({ courseId: 1, createdAt: -1 });
ChatMessageSchema.index({ courseId: 1, lessonId: 1, createdAt: -1 });
ChatMessageSchema.index({ userId: 1 });
ChatMessageSchema.index({ isPinned: 1 });
ChatMessageSchema.index({ createdAt: -1 });

// Compound indexes for common queries
ChatMessageSchema.index({ courseId: 1, deletedAt: 1, createdAt: -1 });

// Method to soft delete message
ChatMessageSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  return this;
};

// Method to add reaction
ChatMessageSchema.methods.addReaction = function(emoji: string, userId: Types.ObjectId) {
  const existingReaction = this.reactions.find((r: { emoji: string }) => r.emoji === emoji);
  
  if (existingReaction) {
    const userIdStr = userId.toString();
    const alreadyReacted = existingReaction.userIds.some(
      (id: Types.ObjectId) => id.toString() === userIdStr
    );
    
    if (!alreadyReacted) {
      existingReaction.userIds.push(userId);
    }
  } else {
    this.reactions.push({
      emoji,
      userIds: [userId],
    });
  }
  
  return this;
};

// Method to remove reaction
ChatMessageSchema.methods.removeReaction = function(emoji: string, userId: Types.ObjectId) {
  const reaction = this.reactions.find((r: { emoji: string }) => r.emoji === emoji);
  
  if (reaction) {
    reaction.userIds = reaction.userIds.filter(
      (id: Types.ObjectId) => id.toString() !== userId.toString()
    );
    
    // Remove reaction if no users left
    if (reaction.userIds.length === 0) {
      this.reactions = this.reactions.filter((r: { emoji: string }) => r.emoji !== emoji);
    }
  }
  
  return this;
};

const ChatMessage: Model<IChatMessage> =
  mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);

export default ChatMessage;
