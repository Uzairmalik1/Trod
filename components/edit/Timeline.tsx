import React, { useState, useEffect, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface Subtitle {
  startTime: number;
  endTime: number;
  text: string;
}

interface VideoEditorProps {
  videoUrl: string;
  subtitles: Subtitle[];
  onCutVideo: (start: number, end: number) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const TimeLine: React.FC<VideoEditorProps> = ({ videoUrl, subtitles, onCutVideo, videoRef }) => {
  const [frames, setFrames] = useState<{ time: number; url: string }[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [dragging, setDragging] = useState<'start' | 'end' | 'playMarker' | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0); // New state for current time
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const messageRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const loadAndGenerate = async () => {
      if (videoUrl) {
        setLoading(true);
        try {
          await loadFFmpeg();
          const duration = await getVideoDuration(videoUrl);
          setVideoDuration(duration)

          // Generate time markers first
          const frameList = await generateFrames(videoUrl, duration);
          setFrames(frameList);

          setEndTime(duration);
        } catch (error) {
          console.error('Error generating frames:', error);
          if (messageRef.current) {
            messageRef.current.textContent = 'Error generating frames.';
          }
        } finally {
          setLoading(false);
        }
      }
    };
    loadAndGenerate();
  }, [videoUrl]);

  const loadFFmpeg = async () => {
    if (ffmpegRef.current && ffmpegRef.current.loaded) return;
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    ffmpegRef.current = new FFmpeg();

    ffmpegRef.current.on('log', ({ message }) => {
      if (messageRef.current) {
        messageRef.current.innerHTML = message;
      }
      console.log(message);
    });

    try {
      await ffmpegRef.current.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      console.log('FFmpeg loaded successfully');
    } catch (error) {
      console.error('Error loading FFmpeg:', error);
      if (messageRef.current) {
        messageRef.current.textContent = 'Failed to load FFmpeg. Please try again later.';
      }
      throw new Error('FFmpeg loading failed');
    }
  };

  const generateFrames = async (videoUrl: string, duration: number) => {
    if (!ffmpegRef.current) return [];
    const ffmpeg = ffmpegRef.current;

    try {
      await ffmpeg.writeFile('input.mp4', await fetchFile(videoUrl));
      console.log('Video file loaded successfully.');

      const interval = 1; // seconds between frames
      const frameCount = Math.floor(duration / interval);

      const framePromises = Array.from({ length: frameCount }).map(async (_, index) => {
        const time = index * interval;
        if (duration > 5) {
          return { time, url: '' }; // Skip image generation for long videos
        }

        try {
          await ffmpeg.exec([
            '-i', 'input.mp4',
            '-ss', time.toString(),
            '-frames:v', '1',
            `frame${index}.jpg`,
          ]);
          const fileData = await ffmpeg.readFile(`frame${index}.jpg`);
          const url = URL.createObjectURL(new Blob([fileData as Uint8Array], { type: 'image/jpeg' }));
          return { time, url };
        } catch (error) {
          console.error(`Error generating frame at ${time}s:`, error);
          return { time, url: '' }; // Continue with time markers even if frame fails
        }
      });

      return Promise.all(framePromises);
    } catch (error) {
      console.error('Error loading video file:', error);
      return [];
    }
  };

  useEffect(() => {
    onCutVideo(startTime, endTime);
    if (videoRef.current) {
      const updateCurrentTime = () => {
        const time = videoRef.current?.currentTime || 0;

        // If the video reaches or exceeds the end time, pause it
        if (time >= endTime) {
          videoRef.current?.pause();
          setCurrentTime(endTime);
        } else if (time < startTime) {
          // If the video plays before startTime, reset it to startTime
          if (videoRef.current) {
            videoRef.current.currentTime = startTime;
          }
          setCurrentTime(startTime);
        } else {
          // Otherwise, update currentTime
          setCurrentTime(time);
        }
      };

      videoRef.current.addEventListener('timeupdate', updateCurrentTime);

      return () => {
        videoRef.current?.removeEventListener('timeupdate', updateCurrentTime);
      };
    }
  }, [videoRef, startTime, endTime]);



  const getVideoDuration = (videoUrl: string): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        resolve(video.duration);
      };

      video.src = videoUrl;
    });
  };

  const handleMouseDown = (type: 'start' | 'end' | 'playMarker') => {
    setDragging(type);
  };

  const handleMouseUp = () => {
    if (dragging === 'playMarker') {
      videoRef.current!.currentTime = currentTime;
    }
    setDragging(null);
    onCutVideo(startTime, endTime);
  };

  // Handle mouse leave (stop dragging)
  const handleMouseLeave = () => {
    setDragging(null) // Stop dragging when mouse leaves the marker
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (dragging && timelineRef.current && frames.length > 0) {
      const rect = timelineRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const time = (x / rect.width) * videoDuration;

      if (dragging === 'start' && time < endTime) {
        setStartTime(time);
        setCurrentTime(time); // Sync play marker with startTime
        videoRef.current!.currentTime = time; // Update video time to startTime
      } else if (dragging === 'end' && time > startTime) {
        setEndTime(time);
      } else if (dragging === 'playMarker') {
        // play marker stays within the bounds of startTime and endTime
        if (time >= startTime && time <= endTime) {
          setCurrentTime(time);
          videoRef.current!.currentTime = time;
        }
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };


  console.log("left: ", (startTime / frames[frames.length - 1]?.time) * 100)
  console.log("width : ", ((endTime) / frames[frames.length - 1]?.time) * 100)

  return (

    <div onMouseUp={handleMouseUp} onMouseLeave={handleMouseLeave} onMouseMove={handleMouseMove} className='overflow-x-auto pb-2 w-full'>
      <div className='flex border-b-2 pb-1 pt-2 bg-neutral-100' style={{ width: `${frames.length * 120}px` }}>
        {frames.map((frame, index) => (
          <div key={index} className='w-[120px] mb-2'>
            <div style={{ textAlign: 'start', fontSize: '12px' }} className=''>
              {formatTime(frame.time)}
            </div>
            <div className='flex gap-4 ml-[5px]'>
              <pre className='w-[2px] h-[12px] bg-gray-900 text-center'> </pre>
              <div className='flex gap-[10px] ml-[-7px] relative'>
                {[...Array(9)].map((_, idx) => (
                  <span key={idx} className='w-[2px] h-[8px] bg-gray-900'> </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Subtitles Section */}
      {/* {!loading ? (
        <div className='flex relative mt-3 mb-2' style={{ width: `${frames.length * 120}px` }}>
          {subtitles.map((subtitle, index) => (
            <div key={index}
              style={{
                left: `${(subtitle.startTime / videoDuration) * 100}%`,
                textAlign: 'left',
              }}
              className='absolute top-[0px] text-center mt-1'>
              {subtitle.text.split(' ').map((word, idx) => (
                <span key={idx} className='bg-neutral-400 rounded-full px-1 py-1 hover:border-2 hover:border-neutral-900 border-dashed'>{word}</span>
              ))}
            </div>
          ))}
        </div>
      ) : " "} */}


      {/* Timeline */}
      {!loading ? (

        <div ref={timelineRef} className='relative h-[40px] mt-1 border bg-gray-300 rounded-xl' style={{ width: `${frames.length * 120}px` }}>
          <div
            style={{
              left: `${(startTime / videoDuration) * 100}%`, // Use video duration here
              width: `${((endTime - startTime) / videoDuration) * 100}%`, borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px',
            }}
            className='absolute top-0 h-full bg-gray-600'
          />
          {/* start Marker  */}
          <div
            onMouseDown={() => handleMouseDown('start')}
            className='absolute top-0 h-full w-2 bg-gray-800 cursor-ew-resize'
            style={{ left: `${(startTime / videoDuration) * 100}%`, borderTopLeftRadius: '20px', borderBottomLeftRadius: '20px' }}
          />
          {/* end Marker */}
          <div
            onMouseDown={() => handleMouseDown('end')}
            className='absolute top-0 h-full w-2 bg-gray-800 cursor-ew-resize'
            style={{ left: `${(endTime / videoDuration) * 100}%`, borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}
          />
          {/* play Marker */}
          <div
            onMouseDown={() => handleMouseDown('playMarker')}
            className='absolute top-[-66px] h-[130px] w-[1.5px] bg-blue-600 cursor-ew-resize'
            style={{ left: `${(currentTime / videoDuration) * 100}%` }}
          >
            <svg className="timeline-editor-cursor-top ml-[-3.1px]" width="8" height="12" viewBox="0 0 8 12" fill="none"><path d="M0 1C0 0.447715 0.447715 0 1 0H7C7.55228 0 8 0.447715 8 1V9.38197C8 9.76074 7.786 10.107 7.44721 10.2764L4.44721 11.7764C4.16569 11.9172 3.83431 11.9172 3.55279 11.7764L0.552786 10.2764C0.214002 10.107 0 9.76074 0 9.38197V1Z" fill="#5297FF"></path></svg>
          </div>

        </div>

      ) : ''}


      {/* Loading Indicator */}
      {loading && <p className='flex items-center justify-center w-full'>Loading...</p>}
    </div>
  );
};

export default TimeLine;
