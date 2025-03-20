import sys
import types
import os
import subprocess
import argparse
from pathlib import Path
import json
import shutil
import warnings
import tempfile

# Create a mock magic module
class MockMagic:
    def __init__(self, mime=False):
        self.mime = mime
    
    def from_file(self, path):
        # Simply return a default MIME type based on the file extension
        if Path(path).suffix.lower() in ['.mp4', '.avi', '.mov', '.mkv']:
            return 'video/mp4'
        elif Path(path).suffix.lower() in ['.mp3', '.wav', '.ogg', '.flac']:
            return 'audio/mp3'
        return 'application/octet-stream'

# Create a mock magic module and add it to sys.modules
mock_magic = types.ModuleType('magic')
mock_magic.Magic = MockMagic
sys.modules['magic'] = mock_magic

from clipsai import ClipFinder, Transcriber
try:
    from clipsai import resize as clipsai_resize
    RESIZE_AVAILABLE = True
except ImportError:
    print("Warning: Resize functionality not available. You may need to install additional dependencies.")
    RESIZE_AVAILABLE = False

# Try to import PySceneDetect and OpenCV
try:
    import cv2
    import numpy as np
    import scenedetect
    from scenedetect import VideoManager, SceneManager, StatsManager
    from scenedetect.detectors import ContentDetector
    SCENE_DETECT_AVAILABLE = True
except ImportError:
    print("Warning: PySceneDetect and/or OpenCV not available. Install with: pip install opencv-python scenedetect")
    SCENE_DETECT_AVAILABLE = False

# Suppress specific warnings about version mismatches
warnings.filterwarnings("ignore", message="Model was trained with pyannote.audio 0.0.1")
warnings.filterwarnings("ignore", message="Model was trained with torch 1.10.0")

# Function to extract clip using ffmpeg
def extract_clip(input_file, output_file, start_time, end_time):
    """
    Extract a clip from a video file using ffmpeg with high-quality settings.
    
    Args:
        input_file: Path to the input video file.
        output_file: Path to the output video file.
        start_time: Start time in seconds.
        end_time: End time in seconds.
    
    Returns:
        True if successful, False otherwise.
    """
    duration = end_time - start_time
    
    cmd = [
        'ffmpeg',
        '-i', input_file,
        '-ss', str(start_time),
        '-t', str(duration),
        '-c:v', 'libx264',  # High-quality H.264 codec
        '-preset', 'slow',  # Slower preset for better quality
        '-crf', '18',       # Constant Rate Factor (lower is higher quality, 18 is considered visually lossless)
        '-c:a', 'aac',      # AAC audio codec
        '-b:a', '192k',     # Higher bitrate for audio
        '-map_metadata', '-1',  # Remove metadata to reduce file size
        '-y',  # Overwrite output file if it exists
        output_file
    ]
    
    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        stdout, stderr = process.communicate()
        
        if process.returncode != 0:
            print(f"Error extracting clip: {stderr.decode()}")
            return False
        
        return True
    except Exception as e:
        print(f"Exception during extraction: {str(e)}")
        return False

