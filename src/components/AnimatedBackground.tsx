
import { useTheme } from "@/context/ThemeContext";
import { useState, useEffect } from "react";

const AnimatedBackground = () => {
  const { theme } = useTheme();
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
  
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-lofi-dark' : 'bg-gradient-to-br from-lofi-light to-white'}`}>
        {bubbles.map((bubble) => (
          <div
            key={bubble.id}
            className={`absolute rounded-full opacity-30 ${theme === 'dark' ? 'bg-lofi-purple/30' : 'bg-lofi-purple/10'} animate-float`}
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

export default AnimatedBackground;
