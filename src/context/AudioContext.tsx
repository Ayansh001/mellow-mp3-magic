
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
    // Load effects from localStorage if available
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
    // Load playback rate from localStorage if available
    if (typeof window !== "undefined") {
      const savedRate = localStorage.getItem("lofi_playback_rate");
      return savedRate ? parseFloat(savedRate) : 0.85;
    }
    return 0.85;
  });
  
  const [fileName, setFileName] = useState<string | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [savedAudioFiles, setSavedAudioFiles] = useState<{name: string, src: string}[]>(() => {
    // Load saved audio files from localStorage if available
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

  // Save effects to localStorage when they change
  useEffect(() => {
    localStorage.setItem("lofi_effects", JSON.stringify(effects));
  }, [effects]);

  // Save playback rate to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("lofi_playback_rate", playbackRate.toString());
  }, [playbackRate]);

  // Save audio files to localStorage when they change
  useEffect(() => {
    localStorage.setItem("lofi_saved_files", JSON.stringify(savedAudioFiles));
  }, [savedAudioFiles]);

  // Initialize audio element
  useEffect(() => {
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();
    }
    
    // Try to load last played file if available
    const lastFile = savedAudioFiles[0];
    if (lastFile && !audioSrc) {
      setFileName(lastFile.name);
      setAudioSrc(lastFile.src);
      if (audioElementRef.current) {
        audioElementRef.current.src = lastFile.src;
        audioElementRef.current.load();
      }
    }
    
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.src = '';
      }
    };
  }, []);

  // Cleanup animation and audio context
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

  // Load vinyl noise for crackling effect
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

  // Toggle vinyl crackle effect
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

  // Create impulse response for reverb effect
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

  // Load audio from file
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
          
          // Save to local storage for future use
          setSavedAudioFiles(prev => {
            // Remove if already exists to avoid duplicates
            const filtered = prev.filter(item => item.name !== file.name);
            // Add new file at the beginning (most recent)
            return [{ name: file.name, src: blobUrl }, ...filtered].slice(0, 10); // Limit to 10 files
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

  // Load saved audio from localStorage
  const loadSavedAudio = (src: string, name: string) => {
    try {
      setFileName(name);
      setAudioSrc(src);
      
      if (audioElementRef.current) {
        audioElementRef.current.src = src;
        audioElementRef.current.load();
        
        audioElementRef.current.onloadedmetadata = () => {
          setDuration(audioElementRef.current?.duration || 0);
        };
      }
      
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

  // Play audio with effects
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
    
    if (effects.isSlowedDown) {
      sourceNodeRef.current.playbackRate.value = playbackRate * 0.8;
    } else {
      sourceNodeRef.current.playbackRate.value = playbackRate;
    }
    
    gainNodeRef.current = audioContextRef.current.createGain();
    
    biquadFilterRef.current = audioContextRef.current.createBiquadFilter();
    biquadFilterRef.current.type = "lowpass";
    
    let lastNode: AudioNode = sourceNodeRef.current;
    
    if (effects.isLofiMode) {
      biquadFilterRef.current.frequency.value = 3000;
      lastNode.connect(biquadFilterRef.current);
      lastNode = biquadFilterRef.current;
    } 
    
    if (effects.isJazzMode) {
      const midBoostFilter = audioContextRef.current.createBiquadFilter();
      midBoostFilter.type = "peaking";
      midBoostFilter.frequency.value = 1500;
      midBoostFilter.gain.value = 6;
      midBoostFilter.Q.value = 1;
      
      lastNode.connect(midBoostFilter);
      lastNode = midBoostFilter;
      
      const warmthFilter = audioContextRef.current.createBiquadFilter();
      warmthFilter.type = "lowpass";
      warmthFilter.frequency.value = 7000;
      
      lastNode.connect(warmthFilter);
      lastNode = warmthFilter;
    }
    
    if (effects.isReverbOn) {
      if (!reverbNodeRef.current) {
        reverbNodeRef.current = audioContextRef.current.createConvolver();
        reverbNodeRef.current.buffer = createImpulseResponse(audioContextRef.current);
      }
      
      reverbGainNodeRef.current = audioContextRef.current.createGain();
      reverbGainNodeRef.current.gain.value = 0.3;
      
      lastNode.connect(reverbNodeRef.current);
      reverbNodeRef.current.connect(reverbGainNodeRef.current);
      reverbGainNodeRef.current.connect(audioContextRef.current.destination);
    }
    
    lastNode.connect(gainNodeRef.current);
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
    
    if (effects.isVinylCrackle && vinylBufferRef.current) {
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

  // Toggle play/pause
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

  // Toggle audio effects
  const toggleEffect = (effect: keyof AudioEffects) => {
    setEffects(prev => {
      const updated = { ...prev, [effect]: !prev[effect] };
      return updated;
    });
    
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
      
      setTimeout(() => {
        playAudio();
      }, 50);
    }
  };

  // Update playback rate
  const updatePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    
    if (isPlaying && sourceNodeRef.current) {
      const actualRate = effects.isSlowedDown ? rate * 0.8 : rate;
      sourceNodeRef.current.playbackRate.value = actualRate;
    }
  };

  // Seek to position in audio
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
