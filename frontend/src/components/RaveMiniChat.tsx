import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Heart, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';

interface MiniChatMessage {
  id: string;
  message: string;
  username: string;
  userId: string;
  timestamp: Date;
  type: 'text' | 'reaction';
  emoji?: string;
}

interface RaveMiniChatProps {
  roomId: string;
  isVisible: boolean;
  onToggle: () => void;
}

const RaveMiniChat: React.FC<RaveMiniChatProps> = ({
  roomId,
  isVisible,
  onToggle
}) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<MiniChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useAuth();
  const { socket, emit, on, off } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickReactions = [
    { emoji: '❤️', type: 'heart' },
    { emoji: '🔥', type: 'fire' },
    { emoji: '⚡', type: 'zap' },
    { emoji: '✨', type: 'sparkles' },
    { emoji: '😂', type: 'laugh' }
  ];

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleChatMessage = (data: any) => {
      setMessages(prev => [...prev, {
        id: data.id,
        message: data.message,
        username: data.username,
        userId: data.userId,
        timestamp: new Date(data.timestamp),
        type: 'text'
      }]);
    };

    const handleReaction = (data: any) => {
      setMessages(prev => [...prev, {
        id: data.id,
        message: '',
        username: data.username,
        userId: data.userId,
        timestamp: new Date(data.timestamp),
        type: 'reaction',
        emoji: data.emoji
      }]);
    };

    const handleTip = (data: any) => {
      setMessages(prev => [...prev, {
        id: data.id,
        message: '',
        username: data.username,
        userId: data.userId,
        timestamp: new Date(data.timestamp),
        type: 'tip',
        amount: data.amount,
        emoji: '💰'
      }]);
    };

    on('chat_message', handleChatMessage);
    on('chat_reaction', handleReaction);
    on('chat_tip', handleTip);

    return () => {
      off('chat_message', handleChatMessage);
      off('chat_reaction', handleReaction);
      off('chat_tip', handleTip);
    };
  }, [on, off]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    emit('chat_message', {
      roomId,
      message: message.trim(),
      userId: user.id,
      username: user.username
    });

    setMessage('');
  };

  const handleQuickReaction = (reaction: { emoji: string; type: string }) => {
    if (!user) return;

    emit('chat_reaction', {
      roomId,
      emoji: reaction.emoji,
      type: reaction.type,
      userId: user.id,
      username: user.username
    });
  };


  const formatTime = (timestamp: Date): string => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-all duration-300 z-50"
      >
        💬
      </button>
    );
  }

  return (
    <div className="rave-mini-chat">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-sm">Live Chat</h3>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="space-y-2 max-h-32 overflow-y-auto rave-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className="rave-mini-chat-message">
            {msg.type === 'text' ? (
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-pink-400 text-xs font-medium">
                    {msg.username}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <p className="text-white text-sm mt-1">{msg.message}</p>
              </div>
            ) : msg.type === 'reaction' ? (
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{msg.emoji}</span>
                <span className="text-pink-400 text-xs">{msg.username}</span>
              </div>
            ) : null}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Reactions */}
      <div className="flex space-x-1 mt-3">
        {quickReactions.map((reaction) => (
          <button
            key={reaction.type}
            onClick={() => handleQuickReaction(reaction)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <span className="text-lg">{reaction.emoji}</span>
          </button>
        ))}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="mt-3">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Say something..."
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-400 focus:outline-none focus:border-pink-500"
            maxLength={100}
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all duration-300"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default RaveMiniChat;
