import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from 'react-query';
import { roomApi } from '../services/api';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Lock, Users, Calendar, User } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface JoinRoomForm {
  roomCode: string;
  password: string;
}

const JoinRoomPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinRoomForm>();

  // Get public rooms
  const { data: publicRooms, isLoading: isLoadingRooms } = useQuery(
    ['public-rooms'],
    () => roomApi.getRooms({ page: 1, limit: 20 }),
    {
      onError: (error: any) => {
        toast.error(error.message || 'Failed to load public rooms');
      },
    }
  );

  const onSubmit = async (data: JoinRoomForm) => {
    setIsJoining(true);
    try {
      // First, try to find room by code
      const rooms = publicRooms?.data?.rooms || [];
      const room = rooms.find((r: any) => r.roomCode === data.roomCode.toUpperCase());
      
      if (!room) {
        toast.error('Room not found. Please check the room code.');
        return;
      }

      // Join the room
      await roomApi.joinRoom(room.id, data.password);
      toast.success('Joined room successfully!');
      navigate(`/room/${room.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to join room');
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinRoom = async (roomId: string, password?: string) => {
    try {
      await roomApi.joinRoom(roomId, password);
      toast.success('Joined room successfully!');
      navigate(`/room/${roomId}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to join room');
    }
  };

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-secondary-900 dark:to-secondary-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
            Join a Watch Party
          </h1>
          <p className="mt-2 text-lg text-secondary-600 dark:text-secondary-400">
            Enter a room code or browse public rooms
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Join by Code */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Join with Room Code</h2>
              <p className="card-description">
                Enter the room code shared by your friend
              </p>
            </div>
            <div className="card-content">
              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                {/* Room Code */}
                <div>
                  <label htmlFor="roomCode" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Room Code *
                  </label>
                  <input
                    {...register('roomCode', {
                      required: 'Room code is required',
                      minLength: {
                        value: 6,
                        message: 'Room code must be 6 characters',
                      },
                      maxLength: {
                        value: 6,
                        message: 'Room code must be 6 characters',
                      },
                    })}
                    type="text"
                    className="input text-center text-lg font-mono tracking-widest"
                    placeholder="ABC123"
                    style={{ textTransform: 'uppercase' }}
                    onChange={(e) => {
                      e.target.value = e.target.value.toUpperCase();
                    }}
                  />
                  {errors.roomCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.roomCode.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Room Password (if required)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-secondary-400" />
                    </div>
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      className="input pl-10 pr-10"
                      placeholder="Enter password if required"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-secondary-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-secondary-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isJoining}
                  className="btn btn-primary btn-lg w-full flex items-center justify-center"
                >
                  {isJoining ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Joining...
                    </>
                  ) : (
                    'Join Room'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Public Rooms */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Public Rooms</h2>
              <p className="card-description">
                Browse and join public watch parties
              </p>
            </div>
            <div className="card-content">
              {isLoadingRooms ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" />
                  <p className="mt-4 text-secondary-500 dark:text-secondary-400">
                    Loading public rooms...
                  </p>
                </div>
              ) : publicRooms?.data?.rooms?.length === 0 ? (
                <div className="text-center py-8 text-secondary-500 dark:text-secondary-400">
                  <p>No public rooms available</p>
                  <p className="text-sm">Be the first to create one!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {publicRooms?.data?.rooms?.map((room: any) => (
                    <div
                      key={room.id}
                      className="flex items-center justify-between p-3 border border-secondary-200 dark:border-secondary-700 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
                          {room.name}
                        </h3>
                        <div className="flex items-center space-x-4 text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                          <div className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {room.participantCount} participants
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatTime(room.createdAt)}
                          </div>
                        </div>
                        {room.description && (
                          <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1 truncate">
                            {room.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono text-secondary-500 dark:text-secondary-400">
                          {room.roomCode}
                        </span>
                        <button
                          onClick={() => handleJoinRoom(room.id)}
                          className="btn btn-primary btn-sm"
                        >
                          Join
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 text-center">
          <p className="text-secondary-600 dark:text-secondary-400 mb-4">
            Don't see what you're looking for?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/create')}
              className="btn btn-outline"
            >
              Create New Room
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-ghost"
            >
              Refresh Rooms
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinRoomPage;
