
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

// Function to download a song by name
export async function downloadSongByName(songName: string): Promise<File | null> {
  try {
    // For demonstration purposes, we're using a free music API
    // In a production app, you would use a proper music service API with appropriate licensing
    const apiUrl = `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(songName)}&fields=name,previews&token=YOUR_API_KEY`;
    
    // This is a mock implementation to demonstrate the functionality
    // In a real implementation, you would connect to a music API service
    
    // Simulating API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Create a mock audio file for demonstration
    // In a real app, you would fetch the actual file from an API
    const response = await fetch('/placeholder.svg'); // Using placeholder as mock data
    const blob = await response.blob();
    
    // Create a File object from the blob with the song name
    const file = new File([blob], `${songName}.mp3`, { type: 'audio/mpeg' });
    
    return file;
    
    /* REAL IMPLEMENTATION WOULD BE LIKE:
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const firstResult = data.results[0];
      const audioUrl = firstResult.previews['preview-hq-mp3'];
      
      const audioResponse = await fetch(audioUrl);
      const audioBlob = await audioResponse.blob();
      
      return new File([audioBlob], `${firstResult.name}.mp3`, { type: 'audio/mpeg' });
    }
    */
    
  } catch (error) {
    console.error("Error downloading song:", error);
    return null;
  }
}
