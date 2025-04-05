
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAudio } from "@/context/AudioContext";
import { Play, Pause, Music, Volume2 } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const AudioPlayer = () => {
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
  } = useAudio();

  return (
    <div className="rounded-xl p-6 bg-card shadow-lg border border-primary/10 animate-border-glow">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 mr-4 bg-primary/20 rounded-full flex items-center justify-center vinyl-record animate-spin-slow">
            <Music className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-medium truncate max-w-[200px]">
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

      <div className="mb-6">
        <Slider
          value={[progress]}
          max={100}
          step={0.1}
          onValueChange={([value]) => seekTo(value)}
          disabled={!fileName}
          className="my-4"
        />
        {isPlaying && (
          <div className="flex items-center justify-center gap-1">
            <span className="audio-wave"></span>
            <span className="audio-wave"></span>
            <span className="audio-wave"></span>
            <span className="audio-wave"></span>
            <span className="audio-wave"></span>
          </div>
        )}
      </div>

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

      <div className="flex items-center space-x-2">
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
    </div>
  );
};

export default AudioPlayer;
