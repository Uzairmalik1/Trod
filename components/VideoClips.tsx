import { useEffect, useState, useRef } from 'react';
import { Play, Clock, CheckCircle2, AlertCircle, Loader2, Smartphone } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatVideoUrl } from '@/lib/pathUtils';

interface Clip {
  id: string;
  title: string;
  url: string;
  resizedUrl: string | null; // URL to the vertical (9:16) version
  thumbnailUrl: string | null;
  startTime: number;
  endTime: number;
  createdAt: string;
  filePath?: string;
  resizedPath?: string;
  subtitlesUrl?: string;
  formattedUrl?: string;
}

interface Video {
  id: string;
  title: string;
  status: string;
  clips: Clip[];
}

export default function VideoClips() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clips, setClips] = useState<Clip[]>([]);
  const [verticalClips, setVerticalClips] = useState<Clip[]>([]);
  const videoRefs = useRef<{[key: string]: HTMLVideoElement}>({});
  const [videoErrors, setVideoErrors] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    fetchVideos();
    
    // Set up interval to refresh clips every 5 seconds instead of 30
    const intervalId = setInterval(fetchVideos, 5000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Add a function to check processing status
  const checkProcessingStatus = async (videoId: string) => {
    try {
      const response = await fetch(`/api/videos/${videoId}`);
      const data = await response.json();
      
      if (data.video.status === 'completed') {
        // If processing is complete, fetch all videos
        fetchVideos();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking processing status:', error);
      return false;
    }
  };

  // Add polling for processing status
  const pollProcessingStatus = async (videoId: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        console.log('Max polling attempts reached');
        return;
      }
      
      const isComplete = await checkProcessingStatus(videoId);
      if (!isComplete) {
        attempts++;
        setTimeout(poll, 5000);
      }
    };
    
    poll();
  };

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/videos');
      
      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }
      
      const data = await response.json();
      console.log('Fetched videos data:', data);
      
      // Check for any processing videos and start polling their status
      data.videos.forEach((video: Video) => {
        if (video.status === 'processing') {
          pollProcessingStatus(video.id);
        }
      });
      
      setVideos(data.videos || []);
      
      // Extract all clips from videos
      const allClips = data.videos.reduce((acc: Clip[], video: Video) => {
        console.log(`Processing video ${video.id}:`, {
          title: video.title,
          status: video.status,
          clipCount: video.clips?.length || 0
        });
        
        // Include only clips from completed videos
        if (video.status === 'completed' && video.clips && video.clips.length > 0) {
          // Add the video title to each clip for better identification
          const clipsWithTitle = video.clips.map(clip => {
            // Try resized path first, then fall back to original path
            let videoUrl = '';
            if (clip.resizedUrl || clip.resizedPath) {
              videoUrl = formatVideoUrl(clip.resizedUrl, clip.resizedPath);
              console.log(`Using resized path for clip ${clip.id}:`, {
                resizedUrl: clip.resizedUrl,
                resizedPath: clip.resizedPath,
                formattedUrl: videoUrl
              });
            } else if (clip.url || clip.filePath) {
              videoUrl = formatVideoUrl(clip.url, clip.filePath);
              console.log(`Using original path for clip ${clip.id}:`, {
                url: clip.url,
                filePath: clip.filePath,
                formattedUrl: videoUrl
              });
            }
            
            // Verify the file exists
            if (videoUrl) {
              fetch(videoUrl, { method: 'HEAD' })
                .then(response => {
                  if (!response.ok) {
                    console.error(`Video file not accessible: ${videoUrl}`);
                  } else {
                    console.log(`Video file accessible: ${videoUrl}`);
                  }
                })
                .catch(error => {
                  console.error(`Error checking video file: ${videoUrl}`, error);
                });
            }
            
            return {
              ...clip,
              title: clip.title || `Clip from ${video.title}`,
              formattedUrl: videoUrl
            };
          });
          return [...acc, ...clipsWithTitle];
        }
        
        if (video.status !== 'completed') {
          console.log(`Skipping video ${video.id} - status is ${video.status}`);
        } else if (!video.clips || video.clips.length === 0) {
          console.log(`Skipping video ${video.id} - no clips available`);
        }
        
        return acc;
      }, []);
      
      console.log('All clips:', allClips);
      
      // Filter clips with vertical (resized) versions and valid URLs
      const vertical = allClips.filter((clip: Clip) => {
        const hasVertical = clip.resizedUrl || clip.resizedPath;
        const hasValidUrl = clip.formattedUrl && clip.formattedUrl.length > 0;
        
        if (!hasVertical) {
          console.log(`Clip ${clip.id} has no vertical version`);
        }
        if (!hasValidUrl) {
          console.log(`Clip ${clip.id} has no valid URL`);
        }
        
        return hasVertical && hasValidUrl;
      });
      
      // Log details about vertical clips
      vertical.forEach((clip: Clip, index: number) => {
        console.log(`Vertical clip ${index + 1}:`, {
          id: clip.id,
          title: clip.title,
          resizedUrl: clip.resizedUrl,
          resizedPath: clip.resizedPath,
          formattedUrl: clip.formattedUrl
        });
      });
      
      console.log('Vertical clips:', vertical);
      
      setVerticalClips(vertical);
      setClips(allClips);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setError('Failed to load videos');
      setLoading(false);
    }
  };

  // Function to handle mouse over for video preview
  const handleMouseOver = (id: string) => {
    if (videoRefs.current[id] && !videoErrors[id]) {
      videoRefs.current[id].play().catch(error => {
        console.log('Video play failed:', error);
        // Only mark as error if it's a real playback error
        if (error.name !== 'AbortError') {
          setVideoErrors(prev => ({...prev, [id]: true}));
        }
      });
    }
  };

  // Function to handle mouse leave for video preview
  const handleMouseLeave = (id: string) => {
    if (videoRefs.current[id] && !videoErrors[id]) {
      videoRefs.current[id].pause();
      videoRefs.current[id].currentTime = 0;
    }
  };

  // Function to handle video load error
  const handleVideoError = (id: string) => {
    const clip = verticalClips.find(c => c.id === id);
    console.log('Video load error for clip:', id);
    console.log('Clip details:', {
      resizedUrl: clip?.resizedUrl,
      resizedPath: clip?.resizedPath,
      formattedUrl: clip?.formattedUrl
    });
    
    // Try to verify if the video file exists
    if (clip?.formattedUrl) {
      fetch(clip.formattedUrl, { method: 'HEAD' })
        .then(response => {
          if (!response.ok) {
            console.error(`Video file not accessible: ${clip.formattedUrl}`);
            setVideoErrors(prev => ({...prev, [id]: true}));
          }
        })
        .catch(error => {
          console.error(`Error checking video file: ${error}`);
          setVideoErrors(prev => ({...prev, [id]: true}));
        });
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

  if (verticalClips.length === 0) {
    return (
      <div className="w-full h-72 mt-6 p-6 flex flex-col gap-3 items-center justify-center border-2 border-dashed border-gray-300 bg-slate50 rounded-xl text-gray-400">
        <Clock size={40} />
        <p>No vertical clips found yet. Process your videos to create vertical clips for TikTok.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {verticalClips.map((clip) => {
        const videoUrl = formatVideoUrl(clip.resizedUrl, clip.resizedPath);
        const thumbnailUrl = formatVideoUrl(clip.thumbnailUrl);
        
        return (
          <div 
            key={clip.id} 
            className="bg-white rounded-lg shadow-md overflow-hidden"
            onMouseOver={() => handleMouseOver(clip.id)}
            onMouseLeave={() => handleMouseLeave(clip.id)}
          >
            <div className="relative aspect-[9/16] bg-gray-200">
              {!videoErrors[clip.id] ? (
                <video
                  ref={el => { if (el) videoRefs.current[clip.id] = el }}
                  src={clip.formattedUrl || undefined}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster={thumbnailUrl || undefined}
                  onError={() => handleVideoError(clip.id)}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 relative">
                  <Smartphone size={40} className="text-gray-400" />
                </div>
              )}
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                {formatDuration(clip.endTime - clip.startTime)}
              </div>
            </div>
            
            <div className="p-3">
              <h3 className="font-medium text-sm line-clamp-2 mb-1">{clip.title}</h3>
              <div className="flex items-center text-xs text-gray-500">
                <Clock size={14} className="mr-1" />
                {formatDate(clip.createdAt)}
              </div>
              
              <div className="mt-3 grid grid-cols-2 gap-2">
                <a 
                  href={videoUrl || '#'} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-500 text-white text-center py-1 text-xs rounded hover:bg-blue-600"
                >
                  Preview
                </a>
                <Link 
                  href={{
                    pathname: '/edit',
                    query: {
                      clip: clip.id
                    }
                  }}
                  className="bg-gray-200 text-gray-800 text-center py-1 text-xs rounded hover:bg-gray-300"
                >
                  Edit
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper functions
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric' 
  });
} 