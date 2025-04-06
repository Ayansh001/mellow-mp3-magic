import { useState } from "react";
import { Search, Download, Music } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAudio } from "@/context/AudioContext";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// Define the song result type
interface SongResult {
  id: string;
  title: string;
  artist: string;
  songPageUrl: string;
  downloadLink: string;
}

const SongSearch = () => {
  const [songName, setSongName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SongResult[]>([]);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const { loadAudio } = useAudio();
  const { toast } = useToast();
  
  // Function to handle song search from PagalFree.com
  const handleSearch = async () => {
    if (!songName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a song name",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    setSearchResults([]);
    
    try {
      // Show searching notification
      toast({
        title: "Searching",
        description: `Searching for "${songName}" on PagalFree.com...`,
      });
      
      // Call backend API to search for songs
      const response = await fetch(`/api/search-song?q=${encodeURIComponent(songName)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to search for songs: ${response.statusText}`);
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("API returned invalid response format. Expected JSON.");
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setSearchResults(data.results || []);
      
      if (data.results && data.results.length > 0) {
        toast({
          title: "Success",
          description: `Found ${data.results.length} songs for "${songName}"`,
        });
      } else {
        toast({
          title: "No Results",
          description: `No songs found for "${songName}"`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error searching song:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not search for songs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to download and load a song
  const handleDownloadSong = async (song: SongResult) => {
    if (!song.downloadLink) {
      toast({
        title: "Error",
        description: "Download link not available for this song",
        variant: "destructive",
      });
      return;
    }
    
    setIsDownloading(song.id);
    
    try {
      toast({
        title: "Downloading",
        description: `Downloading "${song.title}"...`,
      });
      
      // Call backend API to download the song
      const response = await fetch(`/api/download-song?url=${encodeURIComponent(song.downloadLink)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to download song: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const fileName = `${song.title} - ${song.artist}.mp3`;
      
      // Create a File object from the blob
      const file = new File([blob], fileName, { type: 'audio/mpeg' });
      
      // Load the file into the audio player
      loadAudio(file);
      
      toast({
        title: "Success",
        description: `"${song.title}" has been added to your player`,
      });
    } catch (error) {
      console.error("Error downloading song:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not download the song. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-card">
      <h3 className="text-lg font-medium mb-2">Search for a Song</h3>
      <p className="text-xs text-muted-foreground mb-4 flex items-center">
        <Music className="mr-1 h-3 w-3" /> 
        Powered by PagalFree.com
      </p>
      
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input
          placeholder="Enter song name or artist..."
          value={songName}
          onChange={(e) => setSongName(e.target.value)}
          className="flex-1"
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && songName.trim() && !isLoading) {
              handleSearch();
            }
          }}
        />
        <Button 
          onClick={handleSearch} 
          disabled={isLoading || !songName.trim()}
          className="bg-primary flex-shrink-0"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
              <span>Searching...</span>
            </div>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              <span>Search</span>
            </>
          )}
        </Button>
      </div>
      
      {/* Search Results */}
      {isLoading ? (
        <div className="space-y-2 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-md">
              <div className="space-y-1">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      ) : searchResults.length > 0 ? (
        <div className="space-y-2 mt-4 max-h-64 overflow-y-auto pr-1">
          {searchResults.map((song) => (
            <div key={song.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/50 transition-colors">
              <div>
                <p className="font-medium">{song.title}</p>
                <p className="text-xs text-muted-foreground">{song.artist}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="ml-2"
                onClick={() => handleDownloadSong(song)}
                disabled={isDownloading === song.id}
              >
                {isDownloading === song.id ? (
                  <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-primary animate-spin"></div>
                ) : (
                  <>
                    <Download className="mr-1 h-4 w-4" />
                    <span>Download</span>
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      ) : null}
      
      {/* No Results Message */}
      {!isLoading && searchResults.length === 0 && songName.trim() !== "" && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No songs found. Try a different search term.</p>
        </div>
      )}
    </div>
  );
};

export default SongSearch;
