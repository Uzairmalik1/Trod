/**
 * Utility functions for handling file paths consistently across the application
 */

/**
 * Converts a Windows or system file path to a proper web URL path
 * 
 * @param filePath The file path from the system (like C:\path\to\file or /path/to/file)
 * @returns A normalized web path for use in URLs
 */
export function filePathToWebPath(filePath: string | null): string {
  if (!filePath) return '';

  // Handle Windows paths
  if (filePath.includes('\\')) {
    // Extract the part after 'public\' and convert to web format
    const parts = filePath.split('public\\');
    if (parts.length > 1) {
      return `/${parts[1].replace(/\\/g, '/')}`;
    }
    
    // If 'public' is not in the path, just convert backslashes to forward slashes
    return `/${filePath.replace(/\\/g, '/')}`;
  }
  
  // Handle Unix paths
  if (filePath.includes('/public/')) {
    const parts = filePath.split('/public/');
    if (parts.length > 1) {
      return `/${parts[1]}`;
    }
  }
  
  // Ensure path starts with a slash
  return filePath.startsWith('/') ? filePath : `/${filePath}`;
}

/**
 * Format URL or file path for proper display in browser
 * 
 * @param url URL path that may be stored in the database
 * @param filePath Optional file system path if URL doesn't work
 * @returns A properly formatted URL for web browser access
 */
export function formatVideoUrl(url: string | null, filePath: string | null = null): string {
  // Handle null/undefined cases for both params
  if (!url && !filePath) return '';
  
  // Try using the file path first if available
  if (filePath) {
    const webPath = filePathToWebPath(filePath);
    console.log(`Converted file path to web path: ${filePath} -> ${webPath}`);
    return webPath;
  }
  
  if (!url) return '';
  
  // Handle URLs that are already absolute
  if (url.startsWith('http')) {
    return url;
  }
  
  // Handle subtitle paths - match both format patterns
  if (url.endsWith('.srt')) {
    // Extract the clip ID and index for better logging
    const clipIdMatch = url.match(/clip-([a-zA-Z0-9]+)(?:-(\d+))?\.srt/) ||
                       url.match(/clip_(\d+)(?:_\d+s_to_\d+s)?\.srt/);
                       
    const clipId = clipIdMatch ? clipIdMatch[1] : 'unknown';
    const clipIndex = clipIdMatch && clipIdMatch[2] ? clipIdMatch[2] : 'unknown';
    
    // Just ensure it starts with a slash
    const formattedUrl = url.startsWith('/') ? url : `/${url}`;
    console.log(`Processing subtitle path: ${url} -> ${formattedUrl} (clipId: ${clipId}, index: ${clipIndex})`);
    return formattedUrl;
  }
  
  // Handle thumbnails paths
  if (url.includes('/thumbnails/') || url.includes('\\thumbnails\\')) {
    const formattedUrl = url.startsWith('/') ? url : `/${url}`;
    console.log(`Formatted thumbnails URL: ${url} -> ${formattedUrl}`);
    return formattedUrl;
  }
  
  // Handle URLs that start with /uploads
  if (url.startsWith('/uploads/')) {
    return url;
  }
  
  // Handle URLs that start with uploads/ (no leading slash)
  if (url.startsWith('uploads/')) {
    return `/${url}`;
  }
  
  // Handle paths that are just file names (add uploads prefix)
  if (!url.includes('/') && (url.endsWith('.mp4') || url.endsWith('.srt') || url.endsWith('.webm'))) {
    return `/uploads/${url}`;
  }
  
  // Handle other paths
  const formattedUrl = url.startsWith('/') ? url : `/${url}`;
  console.log(`Formatted URL: ${url} -> ${formattedUrl}`);
  return formattedUrl;
} 