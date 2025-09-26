import React, { useState, useEffect, useRef } from 'react';
import { Heart, Star, Fire, Zap, Sparkles, Music, Crown, ThumbsUp, PartyPopper } from 'lucide-react';

interface Reaction {
  id: string;
  type: 'heart' | 'star' | 'fire' | 'zap' | 'sparkles' | 'music' | 'crown' | 'thumbs' | 'party' | 'custom';
  emoji?: string;
  x: number;
  y: number;
  timestamp: number;
  userId: string;
  username: string;
}

interface RaveReactionOverlayProps {
  onReaction: (type: string) => void;
  reactions: Reaction[];
}

const RaveReactionOverlay: React.FC<RaveReactionOverlayProps> = ({
  onReaction,
  reactions
}) => {
  const [localReactions, setLocalReactions] = useState<Reaction[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);

  const reactionTypes = [
    { type: 'heart', icon: Heart, color: 'text-pink-500', emoji: '❤️', gradient: 'from-red-500 to-pink-500' },
    { type: 'star', icon: Star, color: 'text-yellow-500', emoji: '⭐', gradient: 'from-yellow-400 to-orange-500' },
    { type: 'fire', icon: Fire, color: 'text-orange-500', emoji: '🔥', gradient: 'from-orange-500 to-red-500' },
    { type: 'zap', icon: Zap, color: 'text-blue-500', emoji: '⚡', gradient: 'from-blue-400 to-cyan-500' },
    { type: 'sparkles', icon: Sparkles, color: 'text-purple-500', emoji: '✨', gradient: 'from-purple-400 to-pink-500' },
    { type: 'music', icon: Music, color: 'text-green-500', emoji: '🎵', gradient: 'from-green-400 to-emerald-500' },
    { type: 'crown', icon: Crown, color: 'text-yellow-300', emoji: '👑', gradient: 'from-yellow-300 to-yellow-500' },
    { type: 'thumbs', icon: ThumbsUp, color: 'text-blue-600', emoji: '👍', gradient: 'from-blue-500 to-indigo-500' },
    { type: 'party', icon: PartyPopper, color: 'text-pink-400', emoji: '🎉', gradient: 'from-pink-400 to-purple-500' }
  ];

  useEffect(() => {
    // Add new reactions to local state
    const newReactions = reactions.filter(
      reaction => !localReactions.some(lr => lr.id === reaction.id)
    );
    
    if (newReactions.length > 0) {
      setLocalReactions(prev => [...prev, ...newReactions]);
    }
  }, [reactions, localReactions]);

  const handleReaction = (type: string) => {
    onReaction(type);
    
    // Add continuous falling animation for certain reactions
    if (type === 'heart' || type === 'confetti') {
      const duration = type === 'heart' ? 3000 : 2000;
      const count = type === 'heart' ? 5 : 3;
      
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          createFallingReaction(type);
        }, i * 200);
      }
    }
  };

  const createFallingReaction = (type: string) => {
    const container = document.createElement('div');
    container.className = 'fixed inset-0 pointer-events-none z-50';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '50';
    
    const element = document.createElement('div');
    element.className = `absolute text-4xl animate-bounce`;
    element.style.left = `${Math.random() * 100}%`;
    element.style.top = '-50px';
    element.style.animation = 'falling 3s ease-in-out forwards';
    
    if (type === 'heart') {
      element.innerHTML = '💖';
      element.style.color = '#ff0080';
    } else if (type === 'confetti') {
      element.innerHTML = '🎉';
      element.style.color = '#ffd700';
    }
    
    container.appendChild(element);
    document.body.appendChild(container);
    
    setTimeout(() => {
      document.body.removeChild(container);
    }, 3000);
  };


  const removeReaction = (id: string) => {
    setLocalReactions(prev => prev.filter(r => r.id !== id));
  };

  const getReactionIcon = (type: string) => {
    const reactionType = reactionTypes.find(rt => rt.type === type);
    return reactionType?.icon || Heart;
  };

  const getReactionEmoji = (type: string) => {
    const reactionType = reactionTypes.find(rt => rt.type === type);
    return reactionType?.emoji || '❤️';
  };

  const getReactionColor = (type: string) => {
    const reactionType = reactionTypes.find(rt => rt.type === type);
    return reactionType?.color || 'text-pink-500';
  };

  return (
    <div className="rave-reaction-overlay" ref={overlayRef}>
      {/* Reaction Buttons */}
      <div className="absolute bottom-4 left-4 flex space-x-2 z-20">
        {reactionTypes.map(({ type, icon: Icon, color }) => (
          <button
            key={type}
            onClick={() => handleReaction(type)}
            className={`p-3 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-110 ${color}`}
          >
            <Icon className="w-6 h-6" />
          </button>
        ))}
        
      </div>

      {/* Floating Reactions */}
      {localReactions.map((reaction) => {
        const Icon = getReactionIcon(reaction.type);
        const emoji = getReactionEmoji(reaction.type);
        const color = getReactionColor(reaction.type);
        
        return (
          <div
            key={reaction.id}
            className="rave-floating rave-heart-animation"
            style={{
              left: `${reaction.x}px`,
              top: `${reaction.y}px`,
              animationDelay: '0s'
            }}
            onAnimationEnd={() => removeReaction(reaction.id)}
          >
            <div className="flex flex-col items-center">
              <div className={`text-4xl ${color} animate-bounce`}>
                {reaction.emoji || emoji}
              </div>
              {reaction.username && (
                <div className="text-white text-xs bg-black/50 px-2 py-1 rounded-full">
                  {reaction.username}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Confetti Animation */}
      {localReactions.some(r => r.type === 'sparkles') && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="rave-floating rave-confetti-animation"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`
              }}
            >
              <div className="text-2xl">
                {['🎉', '✨', '🌟', '💫', '⭐'][Math.floor(Math.random() * 5)]}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RaveReactionOverlay;
