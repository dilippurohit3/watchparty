import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Settings, 
  Users, 
  MessageCircle, 
  Heart, 
  Share2,
  MoreVertical,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Queue,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Crown,
  Hand,
  Maximize,
  Minimize,
  X,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import RaveMiniChat from './RaveMiniChat';
import RaveReactionOverlay from './RaveReactionOverlay';
import BoltzyShareSheet from './BoltzyShareSheet';
import BoltzyDJControls from './BoltzyDJControls';

interface EnhancedRoomUIProps {
  roomId: string;
  roomName: string;
  roomCode: string;
  isHost: boolean;
  isCoHost: boolean;
  canRequestControl: boolean;
  onRequestControl: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onSkipVideo: () => void;
  onPreviousVideo: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onTogglePlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onShareRoom: () => void;
  onSettings: () => void;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isShuffled: boolean;
  isRepeating: boolean;
  participants: any[];
  reactions: any[];
  onReaction: (type: string) => void;
  videoUrl: string;
}

const EnhancedRoomUI: React.FC<EnhancedRoomUIProps> = ({
  roomId,
  roomName,
  roomCode,
  isHost,
  isCoHost,
  canRequestControl,
  onRequestControl,
  onToggleMute,
  onToggleVideo,
  onSkipVideo,
  onPreviousVideo,
  onToggleShuffle,
  onToggleRepeat,
  onTogglePlayPause,
  onSeek,
  onVolumeChange,
  onShareRoom,
  onSettings,
  currentTime,
  duration,
  isPlaying,
  volume,
  isMuted,
  isVideoEnabled,
  isShuffled,
  isRepeating,
  participants,
  reactions,
  onReaction,
  videoUrl
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [showMiniChat, setShowMiniChat] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showDJControls, setShowDJControls] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000);
    setControlsTimeout(timeout);
  };

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      setControlsTimeout(timeout);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [controlsTimeout]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col" onMouseMove={handleMouseMove}>
      {/* Big Video Player Area - Mobile-first */}
      <div className="flex-1 relative bg-black">
        {/* Video Player with Enhanced Controls */}
        <div className="absolute inset-0 flex items-center justify-center">
          <video 
            src={videoUrl} 
            autoPlay={isPlaying} 
            muted={isMuted} 
            className="w-full h-full object-contain rounded-2xl"
            style={{ aspectRatio: '16/9' }}
          />
          {!isPlaying && (
            <button 
              onClick={onTogglePlayPause} 
              className="absolute p-6 bg-black/50 backdrop-blur-xl rounded-full text-white hover:scale-110 transition-all duration-300 border border-white/20 shadow-2xl"
            >
              <Play size={64} />
            </button>
          )}
        </div>

        {/* Enhanced Overlay Controls */}
        <div className={`absolute inset-0 pointer-events-none transition-all duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Top Overlay - Room Info & Actions */}
          <div className="absolute top-4 left-4 right-4 pointer-events-auto">
            <div className="flex items-center justify-between">
              <div className="boltzy-glass rounded-2xl p-4 flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <div>
                  <h2 className="text-white font-bold text-lg">{roomName}</h2>
                  <p className="text-gray-300 text-sm">#{roomCode}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setShowDJControls(true)} 
                  className="p-3 boltzy-glass rounded-2xl text-white hover:bg-white/20 transition-all duration-300 hover:scale-105"
                >
                  <Settings size={20} />
                </button>
                <button 
                  onClick={() => setShowShareSheet(true)} 
                  className="p-3 boltzy-glass rounded-2xl text-white hover:bg-white/20 transition-all duration-300 hover:scale-105"
                >
                  <Share2 size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Overlay - Enhanced Controls */}
          <div className="absolute bottom-4 left-4 right-4 pointer-events-auto">
            <div className="boltzy-glass rounded-3xl p-6">
              {/* Progress Bar */}
              <div className="mb-4">
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={(e) => onSeek(Number(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-pink-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={onTogglePlayPause} 
                    className="p-4 bg-white/20 rounded-full backdrop-blur-md text-white hover:scale-110 transition-all duration-300 hover:bg-white/30"
                  >
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                  </button>
                  
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={onToggleMute} 
                      className="p-3 bg-white/20 rounded-full backdrop-blur-md text-white hover:scale-110 transition-all duration-300"
                    >
                      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => onVolumeChange(Number(e.target.value))}
                      className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-lg"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => setShowMiniChat(!showMiniChat)} 
                    className="p-3 boltzy-glass rounded-2xl text-white hover:bg-white/20 transition-all duration-300 hover:scale-105"
                  >
                    <MessageCircle size={20} />
                  </button>
                  <button 
                    onClick={() => setShowParticipants(!showParticipants)} 
                    className="p-3 boltzy-glass rounded-2xl text-white hover:bg-white/20 transition-all duration-300 hover:scale-105"
                  >
                    <Users size={20} />
                  </button>
                  <button 
                    onClick={toggleFullScreen} 
                    className="p-3 boltzy-glass rounded-2xl text-white hover:bg-white/20 transition-all duration-300 hover:scale-105"
                  >
                    {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reaction Overlay */}
        <RaveReactionOverlay onReaction={onReaction} reactions={reactions} />

        {/* Floating Participants List */}
        {showParticipants && (
          <div className="absolute top-20 right-4 w-80 boltzy-glass rounded-2xl shadow-2xl p-4 z-40">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Participants ({participants.length})</h3>
              <button 
                onClick={() => setShowParticipants(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={16} className="text-gray-400" />
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto boltzy-scrollbar">
              {participants.map((participant, index) => (
                <div key={index} className="flex items-center space-x-3 mb-3 p-2 hover:bg-white/5 rounded-xl transition-colors">
                  <div className="relative">
                    <img 
                      src={participant.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${participant.username}`} 
                      alt={participant.username} 
                      className="w-10 h-10 rounded-full object-cover border-2 border-pink-500/50" 
                    />
                    {participant.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{participant.username}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      {participant.isHost && <Crown size={12} className="text-yellow-400" />}
                      {participant.isCoHost && <Hand size={12} className="text-blue-400" />}
                      {participant.isMuted && <MicOff size={12} className="text-red-400" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pinned DJ Controls */}
        {(isHost || isCoHost) && (
          <div className="absolute top-20 left-4 boltzy-glass rounded-2xl p-4 z-40">
            <div className="flex items-center space-x-2 mb-3">
              <Crown className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-semibold text-sm">DJ Controls</span>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={onToggleShuffle}
                className={`p-2 rounded-xl transition-all duration-300 ${
                  isShuffled ? 'bg-pink-500 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                <Shuffle size={16} />
              </button>
              <button 
                onClick={onToggleRepeat}
                className={`p-2 rounded-xl transition-all duration-300 ${
                  isRepeating ? 'bg-pink-500 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                <Repeat size={16} />
              </button>
              <button 
                onClick={onSkipVideo}
                className="p-2 bg-white/10 text-gray-400 hover:bg-white/20 rounded-xl transition-all duration-300"
              >
                <SkipForward size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Request Control Button for Non-DJs */}
        {!isHost && !isCoHost && canRequestControl && (
          <div className="absolute bottom-20 left-4 pointer-events-auto">
            <button 
              onClick={onRequestControl}
              className="flex items-center space-x-2 px-4 py-3 boltzy-glass rounded-2xl text-white hover:bg-white/20 transition-all duration-300 hover:scale-105"
            >
              <Hand size={20} />
              <span className="font-semibold">Request Control</span>
            </button>
          </div>
        )}
      </div>

      {/* Mini Chat */}
      <RaveMiniChat 
        roomId={roomId} 
        isVisible={showMiniChat} 
        onToggle={() => setShowMiniChat(!showMiniChat)} 
      />

      {/* Share Sheet */}
      <BoltzyShareSheet
        isOpen={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        roomName={roomName}
        roomCode={roomCode}
        shareUrl={`${window.location.origin}/join/${roomCode}`}
      />

      {/* DJ Controls Modal */}
      <BoltzyDJControls
        isOpen={showDJControls}
        onClose={() => setShowDJControls(false)}
        roomId={roomId}
        isHost={isHost}
        isCoHost={isCoHost}
        participants={participants}
      />
    </div>
  );
};

export default EnhancedRoomUI;
