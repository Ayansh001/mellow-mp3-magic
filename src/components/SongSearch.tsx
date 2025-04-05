
import { useState } from "react";
import { Search, Download, Music } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAudio } from "@/context/AudioContext";
import { useToast } from "@/components/ui/use-toast";
import { downloadSongByName } from "@/lib/utils";

const SongSearch = () => {
  const [songName, setSongName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { loadAudio } = useAudio();
  const { toast } = useToast();
  
  // Function to handle song search and download from pagalfree.com
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
    
    try {
      // Show downloading notification
      toast({
        title: "Downloading",
        description: `Searching for "${songName}" on PagalFree.com...`,
      });
      
      // Download song using the utility function
      const songFile = await downloadSongByName(songName);
      
      if (songFile) {
        loadAudio(songFile);
        toast({
          title: "Success",
          description: `"${songName}" has been added to your player`,
        });
        setSongName("");
      } else {
        toast({
          title: "Error",
          description: "Could not find this song on PagalFree.com",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error downloading song:", error);
      toast({
        title: "Error",
        description: "Could not download the song. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-card">
      <h3 className="text-lg font-medium mb-2">Search for a Song</h3>
      <p className="text-xs text-muted-foreground mb-4 flex items-center">
        <Music className="mr-1 h-3 w-3" /> 
        Powered by PagalFree.com
      </p>
      
      <div className="flex flex-col sm:flex-row gap-2">
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
              <Download className="mr-2 h-4 w-4" />
              <span>Get Song</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SongSearch;
