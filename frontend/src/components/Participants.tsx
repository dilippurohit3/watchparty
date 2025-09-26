import React from 'react';
import { Users, Crown, Mic, MicOff } from 'lucide-react';

interface Participant {
  id: string;
  username: string;
  avatar?: string;
  isHost: boolean;
  isOnline: boolean;
  joinedAt: Date;
  lastActivity: Date;
}

interface ParticipantsProps {
  participants: Participant[];
}

const Participants: React.FC<ParticipantsProps> = ({ participants }) => {
  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
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

  const getStatusColor = (isOnline: boolean): string => {
    return isOnline ? 'bg-green-500' : 'bg-gray-400';
  };

  const getStatusText = (isOnline: boolean): string => {
    return isOnline ? 'Online' : 'Offline';
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-secondary-500" />
          <h3 className="card-title">Participants</h3>
          <span className="text-sm text-secondary-500 dark:text-secondary-400">
            ({participants.length})
          </span>
        </div>
      </div>

      <div className="card-content">
        {participants.length === 0 ? (
          <div className="text-center py-4 text-secondary-500 dark:text-secondary-400">
            <p>No participants yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium text-sm">
                    {participant.avatar ? (
                      <img
                        src={participant.avatar}
                        alt={participant.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(participant.username)
                    )}
                  </div>
                  
                  {/* Online Status */}
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-secondary-800 ${getStatusColor(participant.isOnline)}`} />
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
                      {participant.username}
                    </h4>
                    {participant.isHost && (
                      <Crown className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-secondary-500 dark:text-secondary-400">
                    <span className={getStatusColor(participant.isOnline)} />
                    <span>{getStatusText(participant.isOnline)}</span>
                    <span>•</span>
                    <span>Joined {formatTime(participant.joinedAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1">
                  <button className="p-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 transition-colors">
                    <Mic className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 transition-colors">
                    <MicOff className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Participants;
