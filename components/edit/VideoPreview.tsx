'use client';

import { Eye, ZoomIn, Scissors, Sliders, Shuffle } from 'lucide-react';
import { RefObject, useState, useEffect } from 'react';

interface VideoPreviewProps {
    videoSrc: string;
    isYoutube: boolean;
    videoRef: RefObject<HTMLVideoElement>;
    isVertical?: boolean;
    posterImage?: string;
}

export default function VideoPreview({ 
    videoSrc, 
    isYoutube, 
    videoRef, 
    isVertical = true, 
    posterImage 
}: VideoPreviewProps) {
    const [videoError, setVideoError] = useState(false);
    const [errorDetails, setErrorDetails] = useState<string>("");

    useEffect(() => {
        // Reset error state when source changes
        if (videoSrc) {
            setVideoError(false);
            setErrorDetails("");
            console.log("Video source changed to:", videoSrc);
        }
    }, [videoSrc]);

    const handleVideoError = (e: any) => {
        console.error("Error loading video:", videoSrc, e);
        setVideoError(true);
        setErrorDetails(`Failed to load video from: ${videoSrc}`);
    };

    // Determine video type based on file extension
    const getVideoType = (src: string): string => {
        try {
            // Check if the URL includes a file extension
            const extensionMatch = src.match(/\.([a-zA-Z0-9]+)(\?|$)/);
            if (extensionMatch) {
                const extension = extensionMatch[1].toLowerCase();
                
                // Return the appropriate MIME type based on the extension
                if (extension === 'webm') return 'video/webm';
                if (extension === 'mov') return 'video/quicktime';
                if (extension === 'mkv') return 'video/x-matroska';
                // Default for mp4
                return 'video/mp4';
            }
            
            // If no extension found, default to MP4
            return 'video/mp4';
        } catch (error) {
            console.error('Error determining video type:', error);
            return 'video/mp4'; // Default to MP4 on error
        }
    };

    return (
        <div className="relative w-[63rem] bg-bgWhite rounded-lg shadow-md border">
            {/* Video Preview */}
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                <div className={`relative ${isVertical ? 'w-[290px] h-[32rem]' : 'w-full max-w-2xl aspect-video'} bg-black rounded-2xl`}>
                    {/* Placeholder for video */}
                    <div className="absolute inset-0 flex items-center justify-center text-white text-2xl">
                        {videoSrc ? (
                            <div className="flex flex-col items-center w-full h-full">
                                {/* Render YouTube Video or Local Video */}
                                {isYoutube ? (
                                    <iframe
                                        className="w-full h-full rounded-lg shadow-md"
                                        src={`https://www.youtube.com/embed/${videoSrc.split("v=")[1]}`}
                                        frameBorder="0"
                                        allowFullScreen
                                    />
                                ) : (
                                    !videoError ? (
                                        <video 
                                            ref={videoRef} 
                                            className="w-full h-full rounded-lg shadow-md object-contain bg-black"
                                            poster={posterImage}
                                            controls
                                            onError={handleVideoError}
                                            key={videoSrc} // Add key to force re-render when source changes
                                        >
                                            <source src={videoSrc} type={getVideoType(videoSrc)} />
                                            <source src={videoSrc} type="video/mp4" />
                                            <source src={videoSrc} type="video/webm" />
                                            Your browser does not support the video tag.
                                        </video>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full w-full">
                                            <p className="text-red-500 text-center text-base mb-2">Error loading video</p>
                                            <p className="text-gray-400 text-center text-sm max-w-[80%] break-words">{errorDetails}</p>
                                            <button 
                                                className="mt-4 px-3 py-1 bg-gray-800 text-white rounded text-sm"
                                                onClick={() => {
                                                    setVideoError(false);
                                                    setErrorDetails("");
                                                }}
                                            >
                                                Try Again
                                            </button>
                                        </div>
                                    )
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-500">No video selected. Please upload a video.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Editing Options */}
            <div className="absolute right-4 top-1/4 space-y-1 bg-white p-1 border rounded-lg shadow-lg">
                <button className="w-[50px] flex flex-col items-center rounded-lg hover:bg-slate-100 p-1">
                    <Eye size={20} />
                    <span className="text-[10px]">Show overlay</span>
                </button>
                <button className="w-[50px] flex flex-col items-center rounded-lg hover:bg-slate-100 p-1">
                    <ZoomIn size={20} />
                    <span className="text-[10px]">Zoom</span>
                </button>
                <button className="w-[50px] flex flex-col items-center rounded-lg hover:bg-slate-100 p-1">
                    <Scissors size={20} />
                    <span className="text-[10px]">Cut silent parts</span>
                </button>
                <button className="w-[50px] flex flex-col items-center rounded-lg hover:bg-slate-100 p-1">
                    <Sliders size={20} />
                    <span className="text-[10px]">Playback speed</span>
                </button>
                <button className="w-[50px] flex flex-col items-center rounded-lg hover:bg-slate-100 p-1">
                    <Shuffle size={20} />
                    <span className="text-[10px]">Transitions</span>
                </button>
            </div>
        </div>
    );
}
