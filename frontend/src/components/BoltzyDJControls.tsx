import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  Hand, 
  Users, 
  Check, 
  X, 
  MoreVertical, 
  Settings,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Queue,
  MessageCircle,
  Heart,
  Share2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { djApi } from '../services/api';
import { toast } from 'react-hot-toast';

interface ControlRequest {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  isOnline: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

interface BoltzyDJControlsProps {
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

const BoltzyDJControls: React.FC<BoltzyDJControlsProps> = ({
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
  const queryClient = useQueryClient();
  const [showRequests, setShowRequests] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  // Get control requests (host only)
  const { data: controlRequests, refetch: refetchRequests } = useQuery(
    ['control-requests', roomId],
    () => djApi.getControlRequests(roomId),
    {
      enabled: isHost,
      refetchInterval: 5000, // Refetch every 5 seconds
    }
  );

  // Approve control request
  const approveRequestMutation = useMutation(
    (requestId: string) => djApi.approveControlRequest(roomId, requestId),
    {
      onSuccess: () => {
        toast.success('Control request approved');
        refetchRequests();
        queryClient.invalidateQueries(['room', roomId]);
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to approve request');
      },
    }
  );

  // Reject control request
  const rejectRequestMutation = useMutation(
    (requestId: string) => djApi.rejectControlRequest(roomId, requestId),
    {
      onSuccess: () => {
        toast.success('Control request rejected');
        refetchRequests();
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to reject request');
      },
    }
  );

  // Remove co-host
  const removeCoHostMutation = useMutation(
    (userId: string) => djApi.removeCoHost(roomId, userId),
    {
      onSuccess: () => {
        toast.success('Co-host privileges removed');
        queryClient.invalidateQueries(['room', roomId]);
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to remove co-host');
      },
    }
  );

  // Transfer host
  const transferHostMutation = useMutation(
    (newHostId: string) => djApi.transferHost(roomId, newHostId),
    {
      onSuccess: () => {
        toast.success('Host privileges transferred');
        queryClient.invalidateQueries(['room', roomId]);
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to transfer host');
      },
    }
  );

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

  const handleApproveRequest = (requestId: string) => {
    approveRequestMutation.mutate(requestId);
  };

  const handleRejectRequest = (requestId: string) => {
    rejectRequestMutation.mutate(requestId);
  };

  const handleRemoveCoHost = (userId: string) => {
    removeCoHostMutation.mutate(userId);
  };

  const handleTransferHost = (userId: string) => {
    if (window.confirm('Are you sure you want to transfer host privileges? This action cannot be undone.')) {
      transferHostMutation.mutate(userId);
    }
  };

  const handleReaction = (type: string) => {
    onReaction(type);
    setShowReactions(false);
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Host/Co-Host Status */}
      {(isHost || isCoHost) && (
        <div className="boltzy-glass rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isHost 
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500'
              }`}>
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">
                  {isHost ? 'Host' : 'Co-Host'}
                </h3>
                <p className="text-white/70 text-sm">
                  You control the room and video playback
                </p>
              </div>
            </div>
            
            {isHost && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowRequests(!showRequests)}
                  className="boltzy-btn boltzy-btn-secondary p-3 rounded-2xl relative"
                >
                  <Hand className="w-5 h-5" />
                  {controlRequests?.data?.requests?.length > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {controlRequests.data.requests.length}
                      </span>
                    </div>
                  )}
                </button>
                
                <button
                  onClick={onSettings}
                  className="boltzy-btn boltzy-btn-ghost p-3 rounded-2xl"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Control Requests (Host Only) */}
      {isHost && showRequests && controlRequests?.data?.requests?.length > 0 && (
        <div className="boltzy-glass rounded-2xl p-4">
          <h3 className="text-white font-semibold text-lg mb-4">Control Requests</h3>
          <div className="space-y-3">
            {controlRequests.data.requests.map((request: ControlRequest) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {request.username.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{request.username}</p>
                    <p className="text-white/70 text-sm">
                      {new Date(request.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleApproveRequest(request.id)}
                    disabled={approveRequestMutation.isLoading}
                    className="boltzy-btn boltzy-btn-primary p-2 rounded-xl"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleRejectRequest(request.id)}
                    disabled={rejectRequestMutation.isLoading}
                    className="boltzy-btn boltzy-btn-ghost p-2 rounded-xl"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Control Button (Non-Hosts) */}
      {!isHost && !isCoHost && canRequestControl && (
        <div className="boltzy-glass rounded-2xl p-4">
          <button
            onClick={onRequestControl}
            className="boltzy-btn boltzy-btn-primary w-full p-4 rounded-2xl"
          >
            <Hand className="w-5 h-5 mr-2" />
            Request Control
          </button>
        </div>
      )}

      {/* Video Controls */}
      {(isHost || isCoHost) && (
        <div className="boltzy-glass rounded-2xl p-4">
          <h3 className="text-white font-semibold text-lg mb-4">Video Controls</h3>
          
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

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={onPreviousVideo}
                className="boltzy-btn boltzy-btn-ghost p-3 rounded-2xl"
              >
                <SkipBack className="w-5 h-5" />
              </button>

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

              <button
                onClick={onSkipVideo}
                className="boltzy-btn boltzy-btn-ghost p-3 rounded-2xl"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={onToggleShuffle}
                className={`boltzy-btn p-3 rounded-2xl ${
                  isShuffled ? 'boltzy-btn-primary' : 'boltzy-btn-ghost'
                }`}
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                onClick={onToggleRepeat}
                className={`boltzy-btn p-3 rounded-2xl ${
                  repeatMode !== 'none' ? 'boltzy-btn-primary' : 'boltzy-btn-ghost'
                }`}
              >
                <Repeat className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Volume Control */}
          <div className="mt-4 flex items-center space-x-3">
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
              className="flex-1 h-2 bg-white/20 rounded-full appearance-none cursor-pointer slider"
            />
          </div>
        </div>
      )}

      {/* Co-Host Management (Host Only) */}
      {isHost && (
        <div className="boltzy-glass rounded-2xl p-4">
          <h3 className="text-white font-semibold text-lg mb-4">Co-Hosts</h3>
          <div className="space-y-2">
            {participants
              .filter(p => p.isCoHost)
              .map((coHost) => (
                <div key={coHost.userId} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white font-medium">{coHost.username}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleTransferHost(coHost.userId)}
                      className="boltzy-btn boltzy-btn-ghost p-2 rounded-xl text-xs"
                    >
                      Transfer Host
                    </button>
                    <button
                      onClick={() => handleRemoveCoHost(coHost.userId)}
                      className="boltzy-btn boltzy-btn-ghost p-2 rounded-xl text-xs"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BoltzyDJControls;
