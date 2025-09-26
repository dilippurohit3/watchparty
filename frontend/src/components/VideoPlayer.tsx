import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Settings, Maximize } from 'lucide-react';

interface VideoPlayerProps {
  video: any;
  isPlaying: boolean;
  currentTime: number;
  playbackRate: number;
  onPlay: (timestamp: number) => void;
  onPause: (timestamp: number) => void;
  onSeek: (timestamp: number) => void;
  onChange: (videoId: string) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  isPlaying,
  currentTime,
  playbackRate,
  onPlay,
  onPause,
  onSeek,
  onChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLocalPlaying, setIsLocalPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);

  // Sync with external state
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying && videoRef.current.paused) {
        videoRef.current.play();
        setIsLocalPlaying(true);
      } else if (!isPlaying && !videoRef.current.paused) {
        videoRef.current.pause();
        setIsLocalPlaying(false);
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 1) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const handlePlay = () => {
    if (videoRef.current) {
      onPlay(videoRef.current.currentTime);
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      onPause(videoRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const newTime = parseFloat(e.target.value);
      videoRef.current.currentTime = newTime;
      onSeek(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleProgress = () => {
    if (videoRef.current) {
      const bufferedEnd = videoRef.current.buffered.length > 0 
        ? videoRef.current.buffered.end(videoRef.current.buffered.length - 1)
        : 0;
      setBuffered(bufferedEnd);
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!video) {
    return (
      <div className="video-player bg-black rounded-lg flex items-center justify-center h-96">
        <div className="text-center text-white">
          <h3 className="text-xl font-semibold mb-2">No Video Selected</h3>
          <p className="text-gray-300">Add a video to the playlist to start watching</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="video-player bg-black rounded-lg relative overflow-hidden"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={video.url}
        poster={video.thumbnail}
        className="w-full h-full object-cover"
        onLoadedMetadata={handleLoadedMetadata}
        onProgress={handleProgress}
        onPlay={() => setIsLocalPlaying(true)}
        onPause={() => setIsLocalPlaying(false)}
        onSeeked={() => {
          if (videoRef.current) {
            onSeek(videoRef.current.currentTime);
          }
        }}
      />

      {/* Video Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300" />

      {/* Controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="relative h-1 bg-gray-600 rounded-full">
            {/* Buffered Progress */}
            <div 
              className="absolute top-0 left-0 h-full bg-gray-400 rounded-full"
              style={{ width: `${duration > 0 ? (buffered / duration) * 100 : 0}%` }}
            />
            {/* Played Progress */}
            <div 
              className="absolute top-0 left-0 h-full bg-primary-500 rounded-full"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Play/Pause */}
            <button
              onClick={isLocalPlaying ? handlePause : handlePlay}
              className="text-white hover:text-primary-400 transition-colors"
            >
              {isLocalPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>

            {/* Time Display */}
            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Volume */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="text-white hover:text-primary-400 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
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
                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Playback Rate */}
            <select
              value={playbackRate}
              onChange={(e) => {
                const newRate = parseFloat(e.target.value);
                if (videoRef.current) {
                  videoRef.current.playbackRate = newRate;
                }
              }}
              className="bg-transparent text-white text-sm border border-gray-600 rounded px-2 py-1"
            >
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>

            {/* Settings */}
            <button className="text-white hover:text-primary-400 transition-colors">
              <Settings className="w-5 h-5" />
            </button>

            {/* Fullscreen */}
            <button className="text-white hover:text-primary-400 transition-colors">
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Video Info Overlay */}
      <div className="absolute top-4 left-4">
        <h3 className="text-white text-lg font-semibold mb-1">{video.title}</h3>
        <p className="text-gray-300 text-sm">
          {video.type === 'youtube' ? 'YouTube' : video.type === 'file' ? 'Uploaded File' : 'URL'}
        </p>
      </div>
    </div>
  );
};

export default VideoPlayer;
