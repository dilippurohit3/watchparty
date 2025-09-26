import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useQuery } from 'react-query';
import { roomApi } from '../services/api';
import { toast } from 'react-hot-toast';

import VideoPlayer from '../components/VideoPlayer';
import Chat from '../components/Chat';
import Playlist from '../components/Playlist';
import Participants from '../components/Participants';
import RoomControls from '../components/RoomControls';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface RoomState {
  room: any;
  participants: any[];
  currentVideo: any;
  isPlaying: boolean;
  currentTime: number;
  playbackRate: number;
}

const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, isConnected, emit, on, off } = useSocket();
  
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get room data
  const { data: roomData, refetch: refetchRoom } = useQuery(
    ['room', roomId],
    () => roomApi.getRoom(roomId!),
    {
      enabled: !!roomId,
      onError: (error: any) => {
        setError(error.message || 'Failed to load room');
        setIsLoading(false);
      },
    }
  );

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    if (!roomId) {
      navigate('/');
      return;
    }

    // Join room when socket is connected
    if (isConnected && socket) {
      joinRoom();
    }

    // Socket event listeners
    const handleRoomJoined = (data: any) => {
      setRoomState(data.roomState);
      setIsLoading(false);
      toast.success('Joined room successfully');
    };

    const handleRoomError = (data: any) => {
      setError(data.message);
      setIsLoading(false);
      toast.error(data.message);
    };

    const handleUserJoined = (data: any) => {
      toast.success(`${data.username} joined the room`);
      // Refresh participants
      refetchRoom();
    };

    const handleUserLeft = (data: any) => {
      toast.info(`${data.username} left the room`);
      // Refresh participants
      refetchRoom();
    };

    const handleVideoPlay = (data: any) => {
      setRoomState(prev => prev ? {
        ...prev,
        isPlaying: true,
        currentTime: data.timestamp
      } : null);
    };

    const handleVideoPause = (data: any) => {
      setRoomState(prev => prev ? {
        ...prev,
        isPlaying: false,
        currentTime: data.timestamp
      } : null);
    };

    const handleVideoSeek = (data: any) => {
      setRoomState(prev => prev ? {
        ...prev,
        currentTime: data.timestamp
      } : null);
    };

    const handleVideoChange = (data: any) => {
      setRoomState(prev => prev ? {
        ...prev,
        currentVideo: data.videoId
      } : null);
    };

    // Register socket event listeners
    on('room_joined', handleRoomJoined);
    on('room_error', handleRoomError);
    on('user_joined', handleUserJoined);
    on('user_left', handleUserLeft);
    on('video_play', handleVideoPlay);
    on('video_pause', handleVideoPause);
    on('video_seek', handleVideoSeek);
    on('video_change', handleVideoChange);

    return () => {
      // Cleanup event listeners
      off('room_joined', handleRoomJoined);
      off('room_error', handleRoomError);
      off('user_joined', handleUserJoined);
      off('user_left', handleUserLeft);
      off('video_play', handleVideoPlay);
      off('video_pause', handleVideoPause);
      off('video_seek', handleVideoSeek);
      off('video_change', handleVideoChange);

      // Leave room on unmount
      if (socket && roomId) {
        emit('leave_room', { roomId });
      }
    };
  }, [user, roomId, isConnected, socket, navigate, emit, on, off, refetchRoom]);

  const joinRoom = async () => {
    try {
      if (!socket || !roomId) return;

      // Join room via socket
      emit('join_room', { roomId });
    } catch (error) {
      console.error('Failed to join room:', error);
      setError('Failed to join room');
      setIsLoading(false);
    }
  };

  const handleVideoPlay = (timestamp: number) => {
    if (socket && roomId) {
      emit('video_play', { roomId, timestamp });
    }
  };

  const handleVideoPause = (timestamp: number) => {
    if (socket && roomId) {
      emit('video_pause', { roomId, timestamp });
    }
  };

  const handleVideoSeek = (timestamp: number) => {
    if (socket && roomId) {
      emit('video_seek', { roomId, timestamp });
    }
  };

  const handleVideoChange = (videoId: string) => {
    if (socket && roomId) {
      emit('video_change', { roomId, videoId });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-secondary-600 dark:text-secondary-300">
            Joining room...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-secondary-600 dark:text-secondary-300 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!roomState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">
            Room not found
          </h1>
          <p className="text-secondary-600 dark:text-secondary-300 mb-4">
            This room doesn't exist or you don't have access to it.
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
      {/* Header */}
      <div className="bg-white dark:bg-secondary-800 shadow-sm border-b border-secondary-200 dark:border-secondary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                {roomState.room.name}
              </h1>
              <p className="text-secondary-600 dark:text-secondary-300">
                {roomState.room.description}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-secondary-500 dark:text-secondary-400">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <button
                onClick={() => navigate('/')}
                className="btn btn-ghost"
              >
                Leave Room
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-3">
            <div className="card">
              <div className="card-content p-0">
                <VideoPlayer
                  video={roomState.currentVideo}
                  isPlaying={roomState.isPlaying}
                  currentTime={roomState.currentTime}
                  playbackRate={roomState.playbackRate}
                  onPlay={handleVideoPlay}
                  onPause={handleVideoPause}
                  onSeek={handleVideoSeek}
                  onChange={handleVideoChange}
                />
              </div>
            </div>

            {/* Room Controls */}
            <div className="mt-4">
              <RoomControls
                room={roomState.room}
                currentVideo={roomState.currentVideo}
                onVideoChange={handleVideoChange}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Participants */}
            <Participants participants={roomState.participants} />

            {/* Chat */}
            <Chat roomId={roomId!} />

            {/* Playlist */}
            <Playlist roomId={roomId!} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
