
"use client";

import { useRef, useEffect } from "react";
import { useAudio } from "@/context/AudioContext";
import { useTheme } from "@/context/ThemeContext";

interface AudioVisualizationProps {
  visualizationType?: "bars" | "wave" | "circle";
}

const AudioVisualization = ({ visualizationType = "bars" }: AudioVisualizationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { audioElement, isPlaying, effects } = useAudio();
  const { theme } = useTheme();
  
  useEffect(() => {
    if (!audioElement) return;
    
    // Create AudioContext and analyzers
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaElementSource(audioElement);
    
    // Connect the audio nodes
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    
    // Configure the analyzer
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Get the canvas and context
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const canvasContext = canvas.getContext("2d");
    if (!canvasContext) return;
    
    // Animation function
    const animate = () => {
      if (!isPlaying) {
        // When paused, just draw a flat line or minimal visualization
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        canvasContext.fillStyle = theme === "dark" ? "rgba(155, 135, 245, 0.2)" : "rgba(155, 135, 245, 0.5)";
        canvasContext.fillRect(0, canvas.height / 2 - 1, canvas.width, 2);
        requestAnimationFrame(animate);
        return;
      }
      
      requestAnimationFrame(animate);
      analyser.getByteFrequencyData(dataArray);
      
      canvasContext.clearRect(0, 0, canvas.width, canvas.height);
      
      // Choose visualization type
      switch (visualizationType) {
        case "bars":
          drawBars(canvasContext, canvas, dataArray, bufferLength);
          break;
        case "wave":
          drawWave(canvasContext, canvas, dataArray, bufferLength);
          break;
        case "circle":
          drawCircle(canvasContext, canvas, dataArray, bufferLength);
          break;
        default:
          drawBars(canvasContext, canvas, dataArray, bufferLength);
      }
    };
    
    // Draw bar visualization
    const drawBars = (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      dataArray: Uint8Array,
      bufferLength: number
    ) => {
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.7;
        
        // Change color based on theme
        const primaryColor = theme === "dark" ? "rgba(155, 135, 245, 0.8)" : "rgba(155, 135, 245, 0.8)";
        const secondaryColor = theme === "dark" ? "rgba(155, 135, 245, 0.4)" : "rgba(155, 135, 245, 0.4)";
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, primaryColor);
        gradient.addColorStop(1, secondaryColor);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    };
    
    // Draw wave visualization
    const drawWave = (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      dataArray: Uint8Array,
      bufferLength: number
    ) => {
      ctx.beginPath();
      
      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      ctx.lineTo(canvas.width, canvas.height / 2);
      
      // Change color based on theme
      ctx.strokeStyle = theme === "dark" ? "rgba(155, 135, 245, 0.8)" : "rgba(155, 135, 245, 0.8)";
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Fill area under the line
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.fillStyle = theme === "dark" ? "rgba(155, 135, 245, 0.2)" : "rgba(155, 135, 245, 0.2)";
      ctx.fill();
    };
    
    // Draw circle visualization
    const drawCircle = (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      dataArray: Uint8Array,
      bufferLength: number
    ) => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) * 0.8;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.1, 0, 2 * Math.PI);
      ctx.fillStyle = theme === "dark" ? "rgba(155, 135, 245, 0.8)" : "rgba(155, 135, 245, 0.8)";
      ctx.fill();
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * radius * 0.5;
        const angle = (i * 2 * Math.PI) / bufferLength;
        
        const x1 = centerX + Math.cos(angle) * radius * 0.2;
        const y1 = centerY + Math.sin(angle) * radius * 0.2;
        const x2 = centerX + Math.cos(angle) * (radius * 0.2 + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius * 0.2 + barHeight);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, "rgba(155, 135, 245, 0.8)");
        gradient.addColorStop(1, "rgba(155, 135, 245, 0.2)");
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };
    
    // Start animation
    animate();
    
    // Cleanup function
    return () => {
      source.disconnect();
      analyser.disconnect();
    };
  }, [audioElement, isPlaying, visualizationType, theme, effects]);
  
  // Ensure canvas resizes with parent
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const parent = canvas.parentElement;
      if (!parent) return;
      
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    
    window.addEventListener("resize", handleResize);
    handleResize(); // Initial size
    
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  return (
    <div className="w-full aspect-[3/1] bg-background/20 backdrop-blur-sm rounded-md overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default AudioVisualization;
