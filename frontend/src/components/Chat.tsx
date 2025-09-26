import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useQuery } from 'react-query';
import { chatApi } from '../services/api';
import { toast } from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';

interface ChatMessage {
  id: string;
  message: string;
  username: string;
  userId: string;
  timestamp: Date;
  reactions: Array<{
    emoji: string;
    users: Array<{ id: string; username: string }>;
  }>;
}

interface ChatProps {
  roomId: string;
}

const Chat: React.FC<ChatProps> = ({ roomId }) => {
  const { user } = useAuth();
  const { socket, emit, on, off } = useSocket();
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Get chat messages
  const { data: messagesData, refetch: refetchMessages } = useQuery(
    ['chat', roomId],
    () => chatApi.getMessages(roomId),
    {
      enabled: !!roomId,
      refetchInterval: 5000, // Refetch every 5 seconds
    }
  );

  const messages: ChatMessage[] = messagesData?.data?.messages || [];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket event listeners
  useEffect(() => {
    const handleChatMessage = (data: any) => {
      // Add new message to local state
      refetchMessages();
    };

    const handleChatTyping = (data: any) => {
      if (data.userId !== user?.id) {
        if (data.isTyping) {
          setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
        } else {
          setTypingUsers(prev => prev.filter(id => id !== data.userId));
        }
      }
    };

    const handleChatReaction = (data: any) => {
      // Refresh messages to get updated reactions
      refetchMessages();
    };

    on('chat_message', handleChatMessage);
    on('chat_typing', handleChatTyping);
    on('chat_reaction', handleChatReaction);

    return () => {
      off('chat_message', handleChatMessage);
      off('chat_typing', handleChatTyping);
      off('chat_reaction', handleChatReaction);
    };
  }, [user, on, off, refetchMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !user) return;

    try {
      await chatApi.sendMessage(roomId, message.trim());
      setMessage('');
      setIsTyping(false);
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    // Send typing indicator
    if (!isTyping) {
      setIsTyping(true);
      emit('chat_typing', { roomId, isTyping: true });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      emit('chat_typing', { roomId, isTyping: false });
    }, 1000);
  };

  const handleEmojiClick = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await chatApi.addReaction(messageId, emoji);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add reaction');
    }
  };

  const formatTime = (timestamp: Date): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (messageUserId: string): boolean => {
    return messageUserId === user?.id;
  };

  return (
    <div className="card h-96 flex flex-col">
      <div className="card-header pb-3">
        <h3 className="card-title text-lg">Chat</h3>
        {typingUsers.length > 0 && (
          <p className="text-sm text-secondary-500 dark:text-secondary-400">
            {typingUsers.length === 1 
              ? 'Someone is typing...' 
              : `${typingUsers.length} people are typing...`
            }
          </p>
        )}
      </div>

      <div className="card-content flex-1 overflow-hidden">
        {/* Messages */}
        <div className="h-full overflow-y-auto space-y-2 pr-2">
          {messages.length === 0 ? (
            <div className="text-center text-secondary-500 dark:text-secondary-400 py-8">
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${isOwnMessage(msg.userId) ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs p-3 rounded-lg ${
                    isOwnMessage(msg.userId)
                      ? 'bg-primary-500 text-white'
                      : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100'
                  }`}
                >
                  {!isOwnMessage(msg.userId) && (
                    <p className="text-xs font-semibold mb-1 opacity-75">
                      {msg.username}
                    </p>
                  )}
                  <p className="text-sm">{msg.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-75">
                      {formatTime(msg.timestamp)}
                    </span>
                    {msg.reactions.length > 0 && (
                      <div className="flex space-x-1">
                        {msg.reactions.map((reaction, index) => (
                          <button
                            key={index}
                            onClick={() => handleReaction(msg.id, reaction.emoji)}
                            className="text-xs hover:bg-black/10 dark:hover:bg-white/10 px-1 rounded"
                          >
                            {reaction.emoji} {reaction.users.length}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="card-footer pt-3 border-t border-secondary-200 dark:border-secondary-700">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={handleTyping}
              placeholder="Type a message..."
              className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              maxLength={1000}
            />
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2 z-10">
                <EmojiPicker
                  onEmojiClick={(emojiData) => handleEmojiClick(emojiData.emoji)}
                  width={300}
                  height={400}
                />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 transition-colors"
          >
            <Smile className="w-5 h-5" />
          </button>
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
