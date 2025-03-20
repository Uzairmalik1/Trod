'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Play, Loader2, AlertCircle, Clock, Download } from 'lucide-react';
import HomeHeader from '@/components/HomeHeader';

interface Clip {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string | null;
  startTime: number;
  endTime: number;
  createdAt: string;
  resizedUrl: string | null;
}

interface Video {
  id: string;
  title: string;
  status: string;
  duration: number;
  fileSize: number;
  originalUrl: string;
  uploadedAt: string;
  clips: Clip[];
}

export default function VideoClipsPage({ params }: { params: { id: string } }) {
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchVideo();
  }, [params.id]);

  const fetchVideo = async () => {
    try {
      const response = await fetch(`/api/videos/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch video');
      }
      
      const data = await response.json();
      setVideo(data.video);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching video:', error);
      setError('Failed to load video');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 w-full h-screen flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="p-10 w-full h-screen flex flex-col items-center justify-center text-red-500">
        <AlertCircle size={40} />
        <p className="mt-2">{error || 'Video not found'}</p>
        <Link href="/home" className="mt-4 text-blue-500 hover:underline">
          Go back to home
        </Link>
      </div>
    );
  }

  return (
    <div>
      <HomeHeader pageName="Video Clips" />

      <main className="p-10 w-full bg-bgWhite">
        <div className="mb-6">
          <button 
            onClick={() => router.back()} 
            className="flex items-center text-blue-500 hover:underline"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to videos
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-8">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">{video.title}</h1>
            
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <Clock size={16} className="mr-1" />
              Uploaded on {new Date(video.uploadedAt).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric',
                year: 'numeric' 
              })}
              <span className="mx-2">•</span>
              Duration: {formatDuration(video.duration)}
              <span className="mx-2">•</span>
              {formatFileSize(video.fileSize)}
            </div>

            <div className="flex gap-3">
              <Link 
                href={video.originalUrl} 
                target="_blank"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 inline-flex items-center"
              >
                <Play size={16} className="mr-2" />
                Play Original
              </Link>
              
              <Link 
                href={video.originalUrl} 
                download
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 inline-flex items-center"
              >
                <Download size={16} className="mr-2" />
                Download Original
              </Link>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-4">Generated Clips ({video.clips.length})</h2>

        {video.clips.length === 0 ? (
          <div className="bg-yellow-50 p-4 rounded-md text-yellow-800">
            No clips have been generated yet. This could be because the video is still processing or because no suitable clips were found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {video.clips.map((clip) => (
              <div key={clip.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative aspect-video bg-gray-200">
                  {clip.thumbnailUrl ? (
                    <img 
                      src={clip.thumbnailUrl} 
                      alt={clip.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <Play size={40} className="text-gray-400" />
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(clip.endTime - clip.startTime)}
                  </div>
                </div>
                
                <div className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2 mb-2">{clip.title || `Clip from ${formatTimestamp(clip.startTime)} to ${formatTimestamp(clip.endTime)}`}</h3>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Link 
                      href={clip.url} 
                      target="_blank"
                      className="bg-blue-500 text-white text-center py-1 text-xs rounded hover:bg-blue-600"
                    >
                      View Original
                    </Link>
                    
                    {clip.resizedUrl ? (
                      <Link 
                        href={clip.resizedUrl} 
                        target="_blank"
                        className="bg-green-500 text-white text-center py-1 text-xs rounded hover:bg-green-600"
                      >
                        View Vertical
                      </Link>
                    ) : (
                      <button 
                        disabled
                        className="bg-gray-200 text-gray-500 text-center py-1 text-xs rounded cursor-not-allowed"
                      >
                        No Vertical
                      </button>
                    )}
                    
                    <Link 
                      href={`/edit?clip=${clip.id}`}
                      className="bg-gray-200 text-gray-800 text-center py-1 text-xs rounded hover:bg-gray-300 col-span-2"
                    >
                      Edit Clip
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Helper functions
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 