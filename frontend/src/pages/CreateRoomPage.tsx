import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import { roomApi } from '../services/api';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Lock, Users, Globe, LockIcon } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface CreateRoomForm {
  name: string;
  description: string;
  isPublic: boolean;
  password: string;
  maxParticipants: number;
}

const CreateRoomPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateRoomForm>({
    defaultValues: {
      isPublic: true,
      maxParticipants: 50,
    },
  });

  const isPublic = watch('isPublic');

  const createRoomMutation = useMutation(
    (data: CreateRoomForm) => roomApi.createRoom(data),
    {
      onSuccess: (room) => {
        toast.success('Room created successfully!');
        navigate(`/room/${room.id}`);
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to create room');
      },
    }
  );

  const onSubmit = (data: CreateRoomForm) => {
    createRoomMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-secondary-900 dark:to-secondary-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
            Create a Watch Party
          </h1>
          <p className="mt-2 text-lg text-secondary-600 dark:text-secondary-400">
            Set up your room and start watching together
          </p>
        </div>

        {/* Form */}
        <div className="card">
          <div className="card-content">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {/* Room Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Room Name *
                </label>
                <input
                  {...register('name', {
                    required: 'Room name is required',
                    minLength: {
                      value: 1,
                      message: 'Room name must be at least 1 character',
                    },
                    maxLength: {
                      value: 100,
                      message: 'Room name must be less than 100 characters',
                    },
                  })}
                  type="text"
                  className="input"
                  placeholder="Enter room name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Description
                </label>
                <textarea
                  {...register('description', {
                    maxLength: {
                      value: 500,
                      message: 'Description must be less than 500 characters',
                    },
                  })}
                  rows={3}
                  className="input resize-none"
                  placeholder="Describe what you'll be watching (optional)"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Privacy Settings */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
                  Privacy Settings
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      {...register('isPublic')}
                      type="radio"
                      value="true"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300"
                    />
                    <div className="ml-3 flex items-center">
                      <Globe className="h-5 w-5 text-green-500 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                          Public Room
                        </div>
                        <div className="text-sm text-secondary-500 dark:text-secondary-400">
                          Anyone with the link can join
                        </div>
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center">
                    <input
                      {...register('isPublic')}
                      type="radio"
                      value="false"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300"
                    />
                    <div className="ml-3 flex items-center">
                      <Lock className="h-5 w-5 text-red-500 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                          Private Room
                        </div>
                        <div className="text-sm text-secondary-500 dark:text-secondary-400">
                          Only people with the password can join
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Password (if private) */}
              {!isPublic && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Room Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LockIcon className="h-5 w-5 text-secondary-400" />
                    </div>
                    <input
                      {...register('password', {
                        required: !isPublic ? 'Password is required for private rooms' : false,
                        minLength: {
                          value: 4,
                          message: 'Password must be at least 4 characters',
                        },
                        maxLength: {
                          value: 50,
                          message: 'Password must be less than 50 characters',
                        },
                      })}
                      type={showPassword ? 'text' : 'password'}
                      className="input pl-10 pr-10"
                      placeholder="Enter room password"
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
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
              )}

              {/* Max Participants */}
              <div>
                <label htmlFor="maxParticipants" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Maximum Participants
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    {...register('maxParticipants', {
                      required: 'Max participants is required',
                      min: {
                        value: 2,
                        message: 'Minimum 2 participants required',
                      },
                      max: {
                        value: 100,
                        message: 'Maximum 100 participants allowed',
                      },
                    })}
                    type="number"
                    min="2"
                    max="100"
                    className="input pl-10"
                    placeholder="50"
                  />
                </div>
                {errors.maxParticipants && (
                  <p className="mt-1 text-sm text-red-600">{errors.maxParticipants.message}</p>
                )}
                <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
                  Choose how many people can join your room (2-100)
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={createRoomMutation.isLoading}
                  className="btn btn-primary btn-lg w-full flex items-center justify-center"
                >
                  {createRoomMutation.isLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creating room...
                    </>
                  ) : (
                    'Create Room'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 card">
          <div className="card-content">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
              Tips for a great watch party
            </h3>
            <ul className="space-y-2 text-sm text-secondary-600 dark:text-secondary-400">
              <li className="flex items-start">
                <span className="text-primary-500 mr-2">•</span>
                Choose a descriptive room name so friends know what you're watching
              </li>
              <li className="flex items-start">
                <span className="text-primary-500 mr-2">•</span>
                Set a password for private rooms to keep unwanted guests out
              </li>
              <li className="flex items-start">
                <span className="text-primary-500 mr-2">•</span>
                Start with a few videos in your playlist to keep the party going
              </li>
              <li className="flex items-start">
                <span className="text-primary-500 mr-2">•</span>
                Share the room link with friends to invite them
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomPage;
