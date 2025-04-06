
"use client";

import { useTheme } from "@/context/ThemeContext";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";

const EnhancedAnimatedBackground = () => {
  const { theme } = useTheme();
  const { user } = useUser();
  const [bubbles, setBubbles] = useState<{ id: number; size: number; x: number; animationDuration: number; delay: number }[]>([]);
  
  useEffect(() => {
    const generateBubbles = () => {
      const newBubbles = [];
      const count = 15;
      
      for (let i = 0; i < count; i++) {
        newBubbles.push({
          id: i,
          size: Math.floor(Math.random() * 60) + 20, // 20-80px
          x: Math.floor(Math.random() * 100), // 0-100%
          animationDuration: Math.floor(Math.random() * 20) + 10, // 10-30s
          delay: Math.floor(Math.random() * 10), // 0-10s
        });
      }
      
      setBubbles(newBubbles);
    };
    
    generateBubbles();
  }, []);
  
  // Get background and bubble colors based on theme
  const getThemeColors = () => {
    // Default purple theme
    let bgColor = theme === "dark" ? "bg-lofi-dark" : "bg-gradient-to-br from-lofi-light to-white";
    let bubbleColor = theme === "dark" ? "bg-lofi-purple/30" : "bg-lofi-purple/10";
    
    // Apply custom theme if user is logged in and has selected a theme
    if (user && user.theme) {
      switch (user.theme) {
        case "blue":
          bgColor = theme === "dark" ? "bg-blue-950" : "bg-gradient-to-br from-blue-100 to-white";
          bubbleColor = theme === "dark" ? "bg-blue-500/30" : "bg-blue-500/10";
          break;
        case "green":
          bgColor = theme === "dark" ? "bg-green-950" : "bg-gradient-to-br from-green-100 to-white";
          bubbleColor = theme === "dark" ? "bg-green-500/30" : "bg-green-500/10";
          break;
        case "pink":
          bgColor = theme === "dark" ? "bg-pink-950" : "bg-gradient-to-br from-pink-100 to-white";
          bubbleColor = theme === "dark" ? "bg-pink-500/30" : "bg-pink-500/10";
          break;
        default:
          // Purple (default) - already set above
          break;
      }
    }
    
    return { bgColor, bubbleColor };
  };
  
  const { bgColor, bubbleColor } = getThemeColors();
  
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className={`absolute inset-0 ${bgColor} transition-colors duration-500`}>
        {bubbles.map((bubble) => (
          <div
            key={bubble.id}
            className={`absolute rounded-full opacity-30 ${bubbleColor} animate-float transition-colors duration-500`}
            style={{
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              left: `${bubble.x}%`,
              bottom: `-${bubble.size}px`,
              animationDuration: `${bubble.animationDuration}s`,
              animationDelay: `${bubble.delay}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default EnhancedAnimatedBackground;
