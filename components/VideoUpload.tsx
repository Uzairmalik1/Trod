import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, UploadCloud, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface VideoUploadProps {
  onClose: () => void;
  onUploadSuccess?: (video: any) => void;
}

export default function VideoUpload({ onClose, onUploadSuccess }: VideoUploadProps) {
  const [youtubeLink, setYoutubeLink] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const router = useRouter();

  // Handle YouTube link import
  const handleImportYoutube = () => {
    if (youtubeLink.trim() !== '') {
      router.push(`/edit?video=${encodeURIComponent(youtubeLink)}`);
      onClose();
    }
  };

  // Handle file upload to our API
  const handleFileUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title || selectedFile.name);
      formData.append('description', description);

      // First try the debug endpoint
      try {
        // Create a new FormData for the debug endpoint
        const debugFormData = new FormData();
        debugFormData.append('file', selectedFile);
        debugFormData.append('title', title || selectedFile.name);
        debugFormData.append('description', description);
        
        const debugResponse = await fetch('/api/debug/upload', {
          method: 'POST',
          body: debugFormData,
        });
        
        console.log('Debug upload status:', debugResponse.status);
        
        // Handle debug response
        if (!debugResponse.ok) {
          const debugText = await debugResponse.text();
          console.error('Debug upload error:', debugText);
          setUploadError(`Debug upload failed: ${debugResponse.status} ${debugText}`);
          setIsUploading(false);
          return;
        }
        
        const debugData = await debugResponse.json();
        console.log('Debug upload successful:', debugData);
        
        // If debug succeeded, try the main upload
        const mainResponse = await fetch('/api/videos/upload', {
          method: 'POST',
          body: formData,
        });
        
        console.log('Main upload response status:', mainResponse.status);
        
        // First, get the response text so we can log it and analyze any issues
        const responseText = await mainResponse.text();
        console.log('Raw response:', responseText);
        
        // If the response is not ok, handle the error
        if (!mainResponse.ok) {
          if (responseText) {
            try {
              // Try to parse as JSON
              const errorData = JSON.parse(responseText);
              throw new Error(errorData.error || 'Upload failed');
            } catch (parseError) {
              // If parsing fails, use the raw text
              throw new Error(`Upload failed: ${mainResponse.status} - ${responseText || 'No error details'}`);
            }
          } else {
            throw new Error(`Upload failed with status ${mainResponse.status}`);
          }
        }
        
        // Try to parse the response as JSON
        let data;
        try {
          if (!responseText) {
            throw new Error('Empty response received');
          }
          
          data = JSON.parse(responseText);
          
          if (!data || !data.video || !data.video.id) {
            throw new Error('Invalid response format: missing video data');
          }
        } catch (parseError: any) {
          console.error('Error parsing response:', parseError);
          setUploadError(`Error parsing response: ${parseError.message}`);
          setIsUploading(false);
          return;
        }
        
        // Success handling
        if (onUploadSuccess) {
          onUploadSuccess(data.video);
        }
        
        // Start processing the video
        try {
          const processResponse = await fetch(`/api/videos/${data.video.id}/process`, {
            method: 'POST',
          });
          
          if (!processResponse.ok) {
            console.warn(`Process request returned status ${processResponse.status}`);
          }
        } catch (processError: any) {
          console.error('Process error (continuing):', processError);
        }
        
        setIsUploading(false);
        onClose();
        router.push(`/home?upload=success&id=${data.video.id}`);
        router.refresh();
      } catch (error: any) {
        console.error('Upload processing error:', error);
        setUploadError(error.message || 'Upload processing failed');
        setIsUploading(false);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Upload failed');
      setIsUploading(false);
    }
  };

  // Handle File Drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      setTitle(file.name);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': [] },
    multiple: false,
  });

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white shadow-md rounded-lg p-6 w-[500px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Import Video</h3>
          <button onClick={onClose} disabled={isUploading}>
            <X size={20} className="text-gray-500 hover:text-gray-800" />
          </button>
        </div>

        {/* YouTube Import Section */}
        <div className="mt-4">
          <label className="text-gray-600 font-medium">Paste YouTube Link</label>
          <input
            type="text"
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full border p-2 mt-2 rounded-md"
            value={youtubeLink}
            onChange={(e) => setYoutubeLink(e.target.value)}
          />
          <button
            onClick={handleImportYoutube}
            className="w-full bg-blue-500 text-white mt-2 py-2 rounded-md hover:bg-blue-600 transition"
            disabled={isUploading || !youtubeLink.trim()}
          >
            Import from YouTube
          </button>
        </div>

        {/* OR Divider */}
        <div className="flex items-center my-4">
          <hr className="flex-grow border-gray-300" />
          <span className="mx-2 text-gray-500">OR</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        {/* Drag & Drop Upload Section */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed ${
            isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-400'
          } p-6 rounded-md text-center cursor-pointer hover:bg-gray-100 transition ${
            isUploading ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          <input {...getInputProps()} disabled={isUploading} />
          {isDragActive ? (
            <p className="text-gray-700">Drop the file here...</p>
          ) : (
            <div>
              <UploadCloud size={40} className="mx-auto text-gray-500" />
              <p className="text-gray-700">Drag & Drop a video file</p>
              <p className="text-gray-500">or click to select a file</p>
            </div>
          )}
        </div>

        {/* Selected File Info */}
        {selectedFile && (
          <div className="mt-4 p-3 bg-gray-100 rounded-md">
            <p className="font-medium">{selectedFile.name}</p>
            <p className="text-sm text-gray-500">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        )}

        {/* Video Details Form */}
        {selectedFile && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-gray-600 font-medium mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border p-2 rounded-md"
                placeholder="Video title"
              />
            </div>
            
            <div>
              <label className="block text-gray-600 font-medium mb-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border p-2 rounded-md h-20 resize-none"
                placeholder="Video description"
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {uploadError && (
          <div className="mt-4 p-2 bg-red-50 text-red-600 rounded-md">
            {uploadError}
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-center text-sm mt-1">Uploading... {uploadProgress}%</p>
          </div>
        )}

        {/* Upload Button */}
        {selectedFile && (
          <button
            onClick={handleFileUpload}
            disabled={isUploading}
            className="w-full bg-green-500 text-white mt-4 py-2 rounded-md hover:bg-green-600 transition flex items-center justify-center"
          >
            {isUploading ? (
              <>
                <Loader2 size={20} className="animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              'Upload Video'
            )}
          </button>
        )}
      </div>
    </div>
  );
} 