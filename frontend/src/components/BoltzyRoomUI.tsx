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
  Hand
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import RaveMiniChat from './RaveMiniChat';
import RaveReactionOverlay from './RaveReactionOverlay';

interface BoltzyRoomUIProps {
  roomId: string;
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
  isShuffled: boolean;
  repeatMode: 'none' | 'one' | 'all';
  participants: any[];
  reactions: any[];
  onReaction: (type: string) => void;
}

const BoltzyRoomUI: React.FC<BoltzyRoomUIProps> = ({
  roomId,
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
  isShuffled,
  repeatMode,
  participants,
  reactions,
  onReaction
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [showChat, setShowChat] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    if (showControls) {
      handleMouseMove();
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    onSeek(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    onVolumeChange(volume);
  };

  const handleReaction = (type: string) => {
    onReaction(type);
    setShowReactions(false);
  };

  return (
    <div className="relative w-full h-full bg-black">
      {/* Main Video Area */}
      <div className="relative w-full h-full">
        {/* Video Player Placeholder */}
        <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-white" />
            </div>
            <p className="text-white/70 text-lg">Video Player</p>
            <p className="text-white/50 text-sm">Click to play</p>
          </div>
        </div>

        {/* Overlay Controls */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Top Controls */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
            {/* Room Info */}
            <div className="boltzy-glass rounded-2xl px-4 py-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Crown className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Boltzy Room</p>
                  <p className="text-white/70 text-xs">Live • {participants.length} participants</p>
                </div>
              </div>
            </div>

            {/* Top Right Controls */}
            <div className="flex items-center space-x-2">
              {/* Share Button */}
              <button
                onClick={onShareRoom}
                className="boltzy-btn boltzy-btn-secondary p-3 rounded-2xl"
              >
                <Share2 className="w-5 h-5" />
              </button>

              {/* Settings Button */}
              <button
                onClick={onSettings}
                className="boltzy-btn boltzy-btn-secondary p-3 rounded-2xl"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* More Options */}
              <button className="boltzy-btn boltzy-btn-secondary p-3 rounded-2xl">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-4 left-4 right-4">
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-white/70 text-sm mb-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #ff0080 0%, #ff0080 ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
            </div>

            {/* Main Controls */}
            <div className="boltzy-glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                {/* Left Controls */}
                <div className="flex items-center space-x-3">
                  {/* Previous */}
                  <button
                    onClick={onPreviousVideo}
                    className="boltzy-btn boltzy-btn-ghost p-3 rounded-2xl"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>

                  {/* Play/Pause */}
                  <button
                    onClick={onTogglePlayPause}
                    className="boltzy-btn boltzy-btn-primary p-4 rounded-2xl"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6" />
                    )}
                  </button>

                  {/* Next */}
                  <button
                    onClick={onSkipVideo}
                    className="boltzy-btn boltzy-btn-ghost p-3 rounded-2xl"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>

                  {/* Volume */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onVolumeChange(isMuted ? 0.5 : 0)}
                      className="boltzy-btn boltzy-btn-ghost p-2 rounded-xl"
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-20 h-2 bg-white/20 rounded-full appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>

                {/* Center Controls */}
                <div className="flex items-center space-x-2">
                  {/* Shuffle */}
                  <button
                    onClick={onToggleShuffle}
                    className={`boltzy-btn p-3 rounded-2xl ${
                      isShuffled ? 'boltzy-btn-primary' : 'boltzy-btn-ghost'
                    }`}
                  >
                    <Shuffle className="w-5 h-5" />
                  </button>

                  {/* Repeat */}
                  <button
                    onClick={onToggleRepeat}
                    className={`boltzy-btn p-3 rounded-2xl ${
                      repeatMode !== 'none' ? 'boltzy-btn-primary' : 'boltzy-btn-ghost'
                    }`}
                  >
                    <Repeat className="w-5 h-5" />
                  </button>
                </div>

                {/* Right Controls */}
                <div className="flex items-center space-x-2">
                  {/* Chat */}
                  <button
                    onClick={() => setShowChat(!showChat)}
                    className={`boltzy-btn p-3 rounded-2xl ${
                      showChat ? 'boltzy-btn-primary' : 'boltzy-btn-ghost'
                    }`}
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>

                  {/* Reactions */}
                  <button
                    onClick={() => setShowReactions(!showReactions)}
                    className="boltzy-btn boltzy-btn-ghost p-3 rounded-2xl"
                  >
                    <Heart className="w-5 h-5" />
                  </button>

                  {/* Participants */}
                  <button
                    onClick={() => setShowParticipants(!showParticipants)}
                    className="boltzy-btn boltzy-btn-ghost p-3 rounded-2xl"
                  >
                    <Users className="w-5 h-5" />
                  </button>

                  {/* Queue */}
                  <button
                    onClick={() => setShowQueue(!showQueue)}
                    className="boltzy-btn boltzy-btn-ghost p-3 rounded-2xl"
                  >
                    <Queue className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* DJ Controls (for hosts/co-hosts) */}
          {(isHost || isCoHost) && (
            <div className="absolute top-20 left-4">
              <div className="boltzy-glass rounded-2xl p-3">
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <span className="text-white font-semibold text-sm">DJ Controls</span>
                </div>
              </div>
            </div>
          )}

          {/* Request Control Button (for non-hosts) */}
          {!isHost && !isCoHost && canRequestControl && (
            <div className="absolute top-20 right-4">
              <button
                onClick={onRequestControl}
                className="boltzy-btn boltzy-btn-primary p-3 rounded-2xl"
              >
                <Hand className="w-4 h-4 mr-2" />
                Request Control
              </button>
            </div>
          )}
        </div>

        {/* Reaction Overlay */}
        <RaveReactionOverlay
          onReaction={handleReaction}
          reactions={reactions}
        />

        {/* Mini Chat */}
        {showChat && (
          <RaveMiniChat
            roomId={roomId}
            isVisible={showChat}
            onToggle={() => setShowChat(false)}
          />
        )}
      </div>
    </div>
  );
};

export default BoltzyRoomUI;
