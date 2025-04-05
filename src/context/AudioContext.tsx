
import { createContext, useContext, useState, useRef, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

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
};

const AudioPlayerContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [effects, setEffects] = useState<AudioEffects>({
    isLofiMode: false,
    isVinylCrackle: false,
    isReverbOn: false,
    isSlowedDown: false,
    isJazzMode: false,
  });
  const [playbackRate, setPlaybackRate] = useState(0.85);
  const [fileName, setFileName] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
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

  // Create a simple impulse response for reverb
  const createImpulseResponse = (ctx: AudioContext, duration: number = 2) => {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, sampleRate);
    const leftChannel = impulse.getChannelData(0);
    const rightChannel = impulse.getChannelData(1);
    
    for (let i = 0; i < length; i++) {
      const n = i / length;
      // Exponential decay for a natural reverb sound
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
    
    // Apply different playback rate based on the current effects
    if (effects.isSlowedDown) {
      sourceNodeRef.current.playbackRate.value = playbackRate * 0.8;
    } else {
      sourceNodeRef.current.playbackRate.value = playbackRate;
    }
    
    gainNodeRef.current = audioContextRef.current.createGain();
    
    biquadFilterRef.current = audioContextRef.current.createBiquadFilter();
    biquadFilterRef.current.type = "lowpass";
    
    // Create a connection chain for audio processing
    let lastNode: AudioNode = sourceNodeRef.current;
    
    // Apply lo-fi effect
    if (effects.isLofiMode) {
      biquadFilterRef.current.frequency.value = 3000;
      lastNode.connect(biquadFilterRef.current);
      lastNode = biquadFilterRef.current;
    } 
    
    // Apply jazz mode effect (mid boost)
    if (effects.isJazzMode) {
      const midBoostFilter = audioContextRef.current.createBiquadFilter();
      midBoostFilter.type = "peaking";
      midBoostFilter.frequency.value = 1500;
      midBoostFilter.gain.value = 6;
      midBoostFilter.Q.value = 1;
      
      lastNode.connect(midBoostFilter);
      lastNode = midBoostFilter;
      
      // Add a slight low pass filter for warmth
      const warmthFilter = audioContextRef.current.createBiquadFilter();
      warmthFilter.type = "lowpass";
      warmthFilter.frequency.value = 7000;
      
      lastNode.connect(warmthFilter);
      lastNode = warmthFilter;
    }
    
    // Apply reverb effect
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
    
    // Connect the last node in our processing chain to the gain node
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

  const toggleEffect = (effect: keyof AudioEffects) => {
    setEffects(prev => ({ ...prev, [effect]: !prev[effect] }));
    
    if (isPlaying) {
      // If we're already playing, restart the audio with the new effects
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

  const updatePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    
    if (isPlaying && sourceNodeRef.current) {
      const actualRate = effects.isSlowedDown ? rate * 0.8 : rate;
      sourceNodeRef.current.playbackRate.value = actualRate;
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
        effects,
        playbackRate,
        loadAudio,
        togglePlayPause,
        toggleEffect,
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
