import React, { useState } from 'react';
import { Play, Pause, Trash2, GripVertical, Plus, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { playlistApi, videoApi } from '../services/api';
import { toast } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: number;
  type: string;
  addedBy: string;
  addedAt: Date;
  position: number;
}

interface PlaylistProps {
  roomId: string;
}

const Playlist: React.FC<PlaylistProps> = ({ roomId }) => {
  const { user } = useAuth();
  const { socket, emit, on, off } = useSocket();
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const queryClient = useQueryClient();

  // Get playlist data
  const { data: playlistData, isLoading } = useQuery(
    ['playlist', roomId],
    () => playlistApi.getPlaylist(roomId),
    {
      enabled: !!roomId,
    }
  );

  const playlist = playlistData?.data || { videos: [], currentIndex: 0 };
  const videos: Video[] = playlist.videos || [];

  // Socket event listeners
  React.useEffect(() => {
    const handlePlaylistAdd = (data: any) => {
      queryClient.invalidateQueries(['playlist', roomId]);
      toast.success(`${data.username} added a video to the playlist`);
    };

    const handlePlaylistRemove = (data: any) => {
      queryClient.invalidateQueries(['playlist', roomId]);
      toast.success(`${data.username} removed a video from the playlist`);
    };

    const handlePlaylistReorder = (data: any) => {
      queryClient.invalidateQueries(['playlist', roomId]);
      toast.success(`${data.username} reordered the playlist`);
    };

    on('playlist_add', handlePlaylistAdd);
    on('playlist_remove', handlePlaylistRemove);
    on('playlist_reorder', handlePlaylistReorder);

    return () => {
      off('playlist_add', handlePlaylistAdd);
      off('playlist_remove', handlePlaylistRemove);
      off('playlist_reorder', handlePlaylistReorder);
    };
  }, [roomId, on, off, queryClient]);

  // Mutations
  const removeVideoMutation = useMutation(
    (videoId: string) => playlistApi.removeVideo(roomId, videoId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['playlist', roomId]);
        toast.success('Video removed from playlist');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to remove video');
      },
    }
  );

  const reorderVideosMutation = useMutation(
    (videoIds: string[]) => playlistApi.reorderVideos(roomId, videoIds),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['playlist', roomId]);
        toast.success('Playlist reordered');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to reorder playlist');
      },
    }
  );

  const clearPlaylistMutation = useMutation(
    () => playlistApi.clearPlaylist(roomId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['playlist', roomId]);
        toast.success('Playlist cleared');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to clear playlist');
      },
    }
  );

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await videoApi.searchYouTube(query);
      setSearchResults(results);
    } catch (error: any) {
      toast.error(error.message || 'Failed to search videos');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddVideo = async (video: Video) => {
    try {
      await playlistApi.addVideo(roomId, video);
      setShowAddVideo(false);
      setSearchQuery('');
      setSearchResults([]);
      toast.success('Video added to playlist');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add video');
    }
  };

  const handleRemoveVideo = (videoId: string) => {
    removeVideoMutation.mutate(videoId);
  };

  const handlePlayVideo = (videoId: string) => {
    if (socket) {
      emit('video_change', { roomId, videoId });
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(videos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const videoIds = items.map(video => video.id);
    reorderVideosMutation.mutate(videoIds);
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-3/4"></div>
            <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-1/2"></div>
            <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h3 className="card-title">Playlist</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddVideo(!showAddVideo)}
              className="btn btn-ghost btn-sm"
            >
              <Plus className="w-4 h-4" />
            </button>
            {videos.length > 0 && (
              <button
                onClick={() => clearPlaylistMutation.mutate()}
                className="btn btn-ghost btn-sm text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card-content">
        {/* Add Video Section */}
        {showAddVideo && (
          <div className="mb-4 p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Search className="w-4 h-4 text-secondary-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                placeholder="Search YouTube videos..."
                className="flex-1 px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {isSearching && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
                <p className="text-sm text-secondary-500 mt-2">Searching...</p>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {searchResults.map((video) => (
                  <div
                    key={video.id}
                    className="flex items-center space-x-3 p-2 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded cursor-pointer"
                    onClick={() => handleAddVideo(video)}
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-12 h-8 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
                        {video.title}
                      </p>
                      <p className="text-xs text-secondary-500">
                        {formatDuration(video.duration || 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Playlist Videos */}
        {videos.length === 0 ? (
          <div className="text-center py-8 text-secondary-500 dark:text-secondary-400">
            <p>No videos in playlist</p>
            <p className="text-sm">Add videos to get started</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="playlist">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2 max-h-96 overflow-y-auto"
                >
                  {videos.map((video, index) => (
                    <Draggable key={video.id} draggableId={video.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center space-x-3 p-3 rounded-lg border ${
                            snapshot.isDragging
                              ? 'bg-primary-50 dark:bg-primary-900 border-primary-300 dark:border-primary-700'
                              : 'bg-secondary-50 dark:bg-secondary-800 border-secondary-200 dark:border-secondary-700'
                          }`}
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="text-secondary-400 hover:text-secondary-600 cursor-grab"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>

                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-16 h-10 object-cover rounded"
                          />

                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
                              {video.title}
                            </h4>
                            <div className="flex items-center space-x-2 text-xs text-secondary-500">
                              <span>{formatDuration(video.duration || 0)}</span>
                              <span>•</span>
                              <span>{video.type}</span>
                              <span>•</span>
                              <span>{formatTime(video.addedAt)}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handlePlayVideo(video.id)}
                              className="p-1 text-secondary-500 hover:text-primary-500 transition-colors"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveVideo(video.id)}
                              className="p-1 text-secondary-500 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
};

export default Playlist;
