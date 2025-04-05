
import { useState } from "react";
import { Search, Download } from "lucide-react";
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
  
  // Function to handle song search and download
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
      // Download song using the utility function
      const songFile = await downloadSongByName(songName);
      
      if (songFile) {
        loadAudio(songFile);
        toast({
          title: "Success",
          description: `"${songName}" has been added to your player`,
        });
        setSongName("");
      }
    } catch (error) {
      console.error("Error downloading song:", error);
      toast({
        title: "Error",
        description: "Could not find or download this song",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-card">
      <h3 className="text-lg font-medium mb-4">Search for a Song</h3>
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Enter song name..."
          value={songName}
          onChange={(e) => setSongName(e.target.value)}
          className="flex-1"
          disabled={isLoading}
        />
        <Button 
          onClick={handleSearch} 
          disabled={isLoading || !songName.trim()}
          className="bg-primary"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
              <span>Loading...</span>
            </div>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              <span>Search</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SongSearch;
