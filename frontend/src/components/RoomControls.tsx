import React, { useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Volume2, Settings } from 'lucide-react';

interface RoomControlsProps {
  room: any;
  currentVideo: any;
  onVideoChange: (videoId: string) => void;
}

const RoomControls: React.FC<RoomControlsProps> = ({
  room,
  currentVideo,
  onVideoChange,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [isShuffled, setIsShuffled] = useState(false);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // Emit socket event for video play/pause
  };

  const handleSkipForward = () => {
    // Skip to next video in playlist
    // Emit socket event
  };

  const handleSkipBack = () => {
    // Skip to previous video in playlist
    // Emit socket event
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      setIsMuted(false);
    } else {
      setIsMuted(true);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    // Emit socket event for playback rate change
  };

  const handleRepeatToggle = () => {
    const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
    // Emit socket event for repeat mode change
  };

  const handleShuffleToggle = () => {
    setIsShuffled(!isShuffled);
    // Emit socket event for shuffle toggle
  };

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 p-4">
      <div className="flex items-center justify-between">
        {/* Left Controls */}
        <div className="flex items-center space-x-4">
          {/* Play/Pause */}
          <button
            onClick={handlePlayPause}
            className="p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>

          {/* Skip Controls */}
          <button
            onClick={handleSkipBack}
            className="p-2 text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 transition-colors"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={handleSkipForward}
            className="p-2 text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 transition-colors"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Center - Video Info */}
        <div className="flex-1 mx-6">
          {currentVideo ? (
            <div className="text-center">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 truncate">
                {currentVideo.title}
              </h3>
              <p className="text-sm text-secondary-500 dark:text-secondary-400">
                {currentVideo.type === 'youtube' ? 'YouTube' : 
                 currentVideo.type === 'file' ? 'Uploaded File' : 
                 currentVideo.type === 'url' ? 'URL' : 'Screen Share'}
              </p>
            </div>
          ) : (
            <div className="text-center text-secondary-500 dark:text-secondary-400">
              <p>No video selected</p>
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-4">
          {/* Volume Control */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleMuteToggle}
              className="p-1 text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 transition-colors"
            >
              {isMuted ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-secondary-300 dark:bg-secondary-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Playback Rate */}
          <select
            value={playbackRate}
            onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
            className="bg-transparent text-secondary-700 dark:text-secondary-300 text-sm border border-secondary-300 dark:border-secondary-600 rounded px-2 py-1"
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>

          {/* Repeat Mode */}
          <button
            onClick={handleRepeatToggle}
            className={`p-2 rounded-full transition-colors ${
              repeatMode === 'none'
                ? 'text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200'
                : 'text-primary-500 hover:text-primary-600'
            }`}
          >
            <Repeat className="w-5 h-5" />
          </button>

          {/* Shuffle */}
          <button
            onClick={handleShuffleToggle}
            className={`p-2 rounded-full transition-colors ${
              isShuffled
                ? 'text-primary-500 hover:text-primary-600'
                : 'text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          {/* Settings */}
          <button className="p-2 text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-secondary-500 dark:text-secondary-400">
            0:00
          </span>
          <div className="flex-1 h-1 bg-secondary-300 dark:bg-secondary-600 rounded-full">
            <div className="h-full bg-primary-500 rounded-full" style={{ width: '0%' }} />
          </div>
          <span className="text-xs text-secondary-500 dark:text-secondary-400">
            0:00
          </span>
        </div>
      </div>
    </div>
  );
};

export default RoomControls;
