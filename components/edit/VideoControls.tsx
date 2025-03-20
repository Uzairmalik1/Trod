import React, { MutableRefObject } from 'react';
import { FaPlay, FaPause, FaForward, FaBackward, FaVolumeUp, FaVolumeMute, FaStepBackward, FaStepForward } from 'react-icons/fa';

interface VideoControlsProps {
  videoRef: MutableRefObject<HTMLVideoElement | null>;
}

const VideoControls: React.FC<VideoControlsProps> = ({ videoRef }) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [playbackRate, setPlaybackRate] = React.useState(1);

  // Define playback speed options
  const playbackRates = [0.5, 1, 1.5, 2];
  
  // Function to get the next playback rate in the array
  const getNextPlaybackRate = () => {
    const currentIndex = playbackRates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % playbackRates.length;
    return playbackRates[nextIndex];
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      videoRef.current?.pause();
    } else {
      videoRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleMuteUnmute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 1, duration);
    }
  };

  const handleBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 1, 0);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  const handleGoToStart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const handleGoToEnd = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = duration;
      setCurrentTime(duration);
    }
  };

  // Function to change playback speed
  const handleSpeedChange = () => {
    const nextPlaybackRate = getNextPlaybackRate();
    if (videoRef.current) {
      videoRef.current.playbackRate = nextPlaybackRate;
      setPlaybackRate(nextPlaybackRate);
    }
  };

  React.useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.addEventListener('timeupdate', handleTimeUpdate);
      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.addEventListener('ended', handleVideoEnded);

      if (videoElement.readyState >= 1) {
        handleLoadedMetadata();
      }
    }

    return () => {
      if (videoElement) {
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.removeEventListener('ended', handleVideoEnded);
      }
    };
  }, [videoRef]);

  return (
    <div className='flex items-center justify-between w-full px-4 py-4 shadow-2xl bg-neutral-200'>
      <span>{new Date(currentTime * 1000).toISOString().substr(14, 5)}</span>
      <div className='flex items-center gap-5'>
        <button onClick={handleGoToStart} aria-label="Go to start"><FaStepBackward /></button>
        <button onClick={handleBackward} aria-label="Rewind 10 seconds"><FaBackward /></button>
        <button onClick={handlePlayPause} aria-label={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
        <button onClick={handleForward} aria-label="Forward 10 seconds"><FaForward /></button>
        <button onClick={handleGoToEnd} aria-label="Go to end"><FaStepForward /></button>
        <button onClick={handleMuteUnmute} aria-label={isMuted ? "Unmute" : "Mute"}>
          {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
        </button>
        <button onClick={handleSpeedChange} aria-label={`Playback Speed ${playbackRate}x`} className='flex items-center'>
          {playbackRate}{"x"}
        </button>
      </div>
      <span>{new Date(duration * 1000).toISOString().substr(14, 5)}</span>
    </div>
  );
};

export default VideoControls;
