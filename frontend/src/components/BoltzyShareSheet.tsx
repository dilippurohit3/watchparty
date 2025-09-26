import React, { useState } from 'react';
import { 
  Share2, 
  Copy, 
  MessageCircle, 
  Mail, 
  Twitter, 
  Facebook, 
  Instagram, 
  Link, 
  QrCode,
  X,
  Check,
  Users,
  Music,
  Heart
} from 'lucide-react';

interface BoltzyShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  roomData: {
    id: string;
    name: string;
    description?: string;
    roomCode: string;
    participantCount: number;
    isLive: boolean;
    dj: {
      username: string;
      avatar?: string;
    };
    currentVideo?: {
      title: string;
      thumbnail?: string;
    };
  };
}

const BoltzyShareSheet: React.FC<BoltzyShareSheetProps> = ({
  isOpen,
  onClose,
  roomData
}) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const roomUrl = `${window.location.origin}/room/${roomData.id}`;
  const shareText = `🎵 Join me in "${roomData.name}" on Boltzy! ${roomData.isLive ? '🔴 LIVE' : ''} ${roomData.roomCode ? `Room Code: ${roomData.roomCode}` : ''}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShare = async (platform: string) => {
    const shareData = {
      title: roomData.name,
      text: shareText,
      url: roomUrl
    };

    switch (platform) {
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share(shareData);
          } catch (err) {
            console.error('Error sharing:', err);
          }
        }
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(roomUrl)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(roomUrl)}`);
        break;
      case 'instagram':
        // Instagram doesn't support direct sharing, show instructions
        alert('Copy the link and paste it in your Instagram story or post!');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + roomUrl)}`);
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(roomUrl)}&text=${encodeURIComponent(shareText)}`);
        break;
    }
  };

  const shareOptions = [
    {
      id: 'native',
      name: 'Share',
      icon: Share2,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/20',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'copy',
      name: 'Copy Link',
      icon: copied ? Check : Copy,
      color: 'text-green-500',
      bgColor: 'bg-green-500/20',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      id: 'qr',
      name: 'QR Code',
      icon: QrCode,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/20',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: Twitter,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/20',
      gradient: 'from-blue-400 to-blue-600'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'text-blue-600',
      bgColor: 'bg-blue-600/20',
      gradient: 'from-blue-600 to-blue-800'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/20',
      gradient: 'from-green-500 to-green-600'
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: MessageCircle,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/20',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/20',
      gradient: 'from-pink-500 to-purple-500'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="relative w-full max-w-md bg-black/90 backdrop-blur-md rounded-t-3xl border-t border-white/10 animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-white/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Share Room</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Room Preview */}
        <div className="px-6 py-4">
          <div className="boltzy-glass rounded-2xl p-4">
            <div className="flex items-start space-x-3">
              {/* Room Thumbnail */}
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                {roomData.currentVideo?.thumbnail ? (
                  <img
                    src={roomData.currentVideo.thumbnail}
                    alt={roomData.currentVideo.title}
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  <Music className="w-8 h-8 text-white" />
                )}
              </div>

              {/* Room Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-lg truncate">
                  {roomData.name}
                </h3>
                <p className="text-white/70 text-sm mb-2 line-clamp-2">
                  {roomData.description || 'Join the party!'}
                </p>
                
                <div className="flex items-center space-x-4 text-sm text-white/60">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{roomData.participantCount} watching</span>
                  </div>
                  {roomData.isLive && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span>LIVE</span>
                    </div>
                  )}
                </div>

                {/* DJ Info */}
                <div className="flex items-center space-x-2 mt-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {roomData.dj.username.charAt(0)}
                    </span>
                  </div>
                  <span className="text-white/70 text-sm">
                    DJ {roomData.dj.username}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Share Options */}
        <div className="px-6 py-4">
          <h3 className="text-white font-semibold text-lg mb-4">Share via</h3>
          <div className="grid grid-cols-4 gap-4">
            {shareOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  if (option.id === 'copy') {
                    handleCopyLink();
                  } else if (option.id === 'qr') {
                    setShowQR(!showQR);
                  } else {
                    handleShare(option.id);
                  }
                }}
                className="boltzy-glass rounded-2xl p-4 text-center hover:scale-105 transition-transform duration-200"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${option.gradient} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                  <option.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-white text-sm font-medium">{option.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* QR Code Section */}
        {showQR && (
          <div className="px-6 py-4 border-t border-white/10">
            <div className="boltzy-glass rounded-2xl p-6 text-center">
              <h3 className="text-white font-semibold text-lg mb-4">QR Code</h3>
              <div className="w-48 h-48 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                <div className="text-center">
                  <QrCode className="w-24 h-24 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">QR Code would be generated here</p>
                </div>
              </div>
              <p className="text-white/70 text-sm">
                Scan this code to join the room instantly
              </p>
            </div>
          </div>
        )}

        {/* Room Code */}
        {roomData.roomCode && (
          <div className="px-6 py-4 border-t border-white/10">
            <div className="boltzy-glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-lg">Room Code</h3>
                  <p className="text-white/70 text-sm">Share this code with friends</p>
                </div>
                <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-2xl px-4 py-2 rounded-xl">
                  {roomData.roomCode}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Spacing */}
        <div className="h-6" />
      </div>
    </div>
  );
};

export default BoltzyShareSheet;
