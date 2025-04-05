import { createContext, useContext, useState, useRef, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

type AudioContextType = {
  audioBuffer: AudioBuffer | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  isLofiMode: boolean;
  isVinylCrackle: boolean;
  playbackRate: number;
  loadAudio: (file: File) => void;
  togglePlayPause: () => void;
  toggleLofiMode: () => void;
  toggleVinylCrackle: () => void;
  setPlaybackRate: (rate: number) => void;
  seekTo: (time: number) => void;
  fileName: string | null;
  audioContext: AudioContext | null;
};

const AudioPlayerContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isLofiMode, setIsLofiMode] = useState(false);
  const [isVinylCrackle, setIsVinylCrackle] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(0.85);
  const [fileName, setFileName] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const biquadFilterRef = useRef<BiquadFilterNode | null>(null);
  const vinylGainNodeRef = useRef<GainNode | null>(null);
  const vinylSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const vinylBufferRef = useRef<AudioBuffer | null>(null);
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    const loadVinylNoise = async () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        const ctx = audioContextRef.current;
        const sampleRate = ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, sampleRate * 3, sampleRate);
        const data = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < noiseBuffer.length; i++) {
          const noise = Math.random() * 2 - 1;
          data[i] = noise * (Math.random() > 0.995 ? 0.5 : 0.03);
        }
        
        vinylBufferRef.current = noiseBuffer;
      } catch (error) {
        console.error("Error loading vinyl noise:", error);
        toast({
          title: "Error",
          description: "Failed to load vinyl crackle effect",
          variant: "destructive",
        });
      }
    };
    
    loadVinylNoise();
  }, [toast]);

  useEffect(() => {
    if (!audioContextRef.current || !isPlaying) return;

    if (isVinylCrackle && vinylBufferRef.current) {
      if (vinylSourceNodeRef.current) {
        vinylSourceNodeRef.current.stop();
        vinylSourceNodeRef.current.disconnect();
      }
      
      vinylGainNodeRef.current = audioContextRef.current.createGain();
      vinylGainNodeRef.current.gain.value = 0.15;
      
      vinylSourceNodeRef.current = audioContextRef.current.createBufferSource();
      vinylSourceNodeRef.current.buffer = vinylBufferRef.current;
      vinylSourceNodeRef.current.loop = true;
      
      vinylSourceNodeRef.current.connect(vinylGainNodeRef.current);
      vinylGainNodeRef.current.connect(audioContextRef.current.destination);
      vinylSourceNodeRef.current.start(0);
    } else if (!isVinylCrackle && vinylSourceNodeRef.current) {
      vinylSourceNodeRef.current.stop();
      vinylSourceNodeRef.current.disconnect();
      if (vinylGainNodeRef.current) {
        vinylGainNodeRef.current.disconnect();
      }
    }
  }, [isVinylCrackle, isPlaying]);

  const loadAudio = async (file: File) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        if (audioContextRef.current.state === "suspended") {
          await audioContextRef.current.resume();
        }
      }

      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const decodedBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer);
          
          setAudioBuffer(decodedBuffer);
          setDuration(decodedBuffer.duration);
          setFileName(file.name);
          
          toast({
            title: "Success!",
            description: "Audio loaded successfully",
          });
          
          if (sourceNodeRef.current) {
            sourceNodeRef.current.stop();
            sourceNodeRef.current.disconnect();
          }
          
        } catch (decodeError) {
          console.error("Error decoding audio data:", decodeError);
          toast({
            title: "Error",
            description: "Failed to decode audio file",
            variant: "destructive",
          });
        }
      };
      
      reader.onerror = (error) => {
        console.error("File reading error:", error);
        toast({
          title: "Error",
          description: "Failed to read audio file",
          variant: "destructive",
        });
      };
      
      reader.readAsArrayBuffer(file);
      
    } catch (error) {
      console.error("Error loading audio:", error);
      toast({
        title: "Error",
        description: "Failed to load audio",
        variant: "destructive",
      });
    }
  };

  const playAudio = () => {
    if (!audioContextRef.current || !audioBuffer) return;
    
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
    
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
    }
    
    sourceNodeRef.current = audioContextRef.current.createBufferSource();
    sourceNodeRef.current.buffer = audioBuffer;
    
    sourceNodeRef.current.playbackRate.value = playbackRate;
    
    gainNodeRef.current = audioContextRef.current.createGain();
    
    biquadFilterRef.current = audioContextRef.current.createBiquadFilter();
    biquadFilterRef.current.type = "lowpass";
    
    if (isLofiMode) {
      biquadFilterRef.current.frequency.value = 3000;
    } else {
      biquadFilterRef.current.frequency.value = 20000;
    }
    
    sourceNodeRef.current.connect(biquadFilterRef.current);
    biquadFilterRef.current.connect(gainNodeRef.current);
    gainNodeRef.current.connect(audioContextRef.current.destination);
    
    sourceNodeRef.current.start(0, pausedTimeRef.current);
    startTimeRef.current = audioContextRef.current.currentTime - pausedTimeRef.current;
    
    const updatePlaybackPosition = () => {
      if (!audioContextRef.current || !isPlaying) return;
      
      const elapsedTime = audioContextRef.current.currentTime - startTimeRef.current;
      setCurrentTime(elapsedTime);
      pausedTimeRef.current = elapsedTime;
      setProgress(elapsedTime / duration * 100);
      
      if (elapsedTime < duration) {
        requestRef.current = requestAnimationFrame(updatePlaybackPosition);
      } else {
        setIsPlaying(false);
        pausedTimeRef.current = 0;
        setCurrentTime(0);
        setProgress(0);
      }
    };
    
    requestRef.current = requestAnimationFrame(updatePlaybackPosition);
    
    if (isVinylCrackle && vinylBufferRef.current) {
      vinylGainNodeRef.current = audioContextRef.current.createGain();
      vinylGainNodeRef.current.gain.value = 0.15;
      
      vinylSourceNodeRef.current = audioContextRef.current.createBufferSource();
      vinylSourceNodeRef.current.buffer = vinylBufferRef.current;
      vinylSourceNodeRef.current.loop = true;
      
      vinylSourceNodeRef.current.connect(vinylGainNodeRef.current);
      vinylGainNodeRef.current.connect(audioContextRef.current.destination);
      vinylSourceNodeRef.current.start(0);
    }
  };

  const togglePlayPause = () => {
    if (!audioContextRef.current || !audioBuffer) return;
    
    if (isPlaying) {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      }
      
      if (vinylSourceNodeRef.current) {
        vinylSourceNodeRef.current.stop();
        vinylSourceNodeRef.current.disconnect();
      }
      
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      
      setIsPlaying(false);
    } else {
      playAudio();
      setIsPlaying(true);
    }
  };

  const toggleLofiMode = () => {
    setIsLofiMode((prev) => !prev);
    
    if (isPlaying && biquadFilterRef.current) {
      const newMode = !isLofiMode;
      biquadFilterRef.current.frequency.value = newMode ? 3000 : 20000;
    }
  };

  const toggleVinylCrackle = () => {
    setIsVinylCrackle((prev) => !prev);
  };

  const updatePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    
    if (isPlaying && sourceNodeRef.current) {
      sourceNodeRef.current.playbackRate.value = rate;
    }
  };

  const seekTo = (time: number) => {
    if (!audioContextRef.current || !audioBuffer) return;
    
    const seekTime = (time / 100) * duration;
    pausedTimeRef.current = seekTime;
    setCurrentTime(seekTime);
    setProgress(time);
    
    if (isPlaying) {
      playAudio();
    }
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        audioBuffer,
        isPlaying,
        currentTime,
        duration,
        progress,
        isLofiMode,
        isVinylCrackle,
        playbackRate,
        loadAudio,
        togglePlayPause,
        toggleLofiMode,
        toggleVinylCrackle,
        setPlaybackRate: updatePlaybackRate,
        seekTo,
        fileName,
        audioContext: audioContextRef.current,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
