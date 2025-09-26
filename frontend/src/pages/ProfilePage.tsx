import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { User, Mail, Calendar, Save, Edit3 } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface ProfileForm {
  username: string;
  email: string;
  avatar: string;
}

const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileForm>({
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
      avatar: user?.avatar || '',
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    try {
      await updateProfile(data);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    reset({
      username: user?.username || '',
      email: user?.email || '',
      avatar: user?.avatar || '',
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset({
      username: user?.username || '',
      email: user?.email || '',
      avatar: user?.avatar || '',
    });
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitials = (username: string): string => {
    return username
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-secondary-600 dark:text-secondary-300">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
            Profile Settings
          </h1>
          <p className="mt-2 text-lg text-secondary-600 dark:text-secondary-400">
            Manage your account information
          </p>
        </div>

        {/* Profile Card */}
        <div className="card">
          <div className="card-content">
            {/* Avatar Section */}
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-2xl mx-auto">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(user.username)
                  )}
                </div>
                {isEditing && (
                  <button className="absolute -bottom-2 -right-2 p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mt-4">
                {user.username}
              </h2>
              <p className="text-secondary-600 dark:text-secondary-400">
                {user.email}
              </p>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    {...register('username', {
                      required: 'Username is required',
                      minLength: {
                        value: 3,
                        message: 'Username must be at least 3 characters',
                      },
                      maxLength: {
                        value: 50,
                        message: 'Username must be less than 50 characters',
                      },
                      pattern: {
                        value: /^[a-zA-Z0-9_-]+$/,
                        message: 'Username can only contain letters, numbers, underscores, and hyphens',
                      },
                    })}
                    type="text"
                    disabled={!isEditing}
                    className="input pl-10 disabled:bg-secondary-100 dark:disabled:bg-secondary-800 disabled:cursor-not-allowed"
                    placeholder="Enter username"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    type="email"
                    disabled={!isEditing}
                    className="input pl-10 disabled:bg-secondary-100 dark:disabled:bg-secondary-800 disabled:cursor-not-allowed"
                    placeholder="Enter email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Avatar URL */}
              <div>
                <label htmlFor="avatar" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Avatar URL
                </label>
                <input
                  {...register('avatar', {
                    pattern: {
                      value: /^https?:\/\/.+/,
                      message: 'Please enter a valid URL',
                    },
                  })}
                  type="url"
                  disabled={!isEditing}
                  className="input disabled:bg-secondary-100 dark:disabled:bg-secondary-800 disabled:cursor-not-allowed"
                  placeholder="Enter avatar URL (optional)"
                />
                {errors.avatar && (
                  <p className="mt-1 text-sm text-red-600">{errors.avatar.message}</p>
                )}
              </div>

              {/* Account Info */}
              <div className="border-t border-secondary-200 dark:border-secondary-700 pt-6">
                <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4">
                  Account Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-secondary-400" />
                    <div>
                      <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                        Member since
                      </p>
                      <p className="text-sm text-secondary-500 dark:text-secondary-400">
                        {formatDate(user.createdAt || new Date())}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-secondary-400" />
                    <div>
                      <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                        Status
                      </p>
                      <p className="text-sm text-secondary-500 dark:text-secondary-400">
                        {user.isOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="btn btn-ghost"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn btn-primary flex items-center"
                    >
                      {isLoading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="btn btn-primary flex items-center"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
