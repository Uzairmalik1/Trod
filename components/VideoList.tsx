import { useEffect, useState } from 'react';
import { Play, Clock, Loader2, AlertCircle, UploadCloud, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Video {
  id: string;
  title: string;
  description: string | null;
  originalUrl: string;
  thumbnailUrl?: string;
  status: string;
  duration: number;
  uploadedAt: string;
  processedAt: string | null;
  fileSize: number;
  clipCount?: number;
}

export default function VideoList({ onImportVideo }: { onImportVideo: () => void }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingVideos, setProcessingVideos] = useState<string[]>([]);

  useEffect(() => {
    fetchVideos();
    
    // Poll for processing videos every 5 seconds
    const intervalId = setInterval(() => {
      fetchVideos();
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/videos');
      
      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }
      
      const data = await response.json();
      setVideos(data.videos || []);
      
      // Track which videos are still processing
      const stillProcessing = (data.videos || [])
        .filter((video: Video) => video.status === 'processing')
        .map((video: Video) => video.id);
      
      setProcessingVideos(stillProcessing);
      setLoading(false);
      setError('');
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Failed to fetch videos');
      setLoading(false);
    }
  };

  const handleProcessVideo = async (videoId: string) => {
    try {
      await fetch(`/api/videos/${videoId}/process`, {
        method: 'POST',
      });
      
      // Update the video status locally
      setVideos(videos.map(video => 
        video.id === videoId ? { ...video, status: 'processing' } : video
      ));
      
      // Add to processing videos
      setProcessingVideos([...processingVideos, videoId]);
    } catch (error) {
      console.error('Error processing video:', error);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-72 flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-72 flex flex-col items-center justify-center text-red-500">
        <AlertCircle size={40} />
        <p className="mt-2">{error}</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <button 
        onClick={onImportVideo} 
        className="w-full h-72 mt-6 p-6 flex flex-col gap-3 items-center justify-center border-2 border-dashed border-gray-300 bg-slate50 hover:bg-slateHover50 rounded-xl text-gray-400 cursor-pointer"
      >
        <UploadCloud size={24} className="font-semibold" /> 
        No videos found, click here to import a video
      </button>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {videos.map((video) => (
        <div key={video.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-64 h-40 bg-gray-100 relative">
              {video.thumbnailUrl ? (
                <img 
                  src={video.thumbnailUrl} 
                  alt={video.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play size={40} className="text-gray-400" />
                </div>
              )}
              
              {/* Status indicator */}
              <div className="absolute top-2 right-2">
                {video.status === 'uploaded' && (
                  <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                    <CheckCircle size={12} className="mr-1" />
                    Uploaded
                  </div>
                )}
                {video.status === 'processing' && (
                  <div className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                    <RefreshCw size={12} className="mr-1 animate-spin" />
                    Processing
                  </div>
                )}
                {video.status === 'completed' && (
                  <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                    <CheckCircle size={12} className="mr-1" />
                    Processed
                  </div>
                )}
                {video.status === 'failed' && (
                  <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                    <XCircle size={12} className="mr-1" />
                    Failed
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 flex-1">
              <h3 className="font-medium text-lg mb-1">{video.title}</h3>
              
              {video.description && (
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{video.description}</p>
              )}
              
              <div className="flex items-center text-xs text-gray-500 mb-3">
                <Clock size={14} className="mr-1" />
                {new Date(video.uploadedAt).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric' 
                })}
                <span className="mx-2">•</span>
                {formatFileSize(video.fileSize)}
                {video.duration > 0 && (
                  <>
                    <span className="mx-2">•</span>
                    {formatDuration(video.duration)}
                  </>
                )}
                {video.clipCount !== undefined && video.clipCount > 0 && (
                  <>
                    <span className="mx-2">•</span>
                    {video.clipCount} clips
                  </>
                )}
              </div>
              
              <div className="flex gap-2">
                {video.status === 'uploaded' && (
                  <button 
                    onClick={() => handleProcessVideo(video.id)}
                    className="bg-blue-500 text-white px-3 py-1 text-sm rounded hover:bg-blue-600"
                  >
                    Process Video
                  </button>
                )}
                
                {video.status === 'processing' && (
                  <button 
                    disabled
                    className="bg-gray-300 text-gray-700 px-3 py-1 text-sm rounded flex items-center"
                  >
                    <Loader2 size={14} className="mr-1 animate-spin" />
                    Processing...
                  </button>
                )}
                
                {video.status === 'completed' && (
                  <Link 
                    href={`/videos/${video.id}/clips`}
                    className="bg-green-500 text-white px-3 py-1 text-sm rounded hover:bg-green-600"
                  >
                    View Clips
                  </Link>
                )}
                
                {video.status === 'failed' && (
                  <button 
                    onClick={() => handleProcessVideo(video.id)}
                    className="bg-red-100 text-red-700 px-3 py-1 text-sm rounded hover:bg-red-200"
                  >
                    Retry Processing
                  </button>
                )}
                
                <Link 
                  href={video.originalUrl} 
                  target="_blank"
                  className="bg-gray-200 text-gray-800 px-3 py-1 text-sm rounded hover:bg-gray-300"
                >
                  View Original
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper functions
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 