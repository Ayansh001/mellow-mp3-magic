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
  const isPlayingRef = useRef<boolean>(false); // Add this ref to track playing state

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
      
      // Add event listeners to audio element
      audioElementRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioElementRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioElementRef.current.addEventListener('ended', handleEnded);
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
    
    // Initialize Web Audio API context
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.error("Failed to create audio context:", error);
      }
    }
    
    return () => {
      // Clean up event listeners
      if (audioElementRef.current) {
        audioElementRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioElementRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioElementRef.current.removeEventListener('ended', handleEnded);
        audioElementRef.current.pause();
        audioElementRef.current.src = '';
      }
      
      // Cancel any animation frames
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      
      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Handle time update event from audio element
  const handleTimeUpdate = () => {
    if (!audioElementRef.current || !isPlaying) return;
    
    const currentTime = audioElementRef.current.currentTime;
    const duration = audioElementRef.current.duration || 0;
    
    setCurrentTime(currentTime);
    setProgress((currentTime / duration) * 100);
  };

  // Handle loaded metadata event from audio element
  const handleLoadedMetadata = () => {
    if (!audioElementRef.current) return;
    
    const duration = audioElementRef.current.duration || 0;
    setDuration(duration);
  };

  // Handle ended event from audio element
  const handleEnded = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    setCurrentTime(0);
    setProgress(0);
    
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = 0;
    }
  };

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

  // Sync isPlayingRef with isPlaying state
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

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

  // Apply effects when they change
  useEffect(() => {
    if (!isPlaying || !audioElementRef.current) return;

    // Apply playback rate
    const actualRate = effects.isSlowedDown ? playbackRate * 0.8 : playbackRate;
    audioElementRef.current.playbackRate = actualRate;
    
    // Since we're using the built-in audio element now,
    // we'll need to manage other effects differently
    // (future enhancement would be to connect audio element to Web Audio API
    // for more advanced effects processing)
  }, [effects, playbackRate, isPlaying]);

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
      // Initialize audio context if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        if (audioContextRef.current.state === "suspended") {
          await audioContextRef.current.resume();
        }
      }

      // Create file reader to read file
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          // Decode audio data for buffer processing
          const decodedBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer);
          setAudioBuffer(decodedBuffer);
          setDuration(decodedBuffer.duration);
          setFileName(file.name);
          
          // Create blob URL for HTML Audio element
          const blobUrl = URL.createObjectURL(file);
          setAudioSrc(blobUrl);
          
          // Set up audio element with the file
          if (audioElementRef.current) {
            audioElementRef.current.src = blobUrl;
            audioElementRef.current.load();
          }
          
          // Reset playback state
          setIsPlaying(false);
          isPlayingRef.current = false;
          setCurrentTime(0);
          setProgress(0);
          
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
      
      // Start reading the file
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
      // Set file information
      setFileName(name);
      setAudioSrc(src);
      
      // Reset playback state
      setIsPlaying(false);
      isPlayingRef.current = false;
      setCurrentTime(0);
      setProgress(0);
      
      // Set up audio element with saved audio
      if (audioElementRef.current) {
        audioElementRef.current.pause(); // Ensure previous audio is stopped
        audioElementRef.current.src = src;
        audioElementRef.current.load();
        
        // Get duration once metadata is loaded
        audioElementRef.current.onloadedmetadata = () => {
          setDuration(audioElementRef.current?.duration || 0);
        };
      }
      
      // Also fetch the file as ArrayBuffer to decode for Web Audio API
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

  // Toggle play/pause
  const togglePlayPause = () => {
    if (!audioElementRef.current || !audioSrc) return;
    
    if (isPlaying) {
      // Pause playback
      audioElementRef.current.pause();
      
      // Stop vinyl crackle effect if active
      if (vinylSourceNodeRef.current) {
        vinylSourceNodeRef.current.stop();
        vinylSourceNodeRef.current.disconnect();
      }
      
      setIsPlaying(false);
      isPlayingRef.current = false;
    } else {
      // Start or resume playback
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

  // Toggle audio effects
  const toggleEffect = (effect: keyof AudioEffects) => {
    setEffects(prev => {
      const updated = { ...prev, [effect]: !prev[effect] };
      return updated;
    });
    
    // Apply effect change immediately if playing
    if (isPlaying && audioElementRef.current) {
      // For slowed down effect, update playback rate immediately
      if (effect === 'isSlowedDown') {
        const wasSlowedDown = !effects.isSlowedDown;
        audioElementRef.current.playbackRate = wasSlowedDown ? playbackRate : playbackRate * 0.8;
      }
      
      // Other effects would need Web Audio API processing
      // which we'll enhance in future updates
    }
  };

  // Update playback rate
  const updatePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    
    // Apply new rate immediately if playing
    if (isPlaying && audioElementRef.current) {
      const actualRate = effects.isSlowedDown ? rate * 0.8 : rate;
      audioElementRef.current.playbackRate = actualRate;
    }
  };

  // Seek to position in audio
  const seekTo = (time: number) => {
    if (!audioElementRef.current || !audioSrc) return;
    
    // Calculate target time in seconds
    const seekTime = (time / 100) * duration;
    
    // Set audio element to target time
    audioElementRef.current.currentTime = seekTime;
    
    // Update state
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
