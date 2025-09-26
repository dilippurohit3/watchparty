import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Settings, 
  Users, 
  Crown,
  Mic,
  MicOff,
  Hand
} from 'lucide-react';

interface RaveDJControlsProps {
  isDJ: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSkipForward: () => void;
  onSkipBack: () => void;
  onVolumeChange: (volume: number) => void;
  onSettings: () => void;
  onRequestControl: () => void;
  onRaiseHand: () => void;
  onToggleMic: () => void;
  volume: number;
  isMuted: boolean;
  isMicOn: boolean;
  hasHandRaised: boolean;
  queueLength: number;
  participantCount: number;
}

const RaveDJControls: React.FC<RaveDJControlsProps> = ({
  isDJ,
  isPlaying,
  onPlay,
  onPause,
  onSkipForward,
  onSkipBack,
  onVolumeChange,
  onSettings,
  onRequestControl,
  onRaiseHand,
  onToggleMic,
  volume,
  isMuted,
  isMicOn,
  hasHandRaised,
  queueLength,
  participantCount
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const handleVolumeClick = () => {
    if (isMuted) {
      onVolumeChange(0.5);
    } else {
      onVolumeChange(0);
    }
  };

  return (
    <div className="rave-dj-controls">
      {/* DJ Status */}
      {isDJ && (
        <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-3 py-1 rounded-full text-sm font-bold">
          <Crown className="w-4 h-4" />
          <span>DJ</span>
        </div>
      )}

      {/* Main Controls */}
      <div className="flex items-center space-x-2">
        {/* Skip Back */}
        <button
          onClick={onSkipBack}
          className="rave-dj-btn"
          title="Previous"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        {/* Play/Pause */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          className={`rave-dj-btn ${isPlaying ? 'bg-gradient-to-r from-red-500 to-pink-500' : 'bg-gradient-to-r from-green-500 to-emerald-500'}`}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </button>

        {/* Skip Forward */}
        <button
          onClick={onSkipForward}
          className="rave-dj-btn"
          title="Next"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Volume Control */}
      <div className="relative">
        <button
          onClick={handleVolumeClick}
          className="rave-dj-btn"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>
        
        {showVolumeSlider && (
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm rounded-lg p-3">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Mic Control */}
      <button
        onClick={onToggleMic}
        className={`rave-dj-btn ${isMicOn ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gray-600'}`}
        title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
      >
        {isMicOn ? (
          <Mic className="w-5 h-5" />
        ) : (
          <MicOff className="w-5 h-5" />
        )}
      </button>

      {/* Settings */}
      <button
        onClick={onSettings}
        className="rave-dj-btn"
        title="Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Queue Info */}
      <div className="flex items-center space-x-1 text-white text-sm">
        <span className="text-gray-400">Queue:</span>
        <span className="font-bold">{queueLength}</span>
      </div>

      {/* Participant Count */}
      <div className="flex items-center space-x-1 text-white text-sm">
        <Users className="w-4 h-4" />
        <span className="font-bold">{participantCount}</span>
      </div>

      {/* Non-DJ Controls */}
      {!isDJ && (
        <div className="flex items-center space-x-2">
          {/* Request Control */}
          <button
            onClick={onRequestControl}
            className="rave-dj-btn bg-gradient-to-r from-purple-500 to-pink-500"
            title="Request DJ Control"
          >
            <Crown className="w-5 h-5" />
          </button>

          {/* Raise Hand */}
          <button
            onClick={onRaiseHand}
            className={`rave-dj-btn ${hasHandRaised ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gray-600'}`}
            title={hasHandRaised ? 'Lower Hand' : 'Raise Hand'}
          >
            <Hand className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default RaveDJControls;
