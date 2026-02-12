'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Send, Pin, Smile, Paperclip } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ChatMessage {
  _id: string;
  courseId: string;
  lessonId?: string;
  userId: {
    _id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  message: string;
  attachments: {
    type: 'image' | 'file' | 'link';
    url: string;
    name: string;
  }[];
  isInstructorMessage: boolean;
  isPinned: boolean;
  createdAt: string;
  reactions: {
    emoji: string;
    userIds: string[];
  }[];
}

interface LiveChatProps {
  courseId: string;
  lessonId: string;
  initialMessages: ChatMessage[];
  isEnrolled: boolean;
  userRole?: 'admin' | 'instructor' | 'user';
  locale: string;
}

export default function LiveChat({
  courseId,
  lessonId,
  initialMessages,
  isEnrolled,
  userRole,
  locale,
}: LiveChatProps) {
  const { data: session } = useSession();
  const t = useTranslations('courses');
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const isInstructor = userRole === 'instructor' || userRole === 'admin';

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for new messages every 10 seconds
  useEffect(() => {
    if (!isEnrolled) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/chat/course/${courseId}?lessonId=${lessonId}&after=${messages[0]?._id || ''}`);
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          setMessages(prev => [...data.data, ...prev]);
        }
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [courseId, lessonId, isEnrolled, messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !session?.user) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/chat/course/' + courseId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          message: newMessage.trim(),
          isInstructorMessage: isInstructor,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [data.data, ...prev]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/chat/course/${courseId}/messages/${messageId}/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });

      if (response.ok) {
        // Update local state
        setMessages(prev => prev.map(msg => {
          if (msg._id === messageId) {
            const existingReaction = msg.reactions.find(r => r.emoji === emoji);
            if (existingReaction) {
              if (existingReaction.userIds.includes(session?.user?.id || '')) {
                existingReaction.userIds = existingReaction.userIds.filter(id => id !== session?.user?.id);
              } else {
                existingReaction.userIds.push(session?.user?.id || '');
              }
            } else {
              msg.reactions.push({ emoji, userIds: [session?.user?.id || ''] });
            }
          }
          return msg;
        }));
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isEnrolled) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('liveChat')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center py-8">
          {t('enrollToChat')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('liveChat')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {messages.length} {t('messages')}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            {t('noMessagesYet')}
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`flex gap-3 ${message.isInstructorMessage ? 'bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg' : ''}`}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                {message.userId.avatar ? (
                  <img
                    src={message.userId.avatar}
                    alt={message.userId.name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
                    {message.userId.name?.charAt(0) || '?'}
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-medium text-sm ${message.isInstructorMessage ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                    {message.userId.name}
                    {message.isInstructorMessage && (
                      <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                        {t('instructor')}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(message.createdAt)}
                  </span>
                  {message.isPinned && (
                    <Pin className="w-3 h-3 text-gray-400" />
                  )}
                </div>

                <p className="text-gray-700 dark:text-gray-300 text-sm break-words">
                  {message.message}
                </p>

                {/* Attachments */}
                {message.attachments?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.attachments.map((att, idx) => (
                      <a
                        key={idx}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <Paperclip className="w-4 h-4" />
                        {att.name}
                      </a>
                    ))}
                  </div>
                )}

                {/* Reactions */}
                {message.reactions?.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {message.reactions.map((reaction, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleReaction(message._id, reaction.emoji)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                          reaction.userIds.includes(session?.user?.id || '')
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {reaction.emoji} {reaction.userIds.length}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t('typeMessage')}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>
          <button
            type="submit"
            disabled={isLoading || !newMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
