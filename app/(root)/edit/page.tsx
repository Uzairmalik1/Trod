"use client";
import AutoTranslateSection from "@/components/edit/AutoTranslateSection";
import CropSection from "@/components/edit/CropSection";
import EditSection from "@/components/edit/EditSection";
import ElementsSection from "@/components/edit/ElementsSection";
import Navbar from "@/components/edit/Navbar";
import Timeline from "@/components/edit/Timeline";
import VideoControls from "@/components/edit/VideoControls";
import VideoPreview from "@/components/edit/VideoPreview";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, RefObject, Suspense } from "react";
import { Loader2, AlertCircle } from 'lucide-react';
import { formatVideoUrl } from '@/lib/pathUtils';

interface Subtitle {
  startTime: number;
  endTime: number;
  text: string;
}

interface Clip {
  id: string;
  title: string;
  url: string;
  filePath?: string;
  videoId?: string;
  resizedUrl: string | null;
  resizedPath?: string | null;
  thumbnailUrl: string | null;
  subtitlesUrl: string | null;
  startTime: number;
  endTime: number;
  createdAt: string;
}

// Create a separate component for the edit functionality that uses useSearchParams
function EditPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoURL = searchParams.get("video");
  const clipId = searchParams.get("clip");

  const [videoSrc, setVideoSrc] = useState<string>("");
  const [thumbnailSrc, setThumbnailSrc] = useState<string>("");
  const [isYoutube, setIsYoutube] = useState(false);
  const [selectedTool, setSelectedTool] = useState("edit");
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [loading, setLoading] = useState(clipId ? true : false);
  const [error, setError] = useState("");
  const [clip, setClip] = useState<Clip | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null) as RefObject<HTMLVideoElement>;

  useEffect(() => {
    if (clipId) {
      fetchClip(clipId);
    } else if (videoURL && !clipId) {
      const decodedVideoURL = decodeURIComponent(videoURL);
      setVideoSrc(decodedVideoURL);
      setIsYoutube(decodedVideoURL.includes("youtube.com") || decodedVideoURL.includes("youtu.be"));
      
      // If subtitles URL is provided directly
      const subtitlesURL = searchParams.get("subtitles");
      if (subtitlesURL && subtitlesURL !== "null") {
        fetchSubtitles(decodeURIComponent(subtitlesURL));
      }
    }
  }, [clipId, videoURL, searchParams]);

  const fetchClip = async (id: string) => {
    try {
      setLoading(true);
      setError("");
      console.log('Fetching clip with ID:', id);
      
      const response = await fetch(`/api/clips/${id}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const status = response.status;
        let errorMessage = 'Failed to fetch clip';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        
        console.error(`API error (${status}):`, errorMessage);
        throw new Error(`${errorMessage} (${status})`);
      }
      
      const data = await response.json();
      
      if (!data.clip) {
        console.error('Invalid clip data received:', data);
        throw new Error('Invalid clip data received');
      }
      
      console.log('Clip data received:', data.clip);
      setClip(data.clip);
      
      // Set video source based on clip data
      let videoSource = "";
      
      // First try the resized path for vertical videos
      if (data.clip.resizedUrl || data.clip.resizedPath) {
        videoSource = formatVideoUrl(data.clip.resizedUrl, data.clip.resizedPath);
        console.log('Using resized video path:', videoSource);
      } 
      // Fallback to original video
      else if (data.clip.url || data.clip.filePath) {
        videoSource = formatVideoUrl(data.clip.url, data.clip.filePath);
        console.log('Using original video path:', videoSource);
      }
      
      if (!videoSource) {
        console.error('No valid video source found in clip data:', data.clip);
        throw new Error('No valid video source found in clip data');
      }
      
      setVideoSrc(videoSource);
      console.log('Video source set to:', videoSource);
      
      // Set thumbnail if available
      if (data.clip.thumbnailUrl) {
        const thumbnailSource = formatVideoUrl(data.clip.thumbnailUrl);
        setThumbnailSrc(thumbnailSource);
        console.log('Thumbnail source set to:', thumbnailSource);
      }
      
      // Fetch subtitles if available
      if (data.clip.subtitlesUrl) {
        try {
          const subtitlesSource = formatVideoUrl(data.clip.subtitlesUrl);
          console.log('Fetching subtitles from:', subtitlesSource);
          
          // Use the direct path from the database
          await fetchSubtitles(subtitlesSource);
        } catch (subtitleError) {
          console.error('Error loading subtitles, but continuing with video:', subtitleError);
        }
      } else {
        console.log('No subtitles URL available for this clip');
      }
      
      setLoading(false);
    } catch (error: Error | unknown) {
      console.error('Error fetching clip:', error);
      setError(error instanceof Error ? error.message : 'Failed to load clip');
      setLoading(false);
    }
  };

  const fetchSubtitles = async (subtitlesUrl: string) => {
    try {
      console.log(`Attempting to fetch subtitles from: ${subtitlesUrl}`);
      
      if (!subtitlesUrl || subtitlesUrl === "null") {
        console.log('Invalid subtitles URL, skipping fetch');
        setSubtitles([]);
        return;
      }
      
      // Ensure the URL starts with a slash and remove any double slashes
      const normalizedUrl = ('/' + subtitlesUrl.replace(/^\/+/, '')).replace(/\/+/g, '/');
      console.log(`Using normalized subtitle URL: ${normalizedUrl}`);
      
      const response = await fetch(normalizedUrl, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        console.error(`Failed to fetch subtitles: ${response.status} ${response.statusText}`);
        setSubtitles([]);
        return;
      }
      
      const srtContent = await response.text();
      console.log(`Received subtitle content (${srtContent.length} bytes)`);
      
      if (!srtContent || srtContent.trim().length === 0) {
        console.warn('Empty subtitles content received');
        setSubtitles([]);
        return;
      }
      
      // Parse SRT content into subtitles array
      const parsedSubtitles = parseSRT(srtContent);
      console.log(`Parsed ${parsedSubtitles.length} subtitles`);
      
      if (parsedSubtitles.length === 0) {
        console.warn('No subtitles parsed from content');
        console.log('Raw subtitle content sample:', srtContent.substring(0, 200));
      }
      
      setSubtitles(parsedSubtitles);
    } catch (error) {
      console.error('Error fetching subtitles:', error);
      setSubtitles([]);
    }
  };

  // Enhanced SRT parser with improved format support
  const parseSRT = (srtContent: string): Subtitle[] => {
    try {
      const parsedSubtitles: Subtitle[] = [];
      
      // Normalize line endings
      const normalizedContent = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      
      // First check if it might be JSON format
      if (normalizedContent.trim().startsWith('{') || normalizedContent.trim().startsWith('[')) {
        try {
          const jsonData = JSON.parse(normalizedContent);
          console.log('Detected JSON format subtitles');
          
          // Handle JSON format (assuming array of objects with start, end, text)
          if (Array.isArray(jsonData)) {
            console.log(`Found ${jsonData.length} JSON subtitle entries`);
            return jsonData.map(item => ({
              startTime: typeof item.start === 'number' ? item.start : 
                        typeof item.startTime === 'number' ? item.startTime : 0,
              endTime: typeof item.end === 'number' ? item.end : 
                      typeof item.endTime === 'number' ? item.endTime : 0,
              text: item.text || item.content || ''
            }));
          }
        } catch (e) {
          console.log('JSON parsing failed, continuing with SRT parsing');
        }
      }
      
      // Check for WebVTT format
      if (normalizedContent.includes('WEBVTT')) {
        console.log('Detected WebVTT format');
        return parseWebVTT(normalizedContent);
      }
      
      // Standard SRT processing
      // Split the SRT content by double newline (subtitle blocks)
      const blocks = normalizedContent.trim().split(/\n\n+/);
      console.log(`Processing ${blocks.length} subtitle blocks`);
      
      blocks.forEach((block, index) => {
        try {
          const lines = block.split(/\n/);
          
          // Skip if not enough lines for a valid subtitle
          if (lines.length < 2) {
            return;
          }
          
          // Find the timestamp line (format: 00:00:00,000 --> 00:00:00,000)
          let timestampLine = '';
          let textLines: string[] = [];
          
          // Search for the timestamp line (it should contain ' --> ')
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(' --> ')) {
              timestampLine = lines[i];
              textLines = lines.slice(i + 1);
              break;
            }
          }
          
          if (!timestampLine) {
            return;
          }
          
          // Parse timestamps using regex that handles both comma and period separators
          const timestampMatch = timestampLine.match(/(\d{1,2}:\d{1,2}:\d{1,2}[,\.]\d{1,3}) --> (\d{1,2}:\d{1,2}:\d{1,2}[,\.]\d{1,3})/);
          
          if (timestampMatch) {
            const startTimeStr = timestampMatch[1];
            const endTimeStr = timestampMatch[2];
            
            // Convert timestamp to seconds
            const startTime = parseTimestamp(startTimeStr);
            const endTime = parseTimestamp(endTimeStr);
            
            // Join remaining lines as text (may be multi-line)
            const text = textLines.join(' ').trim();
            
            if (text) {
              parsedSubtitles.push({
                startTime,
                endTime,
                text
              });
            }
          }
        } catch (blockError) {
          console.error(`Error parsing block ${index}:`, blockError);
        }
      });
      
      console.log(`Successfully parsed ${parsedSubtitles.length} out of ${blocks.length} subtitle blocks`);
      return parsedSubtitles;
    } catch (error) {
      console.error('Error in SRT parser:', error);
      return [];
    }
  };

  // Parse WebVTT format
  const parseWebVTT = (vttContent: string): Subtitle[] => {
    try {
      const parsedSubtitles: Subtitle[] = [];
      const lines = vttContent.trim().split('\n');
      
      let inCue = false;
      let cueStart = 0;
      let cueEnd = 0;
      let cueText = '';
      
      // Skip header (WEBVTT line and any metadata)
      let i = 0;
      while (i < lines.length && !lines[i].includes('-->')) {
        i++;
      }
      
      // Process cues
      for (; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.includes('-->')) {
          // Start of a new cue
          inCue = true;
          cueText = '';
          
          // Parse timestamps
          const timestampMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/);
          if (timestampMatch) {
            cueStart = parseTimestamp(timestampMatch[1]);
            cueEnd = parseTimestamp(timestampMatch[2]);
          }
        } else if (inCue) {
          if (line === '') {
            // Empty line marks end of cue
            if (cueText) {
              parsedSubtitles.push({
                startTime: cueStart,
                endTime: cueEnd,
                text: cueText.trim()
              });
            }
            inCue = false;
          } else {
            // Add to cue text
            cueText += (cueText ? ' ' : '') + line;
          }
        }
      }
      
      // Add last cue if we're still processing one
      if (inCue && cueText) {
        parsedSubtitles.push({
          startTime: cueStart,
          endTime: cueEnd,
          text: cueText.trim()
        });
      }
      
      console.log(`Parsed ${parsedSubtitles.length} WebVTT cues`);
      return parsedSubtitles;
    } catch (error) {
      console.error('Error parsing WebVTT:', error);
      return [];
    }
  };

  // Enhanced timestamp parser that handles both comma and period separators
  const parseTimestamp = (timestamp: string): number => {
    try {
      // Normalize the timestamp by replacing comma with period for parsing
      const normalizedTimestamp = timestamp.replace(',', '.');
      const parts = normalizedTimestamp.split(':');
      
      if (parts.length !== 3) {
        console.warn(`Invalid timestamp format: ${timestamp}`);
        return 0;
      }
      
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const seconds = parseFloat(parts[2]);
      
      if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
        console.warn(`Invalid timestamp values: ${timestamp}`);
        return 0;
      }
      
      return hours * 3600 + minutes * 60 + seconds;
    } catch (error) {
      console.error(`Error parsing timestamp: ${timestamp}`, error);
      return 0;
    }
  };

  const handleCutVideo = (start: number, end: number) => {
    // Handle video cutting logic here
    console.log(`Cut video from ${start} to ${end}`);
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate50">
        <Loader2 size={40} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-slate50 text-red-500">
        <AlertCircle size={40} />
        <p className="mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar 
        selectedTool={selectedTool} 
        setSelectedTool={setSelectedTool}
        clipTitle={clip?.title || 'Untitled Clip'}
      />
      <main className="flex-1 flex flex-col p-4 md:p-6 space-y-6">
        <div className="bg-slate50">
          <div className="flex justify-between flex-col md:flex-row h-full px-4">
            {/* Sidebar */}
            <div className="w-1/3 p-4 border-r bg-bgWhite rounded-lg shadow-md border h-[44.5rem] overflow-y-auto">
              {selectedTool === "crop" && <CropSection />}
              {selectedTool === "edit" && <EditSection subtitles={subtitles} />}
              {selectedTool === "elements" && <ElementsSection />}
              {selectedTool === "translate" && <AutoTranslateSection />}
            </div>

            <div className="w-[63rem]">
              <VideoPreview 
                videoSrc={videoSrc} 
                isYoutube={isYoutube} 
                videoRef={videoRef} 
                isVertical={clip?.resizedUrl !== null}
                posterImage={thumbnailSrc}
              />
              
              <div className="">
                <VideoControls videoRef={videoRef} />
                <Timeline videoUrl={videoSrc} subtitles={subtitles} onCutVideo={handleCutVideo} videoRef={videoRef} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Main page component with Suspense boundary
export default function EditPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <EditPageContent />
    </Suspense>
  );
}

