
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds === Infinity) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Function to download a song by name from pagalfree.com
export async function downloadSongByName(songName: string): Promise<File | null> {
  try {
    // Show that we're attempting to download from pagalfree.com
    console.log(`Attempting to download "${songName}" from pagalfree.com`);
    
    // Note: This is a mock implementation as we cannot directly fetch from pagalfree.com
    // due to CORS restrictions and the need for server-side proxying
    
    // In a real implementation, you would need a backend server to:
    // 1. Search pagalfree.com for the song
    // 2. Extract the download link
    // 3. Download the file
    // 4. Return it to the frontend
    
    // For demonstration purposes, we'll create a mock audio file
    // Simulating API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Create a mock audio file to simulate the download
    // In a real app, this would be the actual downloaded MP3 file
    const response = await fetch('/placeholder.svg'); // Using placeholder as mock data
    const blob = await response.blob();
    
    // Create a File object from the blob with the song name
    const file = new File([blob], `${songName} - PagalFree.mp3`, { type: 'audio/mpeg' });
    
    console.log(`Successfully "downloaded" ${songName} (mock implementation)`);
    
    return file;
    
    /* REAL IMPLEMENTATION WOULD BE LIKE:
    
    // This would require a backend proxy or serverless function due to CORS restrictions
    const backendUrl = 'https://your-backend-server.com/api/download-song';
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songName, source: 'pagalfree.com' })
    });
    
    if (!response.ok) {
      throw new Error('Failed to download song');
    }
    
    const songBlob = await response.blob();
    return new File([songBlob], `${songName} - PagalFree.mp3`, { type: 'audio/mpeg' });
    
    */
  } catch (error) {
    console.error("Error downloading song:", error);
    return null;
  }
}
