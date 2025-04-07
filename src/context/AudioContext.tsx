import { createContext, useContext, useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

type AudioEffects = {
  isLofiMode: boolean;
  isVinylCrackle: boolean;
  isReverbOn: boolean;
  isSlowedDown: boolean;
  isJazzMode: boolean;
};

type AudioContextType = {
  audioBuffer: AudioBuffer | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  effects: AudioEffects;
  playbackRate: number;
  loadAudio: (file: File) => void;
  togglePlayPause: () => void;
  toggleEffect: (effect: keyof AudioEffects) => void;
  setPlaybackRate: (rate: number) => void;
  seekTo: (time: number) => void;
  fileName: string | null;
  audioContext: AudioContext | null;
  audioElement: HTMLAudioElement | null;
  audioSrc: string | null;
  savedAudioFiles: {name: string, src: string}[];
  loadSavedAudio: (src: string, name: string) => void;
};

const AudioPlayerContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [effects, setEffects] = useState<AudioEffects>(() => {
    if (typeof window !== "undefined") {
      const savedEffects = localStorage.getItem("lofi_effects");
      return savedEffects ? JSON.parse(savedEffects) : {
        isLofiMode: false,
        isVinylCrackle: false,
        isReverbOn: false,
        isSlowedDown: false,
        isJazzMode: false,
      };
    }
    return {
      isLofiMode: false,
      isVinylCrackle: false,
      isReverbOn: false,
      isSlowedDown: false,
      isJazzMode: false,
    };
  });
  
  const [playbackRate, setPlaybackRate] = useState(() => {
    if (typeof window !== "undefined") {
      const savedRate = localStorage.getItem("lofi_playback_rate");
      return savedRate ? parseFloat(savedRate) : 0.85;
    }
    return 0.85;
  });
  
  const [fileName, setFileName] = useState<string | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [savedAudioFiles, setSavedAudioFiles] = useState<{name: string, src: string}[]>(() => {
    if (typeof window !== "undefined") {
      const savedFiles = localStorage.getItem("lofi_saved_files");
      return savedFiles ? JSON.parse(savedFiles) : [];
    }
    return [];
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const biquadFilterRef = useRef<BiquadFilterNode | null>(null);
  const vinylGainNodeRef = useRef<GainNode | null>(null);
  const vinylSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const vinylBufferRef = useRef<AudioBuffer | null>(null);
  const reverbGainNodeRef = useRef<GainNode | null>(null);
  const reverbNodeRef = useRef<ConvolverNode | null>(null);
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    localStorage.setItem("lofi_effects", JSON.stringify(effects));
  }, [effects]);

  useEffect(() => {
    localStorage.setItem("lofi_playback_rate", playbackRate.toString());
  }, [playbackRate]);

  useEffect(() => {
    localStorage.setItem("lofi_saved_files", JSON.stringify(savedAudioFiles));
  }, [savedAudioFiles]);

  useEffect(() => {
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();
      
      audioElementRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioElementRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioElementRef.current.addEventListener('ended', handleEnded);
      audioElementRef.current.addEventListener('play', () => {
        setIsPlaying(true);
        isPlayingRef.current = true;
      });
      audioElementRef.current.addEventListener('pause', () => {
        setIsPlaying(false);
        isPlayingRef.current = false;
      });
    }
    
    const lastFile = savedAudioFiles[0];
    if (lastFile && !audioSrc) {
      setFileName(lastFile.name);
      setAudioSrc(lastFile.src);
      if (audioElementRef.current) {
        audioElementRef.current.src = lastFile.src;
        audioElementRef.current.load();
      }
    }
    
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.error("Failed to create audio context:", error);
      }
    }
    
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioElementRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioElementRef.current.removeEventListener('ended', handleEnded);
        audioElementRef.current.pause();
        audioElementRef.current.src = '';
      }
      
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleTimeUpdate = () => {
    if (!audioElementRef.current) return;
    
    const currentTime = audioElementRef.current.currentTime;
    const duration = audioElementRef.current.duration || 0;
    
    setCurrentTime(currentTime);
    setProgress((currentTime / duration) * 100);
  };

  const handleLoadedMetadata = () => {
    if (!audioElementRef.current) return;
    
    const duration = audioElementRef.current.duration || 0;
    setDuration(duration);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    setCurrentTime(0);
    setProgress(0);
    
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
      timeUpdateIntervalRef.current = null;
    }

    if (isPlaying) return;

    if (!isPlaying && audioElementRef.current) {
      timeUpdateIntervalRef.current = setInterval(() => {
        if (audioElementRef.current) {
          const currentTime = audioElementRef.current.currentTime;
          const duration = audioElementRef.current.duration || 0;
          
          setCurrentTime(currentTime);
          setProgress((currentTime / duration) * 100);
        }
      }, 100);
    }

    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    };
  }, [isPlaying]);

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

    if (effects.isVinylCrackle && vinylBufferRef.current) {
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
    } else if (!effects.isVinylCrackle && vinylSourceNodeRef.current) {
      vinylSourceNodeRef.current.stop();
      vinylSourceNodeRef.current.disconnect();
      if (vinylGainNodeRef.current) {
        vinylGainNodeRef.current.disconnect();
      }
    }
  }, [effects.isVinylCrackle, isPlaying]);

  useEffect(() => {
    if (!audioElementRef.current) return;

    const actualRate = effects.isSlowedDown ? playbackRate * 0.8 : playbackRate;
    audioElementRef.current.playbackRate = actualRate;
  }, [effects, playbackRate]);

  const createImpulseResponse = (ctx: AudioContext, duration: number = 2) => {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, sampleRate);
    const leftChannel = impulse.getChannelData(0);
    const rightChannel = impulse.getChannelData(1);
    
    for (let i = 0; i < length; i++) {
      const n = i / length;
      const decay = Math.pow(1 - n, 1.5);
      
      leftChannel[i] = (Math.random() * 2 - 1) * decay;
      rightChannel[i] = (Math.random() * 2 - 1) * decay;
    }
    
    return impulse;
  };

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
          
          const blobUrl = URL.createObjectURL(file);
          setAudioSrc(blobUrl);
          
          if (audioElementRef.current) {
            audioElementRef.current.src = blobUrl;
            audioElementRef.current.load();
          }
          
          setIsPlaying(false);
          isPlayingRef.current = false;
          setCurrentTime(0);
          setProgress(0);
          
          setSavedAudioFiles(prev => {
            const filtered = prev.filter(item => item.name !== file.name);
            return [{ name: file.name, src: blobUrl }, ...filtered].slice(0, 10);
          });
          
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

  const loadSavedAudio = (src: string, name: string) => {
    try {
      setFileName(name);
      setAudioSrc(src);
      
      setIsPlaying(false);
      isPlayingRef.current = false;
      setCurrentTime(0);
      setProgress(0);
      
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.src = src;
        audioElementRef.current.load();
        
        audioElementRef.current.onloadedmetadata = () => {
          setDuration(audioElementRef.current?.duration || 0);
        };
      }
      
      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume().catch(err => {
          console.error("Error resuming audio context:", err);
        });
      }
      
      fetch(src)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
          if (audioContextRef.current) {
            return audioContextRef.current.decodeAudioData(arrayBuffer);
          }
          return null;
        })
        .then(decodedBuffer => {
          if (decodedBuffer) {
            setAudioBuffer(decodedBuffer);
          }
        })
        .catch(error => {
          console.error("Error fetching saved audio:", error);
        });
      
      toast({
        title: "Success!",
        description: "Loaded saved audio",
      });
      
    } catch (error) {
      console.error("Error loading saved audio:", error);
      toast({
        title: "Error",
        description: "Failed to load saved audio",
        variant: "destructive",
      });
    }
  };

  const togglePlayPause = () => {
    if (!audioElementRef.current || !audioSrc) return;
    
    if (isPlaying) {
      audioElementRef.current.pause();
      
      if (vinylSourceNodeRef.current) {
        vinylSourceNodeRef.current.stop();
        vinylSourceNodeRef.current.disconnect();
      }
      
      setIsPlaying(false);
      isPlayingRef.current = false;
    } else {
      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume().catch(err => {
          console.error("Error resuming audio context:", err);
        });
      }
      
      audioElementRef.current.playbackRate = effects.isSlowedDown ? playbackRate * 0.8 : playbackRate;
      audioElementRef.current.play().catch(error => {
        console.error("Error playing audio:", error);
        toast({
          title: "Playback Error",
          description: "Failed to play audio. Try again.",
          variant: "destructive",
        });
      });
      
      setIsPlaying(true);
      isPlayingRef.current = true;
    }
  };

  const toggleEffect = (effect: keyof AudioEffects) => {
    setEffects(prev => {
      const updated = { ...prev, [effect]: !prev[effect] };
      return updated;
    });
    
    if (audioElementRef.current) {
      if (effect === 'isSlowedDown') {
        const willBeSlowedDown = !effects.isSlowedDown;
        audioElementRef.current.playbackRate = willBeSlowedDown ? playbackRate * 0.8 : playbackRate;
      }
    }
  };

  const updatePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    
    if (audioElementRef.current) {
      const actualRate = effects.isSlowedDown ? rate * 0.8 : rate;
      audioElementRef.current.playbackRate = actualRate;
    }
  };

  const seekTo = (time: number) => {
    if (!audioElementRef.current || !audioSrc) return;
    
    const seekTime = (time / 100) * duration;
    
    audioElementRef.current.currentTime = seekTime;
    
    setCurrentTime(seekTime);
    setProgress(time);
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        audioBuffer,
        isPlaying,
        currentTime,
        duration,
        progress,
        effects,
        playbackRate,
        loadAudio,
        togglePlayPause,
        toggleEffect,
        setPlaybackRate: updatePlaybackRate,
        seekTo,
        fileName,
        audioContext: audioContextRef.current,
        audioElement: audioElementRef.current,
        audioSrc,
        savedAudioFiles,
        loadSavedAudio,
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