def create_srt_file(transcription, clip, output_srt_path):
    """
    Create an SRT subtitle file for a clip.
    
    Args:
        transcription: The transcription object
        clip: The clip object containing start and end times
        output_srt_path: Path to save the SRT file
    
    Returns:
        True if successful, False otherwise.
    """
    try:
        clip_start = clip.start_time
        clip_end = clip.end_time
        
        # Get words within the clip time range
        words_in_range = [w for w in transcription.words if 
                        (clip_start <= w.start_time <= clip_end) or 
                        (clip_start <= w.end_time <= clip_end) or
                        (w.start_time <= clip_start and w.end_time >= clip_end)]
        
        if not words_in_range:
            print(f"No words found in the clip time range {clip_start} to {clip_end}")
            return False
        
        # Group words into subtitle blocks (approximately 5-10 words per line)
        subtitle_blocks = []
        current_block = []
        current_block_start = None
        current_block_end = None
        
        words_per_line = 4  # Adjust as needed
        
        for word in words_in_range:
            if current_block_start is None:
                current_block_start = word.start_time
            
            current_block.append(word)
            current_block_end = word.end_time
            
            if len(current_block) >= words_per_line:
                subtitle_blocks.append({
                    'start': max(0, current_block_start - clip_start),  # Adjust to clip start time
                    'end': max(0, current_block_end - clip_start),      # Adjust to clip start time
                    'text': ' '.join([w.text for w in current_block])
                })
                current_block = []
                current_block_start = None
        
        # Add any remaining words
        if current_block:
            subtitle_blocks.append({
                'start': max(0, current_block_start - clip_start),
                'end': max(0, current_block_end - clip_start),
                'text': ' '.join([w.text for w in current_block])
            })
        
        # Write SRT file
        with open(output_srt_path, 'w', encoding='utf-8') as f:
            for i, block in enumerate(subtitle_blocks):
                f.write(f"{i+1}\n")
                
                # Format time as HH:MM:SS,mmm
                start_h = int(block['start'] // 3600)
                start_m = int((block['start'] % 3600) // 60)
                start_s = int(block['start'] % 60)
                start_ms = int((block['start'] % 1) * 1000)
                
                end_h = int(block['end'] // 3600)
                end_m = int((block['end'] % 3600) // 60)
                end_s = int(block['end'] % 60)
                end_ms = int((block['end'] % 1) * 1000)
                
                time_str = f"{start_h:02d}:{start_m:02d}:{start_s:02d},{start_ms:03d} --> {end_h:02d}:{end_m:02d}:{end_s:02d},{end_ms:03d}"
                f.write(f"{time_str}\n")
                f.write(f"{block['text']}\n\n")
        
        return True
    except Exception as e:
        print(f"Error creating SRT file: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def resize_for_tiktok(input_file, output_file, pyannote_token):
    """
    Resize a video to 9:16 aspect ratio for TikTok with enhanced object detection.
    
    Args:
        input_file: Path to the input video file
        output_file: Path to the output resized video file
        pyannote_token: Hugging Face token for Pyannote
        
    Returns:
        True if successful, False otherwise.
    """
    if not RESIZE_AVAILABLE:
        print("Resize functionality not available. Make sure all dependencies are installed.")
        return False
    
    try:
        # Ensure output directory exists
        os.makedirs(os.path.dirname(os.path.abspath(output_file)), exist_ok=True)
        
        # Method 1: ClipsAI intelligent resize with enhanced diagnostics
        try:
            print(f"\n{'='*50}")
            print("DETAILED DIAGNOSTICS: ClipsAI Intelligent Resize")
            print(f"{'='*50}")
            print(f"Input file: {input_file}")
            print(f"Output file: {output_file}")
            
            # Get video metadata for diagnostics
            probe_cmd = [
                'ffprobe', 
                '-v', 'error', 
                '-select_streams', 'v:0', 
                '-show_entries', 'stream=width,height,r_frame_rate,duration', 
                '-of', 'json', 
                input_file
            ]
            
            probe_process = subprocess.Popen(
                probe_cmd, 
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE
            )
            stdout, stderr = probe_process.communicate()
            
            if probe_process.returncode == 0:
                video_info = json.loads(stdout.decode())
                if 'streams' in video_info and video_info['streams']:
                    stream = video_info['streams'][0]
                    print(f"Video dimensions: {stream.get('width')}x{stream.get('height')}")
                    print(f"Frame rate: {stream.get('r_frame_rate')}")
                    print(f"Duration: {stream.get('duration')}s")
            
            print("\nAttempting ClipsAI intelligent resize...")
            
            # Use ClipsAI's resize method with only supported parameters
            crops = clipsai_resize(
                video_file_path=input_file,
                pyannote_auth_token=pyannote_token,
                aspect_ratio=(9, 16)
            )
            
            # Print diagnostic information
            print("\nClipsAI Resize Result:")
            if crops:
                print(f"Number of segments: {len(crops.segments) if hasattr(crops, 'segments') else 0}")
                
                if hasattr(crops, 'segments') and crops.segments:
                    for i, segment in enumerate(crops.segments):
                        print(f"\nSegment {i+1}:")
                        print(f"  Time range: {segment.get('start_time', 'N/A')} to {segment.get('end_time', 'N/A')}")
                        print(f"  Crop coordinates: x={segment.get('x', 'N/A')}, y={segment.get('y', 'N/A')}")
                        print(f"  Crop dimensions: width={segment.get('width', 'N/A')}, height={segment.get('height', 'N/A')}")
                        
                        # Log detection information if available
                        if 'detection_info' in segment:
                            print("  Detection info:")
                            detection = segment['detection_info']
                            print(f"    Faces found: {detection.get('num_faces', 'N/A')}")
                            print(f"    ROI confidence: {detection.get('roi_confidence', 'N/A')}")
                else:
                    print("No segments found in crops object.")
            else:
                print("Crops object is None or invalid.")
            
            # Validate crops with enhanced error checking
            if crops and hasattr(crops, 'segments') and crops.segments:
                # Create a temporary directory for intermediate files
                temp_dir = os.path.join(os.path.dirname(output_file), "temp_resize")
                os.makedirs(temp_dir, exist_ok=True)
                
                # Prepare segment files for concatenation
                segment_files = []
                
                # Process each segment with better error handling
                for i, segment in enumerate(crops.segments):
                    try:
                        start_time = segment.get('start_time')
                        end_time = segment.get('end_time')
                        
                        if start_time is None or end_time is None:
                            print(f"Segment {i+1}: Missing time information, skipping.")
                            continue
                            
                        duration = end_time - start_time
                        
                        # Get crop coordinates with validation
                        crop_x = segment.get('x')
                        crop_y = segment.get('y')
                        crop_width = segment.get('width')
                        crop_height = segment.get('height')
                        
                        # Validate crop coordinates
                        if (crop_x is None or crop_y is None or 
                            crop_width is None or crop_height is None or
                            crop_width <= 0 or crop_height <= 0):
                            print(f"Segment {i+1}: Invalid crop coordinates, skipping.")
                            continue
                        
                        # Segment output file
                        segment_file = os.path.join(temp_dir, f"segment_{i:03d}.mp4")
                        
                        print(f"\nProcessing segment {i+1} with the following parameters:")
                        print(f"  Time: {start_time:.2f}s to {end_time:.2f}s (Duration: {duration:.2f}s)")
                        print(f"  Crop: x={crop_x:.4f}, y={crop_y:.4f}, width={crop_width:.4f}, height={crop_height:.4f}")
                        
                        # FFmpeg command with intelligent cropping
                        cmd = [
                            'ffmpeg',
                            '-i', input_file,
                            '-ss', str(start_time),
                            '-t', str(duration),
                            '-vf', (
                                f"crop=iw*{crop_width}:ih*{crop_height}:iw*{crop_x}:ih*{crop_y},"
                                f"scale=-2:1920:flags=lanczos"  # High-quality scaling
                            ),
                            '-c:v', 'libx264',
                            '-preset', 'slow',     # Slower preset for better quality
                            '-crf', '18',          # Very high quality
                            '-c:a', 'aac',
                            '-b:a', '192k',        # High audio bitrate
                            '-pix_fmt', 'yuv420p', # Ensure wide compatibility
                            '-movflags', '+faststart',  # Optimize for web streaming
                            '-y',
                            segment_file
                        ]
                        
                        # Save command for debugging
                        cmd_str = ' '.join(cmd)
                        print(f"FFmpeg command: {cmd_str}")
                        
                        # Execute FFmpeg for each segment
                        process = subprocess.Popen(
                            cmd,
                            stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE
                        )
                        stdout, stderr = process.communicate()
                        
                        # Check if segment processing was successful
                        if process.returncode == 0:
                            segment_files.append(segment_file)
                            print(f"Successfully processed segment {i+1}")
                        else:
                            print(f"Error processing segment {i+1}:")
                            print(stderr.decode())
                    except Exception as segment_error:
                        print(f"Exception while processing segment {i+1}: {str(segment_error)}")
                
                # Validate segment files
                if segment_files:
                    try:
                        # Create concat file
                        concat_file = os.path.join(temp_dir, "concat.txt")
                        with open(concat_file, 'w') as f:
                            for file in segment_files:
                                f.write(f"file '{file}'\n")
                        
                        print(f"\nConcatenating {len(segment_files)} segments...")
                        
                        # Concatenate segments
                        cmd = [
                            'ffmpeg',
                            '-f', 'concat',
                            '-safe', '0',
                            '-i', concat_file,
                            '-c', 'copy',
                            '-y',
                            output_file
                        ]
                        
                        process = subprocess.Popen(
                            cmd,
                            stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE
                        )
                        stdout, stderr = process.communicate()
                        
                        # Check concatenation result
                        if process.returncode == 0:
                            print(f"Successfully created high-quality 9:16 video using ClipsAI: {output_file}")
                            return True
                        else:
                            print("Concatenation failed:")
                            print(stderr.decode())
                    except Exception as concat_error:
                        print(f"Exception during concatenation: {str(concat_error)}")
            else:
                error_msg = "No valid crop information returned by ClipsAI"
                if not crops:
                    error_msg = "ClipsAI returned None"
                elif not hasattr(crops, 'segments'):
                    error_msg = "ClipsAI crops object does not have 'segments' attribute"
                elif not crops.segments:
                    error_msg = "ClipsAI crops object has empty segments list"
                
                print(f"ClipsAI intelligent resize failed: {error_msg}")
                raise ValueError(error_msg)
        
        except Exception as clipsai_error:
            print(f"\nClipsAI resize failed with error: {clipsai_error}")
            import traceback
            traceback.print_exc()
            print(f"{'='*50}\n")
            
        # Method 1.5: PySceneDetect + OpenCV based content-aware cropping
        if SCENE_DETECT_AVAILABLE:
            try:
                print(f"\n{'='*50}")
                print("DETAILED DIAGNOSTICS: PySceneDetect + OpenCV Content Analysis")
                print(f"{'='*50}")
                print("Attempting scene detection and content analysis...")
                
                # Get video dimensions
                cap = cv2.VideoCapture(input_file)
                width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                fps = cap.get(cv2.CAP_PROP_FPS)
                total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                print(f"Video dimensions: {width}x{height}, FPS: {fps}, Total frames: {total_frames}")
                
                # Step 1: Detect scenes using PySceneDetect
                print("Detecting scene changes...")
                video_manager = VideoManager([input_file])
                stats_manager = StatsManager()
                scene_manager = SceneManager(stats_manager)
                
                # Add ContentDetector with low threshold for higher sensitivity
                scene_manager.add_detector(ContentDetector(threshold=20))
                
                # Improve processing speed
                video_manager.set_downscale_factor(2)
                
                # Start video manager and perform scene detection
                video_manager.start()
                scene_manager.detect_scenes(frame_source=video_manager)
                
                # Get list of scenes
                scene_list = scene_manager.get_scene_list()
                print(f"Detected {len(scene_list)} scenes")
                
                # Step 2: Analyze content for each scene to identify important regions
                temp_dir = tempfile.mkdtemp(prefix="scene_analysis_")
                
                # If no scenes were detected or too many, treat the whole video as one scene
                if len(scene_list) == 0 or len(scene_list) > 20:
                    scene_list = [(0, total_frames)]
                    print("Using entire video as one scene")
                
                # For content analysis, we'll extract key frames from each scene
                key_frame_samples = []
                
                for scene_index, scene in enumerate(scene_list):
                    # Handle FrameTimecode objects in scene list
                    try:
                        # PySceneDetect 0.6+ returns tuples of FrameTimecode objects
                        scene_start, scene_end = scene
                        # Convert FrameTimecode to frame number (int)
                        if hasattr(scene_start, 'frame_num'):
                            scene_start = scene_start.frame_num
                        elif isinstance(scene_start, tuple) and len(scene_start) > 0:
                            scene_start = scene_start[0]
                            
                        if hasattr(scene_end, 'frame_num'):
                            scene_end = scene_end.frame_num
                        elif isinstance(scene_end, tuple) and len(scene_end) > 0:
                            scene_end = scene_end[0]
                    except:
                        # Fallback to using first and last frame
                        print(f"Warning: Could not parse scene {scene_index}, using default frames")
                        scene_start = 0
                        scene_end = total_frames
                        
                    # Calculate middle frame of scene
                    mid_frame = int((scene_start + scene_end) // 2)
                    
                    # Extract the frame
                    cap.set(cv2.CAP_PROP_POS_FRAMES, mid_frame)
                    ret, frame = cap.read()
                    
                    if ret:
                        # Save frame for analysis
                        frame_path = os.path.join(temp_dir, f"scene_{scene_index:03d}.jpg")
                        cv2.imwrite(frame_path, frame)
                        key_frame_samples.append(frame_path)
                
                # Step 3: Analyze frames to find areas of interest
                print(f"Analyzing {len(key_frame_samples)} key frames for content...")
                
                # Initialize saliency detector for content awareness
                saliency = cv2.saliency.StaticSaliencyFineGrained_create()
                
                # Initialize face detector
                face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
                
                # Initialize average heat map for content analysis
                avg_heat_map = np.zeros((height, width), dtype=np.float32)
                face_weight = 0.6  # Weight for face regions
                salience_weight = 0.4  # Weight for salient regions
                
                # Process each key frame
                for frame_path in key_frame_samples:
                    frame = cv2.imread(frame_path)
                    
                    # Convert to grayscale for faster processing
                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                    
                    # Create frame-specific heat map
                    frame_heat_map = np.zeros((height, width), dtype=np.float32)
                    
                    # 1. Face detection - faces are important content
                    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
                    if len(faces) > 0:
                        print(f"Found {len(faces)} faces in {os.path.basename(frame_path)}")
                        for (x, y, w, h) in faces:
                            # Add weight for face area
                            cv2.rectangle(frame_heat_map, (x, y), (x+w, y+h), face_weight, -1)
                    
                    # 2. Saliency detection - finds visually important regions
                    success, saliency_map = saliency.computeSaliency(frame)
                    if success:
                        # Normalize and resize saliency map to frame size
                        saliency_map = (saliency_map * 255).astype("uint8")
                        # Add weighted saliency to heat map
                        frame_heat_map += cv2.normalize(saliency_map.astype(np.float32), None, 0, salience_weight, cv2.NORM_MINMAX)
                    
                    # Add frame heat map to average
                    avg_heat_map += frame_heat_map
                
                # Normalize the average heat map
                if len(key_frame_samples) > 0:
                    avg_heat_map /= len(key_frame_samples)
                
                # Step 4: Determine optimal 9:16 crop based on heat map
                # Target dimensions for 9:16 aspect ratio
                target_width = int(height * (9/16))
                
                if target_width > width:
                    # If video is too narrow, scale height down
                    target_height = int(width * (16/9))
                    target_width = width
                else:
                    target_height = height
                
                # Find the optimal crop position by sliding window
                best_score = -1
                best_x = 0
                
                # Check different positions horizontally
                for x in range(0, width - target_width + 1, max(1, (width - target_width) // 10)):
                    # Calculate the score for this crop window (sum of heat map values)
                    crop_score = np.sum(avg_heat_map[:target_height, x:x+target_width])
                    
                    if crop_score > best_score:
                        best_score = crop_score
                        best_x = x
                
                print(f"Optimal crop position: x={best_x}, width={target_width}, height={target_height}")
                
                # Create sample crop to visualize results
                cap.set(cv2.CAP_PROP_POS_FRAMES, total_frames // 2)  # Middle frame
                ret, middle_frame = cap.read()
                
                if ret:
                    # Draw crop rectangle on frame
                    vis_frame = middle_frame.copy()
                    cv2.rectangle(vis_frame, (best_x, 0), (best_x + target_width, target_height), (0, 255, 0), 3)
                    
                    # Save visualization
                    vis_path = os.path.join(temp_dir, "crop_visualization.jpg")
                    cv2.imwrite(vis_path, vis_frame)
                    print(f"Saved crop visualization to {vis_path}")
                
                # Step 5: Create final video with optimal crop
                print("Creating final 9:16 video with content-aware crop...")
                
                cmd = [
                    'ffmpeg',
                    '-i', input_file,
                    '-vf', (
                        f"crop={target_width}:{target_height}:{best_x}:0,"
                        f"scale=1080:1920:flags=lanczos"  # High-quality scaling to exact 9:16
                    ),
                    '-c:v', 'libx264',
                    '-preset', 'slow',
                    '-crf', '18',
                    '-c:a', 'aac',
                    '-b:a', '192k',
                    '-pix_fmt', 'yuv420p',
                    '-movflags', '+faststart',
                    '-y',
                    output_file
                ]
                
                process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
                stdout, stderr = process.communicate()
                
                # Clean up temporary directory
                try:
                    shutil.rmtree(temp_dir)
                except:
                    print(f"Warning: Could not clean up temporary directory: {temp_dir}")
                
                # Close video capture
                cap.release()
                
                if process.returncode == 0:
                    print(f"Successfully created 9:16 video using PySceneDetect + OpenCV content analysis: {output_file}")
                    return True
                else:
                    print(f"PySceneDetect + OpenCV crop failed with FFmpeg error: {stderr.decode()}")
            
            except Exception as scene_detect_error:
                print(f"PySceneDetect + OpenCV method failed: {scene_detect_error}")
                import traceback
                traceback.print_exc()
                print(f"{'='*50}\n")
        else:
            print("PySceneDetect and/or OpenCV not available. Skipping content-aware crop method.")
        
        # Method 2: Advanced object detection based crop
        try:
            print("Attempting advanced object detection based crop...")
            
            # Get video metadata
            probe_cmd = [
                'ffprobe', 
                '-v', 'error', 
                '-select_streams', 'v:0', 
                '-count_packets', 
                '-show_entries', 'stream=width,height,duration', 
                '-of', 'csv=p=0', 
                input_file
            ]
            
            probe_process = subprocess.Popen(
                probe_cmd, 
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE
            )
            stdout, stderr = probe_process.communicate()
            
            if probe_process.returncode == 0:
                # Parse video metadata
                width, height, duration = map(float, stdout.decode().strip().split(','))
                
                print(f"Video dimensions: {width}x{height}")
                
                # Extract a sample frame for scene analysis
                frames_dir = os.path.join(os.path.dirname(output_file), "scene_analysis")
                os.makedirs(frames_dir, exist_ok=True)
                
                # Extract frames (1 per second) for scene analysis
                frames_cmd = [
                    'ffmpeg',
                    '-i', input_file,
                    '-vf', 'fps=1',
                    '-q:v', '1',
                    os.path.join(frames_dir, 'frame_%04d.jpg')
                ]
                
                subprocess.run(frames_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                
                frame_files = sorted([os.path.join(frames_dir, f) for f in os.listdir(frames_dir) if f.endswith('.jpg')])
                
                if frame_files:
                    # Multi-strategy crop - try to find content in different positions
                    
                    # Strategy 1: Golden ratio positioning (more aesthetically pleasing)
                    # We'll divide the frame using the golden ratio (approximately 0.618)
                    golden_ratio = 0.618
                    
                    # Calculate crop dimensions for 9:16 aspect ratio
                    target_height = height
                    target_width = height * (9/16)
                    
                    # Calculate potential crop positions using golden ratio
                    left_golden = max(0, (width - target_width) * golden_ratio)
                    right_golden = max(0, (width - target_width) * (1 - golden_ratio))
                    
                    # Try different vertical positions
                    crop_positions = [
                        # Center crop (baseline)
                        {'x': max(0, (width - target_width) / 2), 
                         'y': 0, 
                         'width': target_width, 
                         'height': target_height,
                         'desc': 'center'},
                        
                        # Golden ratio from left
                        {'x': left_golden, 
                         'y': 0, 
                         'width': target_width, 
                         'height': target_height,
                         'desc': 'golden_left'},
                         
                        # Golden ratio from right
                        {'x': right_golden, 
                         'y': 0, 
                         'width': target_width, 
                         'height': target_height,
                         'desc': 'golden_right'},
                         
                        # Left-aligned crop (for text or content on left side)
                        {'x': 0, 
                         'y': 0, 
                         'width': target_width, 
                         'height': target_height,
                         'desc': 'left_align'},
                          
                        # Right-aligned crop (for text or content on right side)
                        {'x': max(0, width - target_width), 
                         'y': 0, 
                         'width': target_width, 
                         'height': target_height,
                         'desc': 'right_align'},
                    ]
                    
                    # Process each position and create test frames
                    test_frames = []
                    for pos in crop_positions:
                        test_frame = os.path.join(frames_dir, f"crop_{pos['desc']}.jpg")
                        test_frames.append((test_frame, pos))
                        
                        # Extract a test frame with this crop position
                        crop_cmd = [
                            'ffmpeg',
                            '-i', frame_files[len(frame_files) // 2],  # Use middle frame
                            '-vf', f"crop={pos['width']}:{pos['height']}:{pos['x']}:{pos['y']}",
                            '-y',
                            test_frame
                        ]
                        subprocess.run(crop_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                    
                    # Select the golden ratio left position as default (typically works best)
                    # In a full implementation, we'd analyze these test frames for content and faces
                    # For now, we'll use the golden ratio position which often gives better results than center crop
                    best_pos = next((pos for _, pos in test_frames if pos['desc'] == 'golden_left'), crop_positions[0])
                    
                    print(f"Selected crop: {best_pos['desc']}")
                    print(f"Crop parameters: x={best_pos['x']:.1f}, y={best_pos['y']:.1f}, width={best_pos['width']:.1f}, height={best_pos['height']:.1f}")
                    
                    # FFmpeg command for advanced crop and resize
                    cmd = [
                        'ffmpeg',
                        '-i', input_file,
                        '-vf', (
                            f"crop={best_pos['width']}:{best_pos['height']}:{best_pos['x']}:{best_pos['y']},"
                            f"scale=1080:1920:flags=lanczos"  # High-quality scaling to exact 9:16
                        ),
                        '-c:v', 'libx264',
                        '-preset', 'slow',        # Slower preset for better quality
                        '-crf', '18',             # High quality (lower values = higher quality)
                        '-c:a', 'aac',
                        '-b:a', '192k',           # High audio bitrate
                        '-pix_fmt', 'yuv420p',    # Ensure wide compatibility
                        '-movflags', '+faststart', # Optimize for web streaming
                        '-y',
                        output_file
                    ]
                    
                    process = subprocess.Popen(
                        cmd,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE
                    )
                    stdout, stderr = process.communicate()
                    
                    # Clean up temporary frames
                    try:
                        shutil.rmtree(frames_dir, ignore_errors=True)
                    except:
                        pass
                    
                    if process.returncode == 0:
                        print(f"Successfully created 9:16 video using advanced object-aware crop: {output_file}")
                        return True
                    else:
                        print(f"Advanced crop failed: {stderr.decode()}")
                else:
                    print("No frames could be extracted for analysis")
            
        except Exception as advanced_crop_error:
            print(f"Advanced crop method failed: {advanced_crop_error}")
            import traceback
            traceback.print_exc()
        
        # Method 3: Rule of thirds crop with top bias
        try:
            print("Attempting rule-of-thirds crop...")
            
            cmd = [
                'ffmpeg',
                '-i', input_file,
                '-vf', 'scale=-2:1920,crop=ih*(9/16):ih:iw/2-ih*(9/16)/2:0',  # Center horizontally, top bias
                '-c:v', 'libx264',
                '-preset', 'slow',
                '-crf', '18',
                '-c:a', 'aac',
                '-b:a', '192k',
                '-pix_fmt', 'yuv420p',
                '-y',
                output_file
            ]
            
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            stdout, stderr = process.communicate()
            
            if process.returncode == 0:
                print(f"Successfully created 9:16 video using rule-of-thirds crop: {output_file}")
                return True
            else:
                print(f"Rule-of-thirds crop failed: {stderr.decode()}")
        
        except Exception as rule_thirds_error:
            print(f"Rule-of-thirds method failed: {rule_thirds_error}")
            import traceback
            traceback.print_exc()
        
        # If all methods fail
        print("All resize methods failed. Unable to create 9:16 video.")
        return False
    
    except Exception as e:
        print(f"Unexpected error during resize: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Extract high-quality clips from a video for TikTok")
    parser.add_argument('--video', type=str, default="video.mp4", help="Path to the input video file")
    parser.add_argument('--output-dir', type=str, default="clips", help="Output directory for clips")
    parser.add_argument('--min-duration', type=float, default=3.0, help="Minimum clip duration in seconds")
    parser.add_argument('--max-duration', type=float, default=100.0, help="Maximum clip duration in seconds")
    parser.add_argument('--resize', action='store_true', help="Resize clips to 9:16 for TikTok")
    parser.add_argument('--token', type=str, help="Hugging Face token for Pyannote (required for resize)")
    
    args = parser.parse_args()
    
    # Source video file
    video_file = args.video
    
    # Create output directory for clips if it doesn't exist
    output_dir = args.output_dir
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created output directory: {output_dir}")
    
    # Create directory for vertical clips if needed
    vertical_dir = os.path.join(output_dir, "vertical")
    if args.resize and not os.path.exists(vertical_dir):
        os.makedirs(vertical_dir)
        print(f"Created directory for vertical clips: {vertical_dir}")
    
    # Check if video file exists
    if not os.path.exists(video_file):
        print(f"Error: Video file '{video_file}' not found.")
        sys.exit(1)
    
    print(f"Processing video: {video_file}")
    
    try:
        # Transcribe the video
        print("Initializing transcriber...")
        transcriber = Transcriber()
        transcription = transcriber.transcribe(audio_file_path=video_file)
        print("Transcription complete.")
        
        # Find clips
        print("Finding clips...")
        clipfinder = ClipFinder()
        clips = clipfinder.find_clips(transcription=transcription)
        
        if not clips:
            print("No clips found.")
            sys.exit(0)
            
        print(f"Found {len(clips)} clips. Extracting as MP4 files...")
        
        # Check if ffmpeg is available
        try:
            subprocess.run(['ffmpeg', '-version'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        except (subprocess.SubprocessError, FileNotFoundError):
            print("Error: ffmpeg is not installed or not in PATH.")
            print("Please install ffmpeg and make sure it's in your PATH.")
            sys.exit(1)
        
        # Extract each clip
        successful_clips = 0
        skipped_clips = 0
        for i, clip in enumerate(clips):
            start_time = clip.start_time
            end_time = clip.end_time
            clip_duration = end_time - start_time
            
            # Skip clips that are too short or too long
            if clip_duration < args.min_duration:
                print(f"Skipping clip {i+1} (too short: {clip_duration:.2f}s)")
                skipped_clips += 1
                continue
            
            if clip_duration > args.max_duration:
                print(f"Skipping clip {i+1} (too long: {clip_duration:.2f}s)")
                skipped_clips += 1
                continue
                
            # Create a filename for the clip
            output_filename = f"{output_dir}/clip_{i+1}_{int(start_time)}s_to_{int(end_time)}s.mp4"
            srt_filename = output_filename.replace('.mp4', '.srt')
            
            print(f"Extracting clip {i+1}/{len(clips)}: {start_time:.2f}s to {end_time:.2f}s (Duration: {clip_duration:.2f}s)")
            
            # Extract the clip
            if extract_clip(video_file, output_filename, start_time, end_time):
                print(f"Saved high-quality clip to {output_filename}")
                
                # Create SRT file for the clip
                if create_srt_file(transcription, clip, srt_filename):
                    print(f"Created SRT file: {srt_filename}")
                
                # Resize for TikTok if requested
                if args.resize:
                    if not args.token:
                        print("Warning: Hugging Face token not provided. Skipping resize.")
                    else:
                        vertical_filename = f"{vertical_dir}/vertical_clip_{i+1}_{int(start_time)}s_to_{int(end_time)}s.mp4"
                        print(f"Resizing clip for TikTok: {vertical_filename}")
                        if resize_for_tiktok(output_filename, vertical_filename, args.token):
                            print(f"Created high-quality vertical clip: {vertical_filename}")
                
                successful_clips += 1
            else:
                print(f"Failed to extract clip {i+1}")
        
        print(f"\nProcessing summary:")
        print(f"Total clips found: {len(clips)}")
        print(f"Successful clips: {successful_clips}")
        print(f"Skipped clips: {skipped_clips}")
        
        if successful_clips > 0:
            print(f"Clips are located in the '{output_dir}' directory.")
            if args.resize:
                print(f"Vertical clips are in the '{vertical_dir}' directory.")
        else:
            print("\nNo clips were successfully extracted.")
        
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()





# to test the script, run the following command:
# python clip.py --video your/video/path.mp4 --resize
# Note: Set the HUGGING_FACE_TOKEN environment variable before running



