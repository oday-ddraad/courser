// Chat Service for Course Discussions
// Handles real-time messaging and chat persistence

import { IChatMessage } from '@/lib/mongodb/models';

interface ChatMessageInput {
  courseId: string;
  lessonId?: string;
  message: string;
  attachments?: {
    type: 'image' | 'file' | 'link';
    url: string;
    name: string;
    size: number;
  }[];
}

interface ChatFilter {
  courseId: string;
  lessonId?: string;
  limit?: number;
  before?: Date;
}

class ChatService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = '/api/chat';
  }

  /**
   * Fetch chat messages for a course
   */
  async getMessages(filter: ChatFilter): Promise<{
    messages: IChatMessage[];
    pinnedMessages: IChatMessage[];
    hasMore: boolean;
  }> {
    const params = new URLSearchParams();
    
    if (filter.lessonId) {
      params.append('lessonId', filter.lessonId);
    }
    
    if (filter.limit) {
      params.append('limit', filter.limit.toString());
    }
    
    const queryString = params.toString();
    const url = `${this.apiBaseUrl}/course/${filter.courseId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch chat messages');
    }
    
    const data = await response.json();
    return data.data;
  }

  /**
   * Send a new chat message
   */
  async sendMessage(input: ChatMessageInput): Promise<IChatMessage> {
    const url = `${this.apiBaseUrl}/course/${input.courseId}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: input.message,
        lessonId: input.lessonId,
        attachments: input.attachments || [],
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send message');
    }
    
    const data = await response.json();
    return data.data;
  }

  /**
   * Edit an existing message
   */
  async editMessage(messageId: string, newMessage: string): Promise<IChatMessage> {
    const url = `${this.apiBaseUrl}/${messageId}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: newMessage,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to edit message');
    }
    
    const data = await response.json();
    return data.data;
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(messageId: string): Promise<void> {
    const url = `${this.apiBaseUrl}/${messageId}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete message');
    }
  }

  /**
   * Pin a message (instructor only)
   */
  async pinMessage(messageId: string, courseId: string): Promise<IChatMessage> {
    const url = `${this.apiBaseUrl}/course/${courseId}/${messageId}/pin`;
    
    const response = await fetch(url, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to pin message');
    }
    
    const data = await response.json();
    return data.data;
  }

  /**
   * Add reaction to a message
   */
  async addReaction(messageId: string, emoji: string): Promise<IChatMessage> {
    const url = `${this.apiBaseUrl}/${messageId}/reaction`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emoji,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to add reaction');
    }
    
    const data = await response.json();
    return data.data;
  }

  /**
   * Remove reaction from a message
   */
  async removeReaction(messageId: string, emoji: string): Promise<IChatMessage> {
    const url = `${this.apiBaseUrl}/${messageId}/reaction`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emoji,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to remove reaction');
    }
    
    const data = await response.json();
    return data.data;
  }

  /**
   * Subscribe to real-time updates (placeholder for WebSocket/SSE implementation)
   */
  subscribeToUpdates(courseId: string, callback: (message: IChatMessage) => void): () => void {
    // This is a placeholder for real-time updates
    // In a full implementation, you would use WebSockets or Server-Sent Events
    
    // For now, we'll use polling as a fallback
    const intervalId = setInterval(async () => {
      try {
        // This would check for new messages
        // const messages = await this.getMessages({ courseId, limit: 1 });
        // if (messages.messages.length > 0) {
        //   callback(messages.messages[0]);
        // }
      } catch (error) {
        console.error('Error polling for updates:', error);
      }
    }, 5000); // Poll every 5 seconds
    
    // Return unsubscribe function
    return () => clearInterval(intervalId);
  }

  /**
   * Format message timestamp
   */
  formatTimestamp(date: Date | string, locale: string = 'en'): string {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) { // Less than 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      return messageDate.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }

  /**
   * Check if user can send message
   */
  canSendMessage(isEnrolled: boolean, isInstructor: boolean): boolean {
    return isEnrolled || isInstructor;
  }

  /**
   * Check if user can moderate (pin, delete others' messages)
   */
  canModerate(isInstructor: boolean, isAdmin: boolean): boolean {
    return isInstructor || isAdmin;
  }
}

// Export singleton instance
export const chatService = new ChatService();

// Export class for testing or custom instances
export { ChatService };

// Default export
export default chatService;
