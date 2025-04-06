
"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAudio } from "@/context/AudioContext";
import { formatTime } from "@/lib/utils";
import { 
  Play, 
  Pause, 
  Music, 
  Volume2, 
  Download, 
  Share2, 
  Heart, 
  BarChart2, 
  Waves, 
  CircleDashed 
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/context/UserContext";
import { useState } from "react";
import AudioVisualization from "./AudioVisualization";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EnhancedAudioPlayer = () => {
  const {
    isPlaying,
    togglePlayPause,
    currentTime,
    duration,
    progress,
    seekTo,
    effects,
    toggleEffect,
    playbackRate,
    setPlaybackRate,
    fileName,
    audioSrc,
    savedAudioFiles,
    loadSavedAudio,
  } = useAudio();

  const { user, isLoggedIn, addToFavorites } = useUser();
  
  const [visualizationType, setVisualizationType] = useState<"bars" | "wave" | "circle">("bars");
  const [showVisualization, setShowVisualization] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState("");
  
  // Check if current song is in favorites
  const isFavorited = isLoggedIn && fileName && user?.favorites.includes(fileName);

  // Handle download
  const handleDownload = async () => {
    if (!audioSrc) {
      toast({
        title: "No audio loaded",
        description: "Please load a song before downloading",
        variant: "destructive",
      });
      return;
    }
    
    try {
      toast({
        title: "Downloading...",
        description: "Preparing your download",
      });
      
      const downloadUrl = `/api/download-song?url=${encodeURIComponent(audioSrc)}`;
      window.open(downloadUrl, "_blank");
      
      setTimeout(() => {
        toast({
          title: "Download started",
          description: "Your file should begin downloading",
        });
      }, 1500);
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: "There was an error downloading the file",
        variant: "destructive",
      });
    }
  };

  // Handle share
  const handleShare = () => {
    if (!fileName) {
      toast({
        title: "No song to share",
        description: "Please load a song first",
        variant: "destructive",
      });
      return;
    }
    
    if (navigator.share) {
      navigator.share({
        title: `Check out this lo-fi track: ${fileName}`,
        text: "I'm listening to this great lo-fi track on LofiFy!",
        url: window.location.href,
      })
      .then(() => {
        toast({
          title: "Shared successfully",
          description: "Thanks for sharing LofiFy!",
        });
      })
      .catch((error) => {
        console.error("Share error:", error);
      });
    } else {
      const shareUrl = window.location.href;
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied",
        description: "Share link copied to clipboard",
      });
    }
  };

  // Handle add to favorites
  const handleToggleFavorite = () => {
    if (!isLoggedIn) {
      toast({
        title: "Login required",
        description: "Please log in to add favorites",
        variant: "destructive",
      });
      return;
    }
    
    if (!fileName) {
      toast({
        title: "No song selected",
        description: "Please load a song first",
        variant: "destructive",
      });
      return;
    }
    
    addToFavorites(fileName);
    toast({
      title: "Added to favorites",
      description: `"${fileName}" added to your favorites`,
    });
  };

  // Handle add to playlist
  const handleAddToPlaylist = () => {
    if (!selectedPlaylist || !fileName) return;
    
    const { addToPlaylist } = useUser();
    addToPlaylist(selectedPlaylist, {
      title: fileName,
      artist: "Unknown",
      downloadLink: audioSrc,
    });
    
    toast({
      title: "Added to playlist",
      description: `"${fileName}" added to playlist`,
    });
  };

  // Handle visualization type change
  const handleVisualizationChange = (type: "bars" | "wave" | "circle") => {
    setVisualizationType(type);
  };

  // Handle saved audio selection
  const handleSavedAudioSelect = (index: number) => {
    const savedFile = savedAudioFiles[index];
    if (savedFile) {
      loadSavedAudio(savedFile.src, savedFile.name);
    }
  };

  return (
    <div className="rounded-xl p-6 bg-card shadow-lg border border-primary/10 animate-border-glow">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 mr-4 bg-primary/20 rounded-full flex items-center justify-center vinyl-record animate-spin-slow">
            <Music className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-medium truncate max-w-[180px] md:max-w-[200px]">
              {fileName || "No file loaded"}
            </h3>
            <div className="text-xs text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        </div>
        <Button
          size="icon"
          variant="outline"
          className="rounded-full h-12 w-12 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={togglePlayPause}
          disabled={!fileName}
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 ml-0.5" />
          )}
        </Button>
      </div>

      {savedAudioFiles.length > 0 && (
        <div className="mb-4">
          <Select onValueChange={(value) => handleSavedAudioSelect(parseInt(value))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select saved audio" />
            </SelectTrigger>
            <SelectContent>
              {savedAudioFiles.map((file, index) => (
                <SelectItem key={index} value={index.toString()}>{file.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="mb-6">
        <Slider
          value={[progress]}
          max={100}
          step={0.1}
          onValueChange={([value]) => seekTo(value)}
          disabled={!fileName}
          className="my-4"
        />
      </div>

      <div className="flex justify-between items-center mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowVisualization(!showVisualization)}
          disabled={!fileName}
        >
          <BarChart2 className="h-4 w-4 mr-2" />
          {showVisualization ? "Hide Visualization" : "Show Visualization"}
        </Button>
        
        {showVisualization && (
          <Select 
            value={visualizationType} 
            onValueChange={(value) => handleVisualizationChange(value as "bars" | "wave" | "circle")}
          >
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder="Visualization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bars">
                <div className="flex items-center">
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Bars
                </div>
              </SelectItem>
              <SelectItem value="wave">
                <div className="flex items-center">
                  <Waves className="h-4 w-4 mr-2" />
                  Wave
                </div>
              </SelectItem>
              <SelectItem value="circle">
                <div className="flex items-center">
                  <CircleDashed className="h-4 w-4 mr-2" />
                  Circle
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {showVisualization && (
        <div className="mb-4">
          <AudioVisualization visualizationType={visualizationType} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="lofi-mode" className="cursor-pointer">Lo-fi Mode</Label>
          <Switch
            id="lofi-mode"
            checked={effects.isLofiMode}
            onCheckedChange={() => toggleEffect("isLofiMode")}
            disabled={!fileName}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="vinyl-crackle" className="cursor-pointer">Vinyl Crackle</Label>
          <Switch
            id="vinyl-crackle"
            checked={effects.isVinylCrackle}
            onCheckedChange={() => toggleEffect("isVinylCrackle")}
            disabled={!fileName}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="reverb" className="cursor-pointer">Reverb</Label>
          <Switch
            id="reverb"
            checked={effects.isReverbOn}
            onCheckedChange={() => toggleEffect("isReverbOn")}
            disabled={!fileName}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="slowed" className="cursor-pointer">Slowed Down</Label>
          <Switch
            id="slowed"
            checked={effects.isSlowedDown}
            onCheckedChange={() => toggleEffect("isSlowedDown")}
            disabled={!fileName}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="jazz-mode" className="cursor-pointer">Jazz Mode</Label>
          <Switch
            id="jazz-mode"
            checked={effects.isJazzMode}
            onCheckedChange={() => toggleEffect("isJazzMode")}
            disabled={!fileName}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <Volume2 className="h-4 w-4 text-muted-foreground mr-1" />
        <Label className="text-xs text-muted-foreground w-24">Playback Speed</Label>
        <Slider
          value={[playbackRate * 100]}
          min={50}
          max={100}
          step={5}
          onValueChange={([value]) => setPlaybackRate(value / 100)}
          disabled={!fileName}
          className="flex-1"
        />
        <span className="text-xs w-8 text-right">{Math.round(playbackRate * 100)}%</span>
      </div>

      <div className="flex justify-between mt-4">
        <div className="flex space-x-2">
          <Button 
            variant={isFavorited ? "secondary" : "outline"}
            size="icon" 
            onClick={handleToggleFavorite}
            disabled={!fileName || !isLoggedIn}
            className={isFavorited ? "bg-primary/20" : ""}
          >
            <Heart className={`h-4 w-4 ${isFavorited ? "fill-current text-primary" : ""}`} />
          </Button>
          
          {isLoggedIn && user?.playlists && user.playlists.length > 0 ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" disabled={!fileName}>
                  <Music className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-52">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Add to Playlist</h4>
                  <Select value={selectedPlaylist} onValueChange={setSelectedPlaylist}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select playlist" />
                    </SelectTrigger>
                    <SelectContent>
                      {user.playlists.map((playlist) => (
                        <SelectItem key={playlist.id} value={playlist.id}>
                          {playlist.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    size="sm" 
                    className="w-full" 
                    disabled={!selectedPlaylist || !fileName}
                    onClick={handleAddToPlaylist}
                  >
                    Add
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          ) : null}
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleShare}
            disabled={!fileName}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleDownload}
            disabled={!fileName}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAudioPlayer;
