
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon, Heart } from "lucide-react";
import { useEffect, useState } from "react";

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const [hearts, setHearts] = useState<{ id: number, x: number, size: number }[]>([]);

  useEffect(() => {
    // Create some hearts when the component mounts
    const initialHearts = Array.from({ length: 3 }, (_, i) => ({
      id: i,
      x: 25 + Math.random() * 50, // Random position around the logo
      size: 8 + Math.random() * 8 // Random size between 8-16px
    }));
    
    setHearts(initialHearts);

    // Add a new heart every 2 seconds
    const interval = setInterval(() => {
      setHearts(prev => {
        // Remove a heart if we have more than 5
        const newHearts = prev.length >= 5 ? prev.slice(1) : [...prev];
        
        // Add a new heart
        return [
          ...newHearts,
          {
            id: Date.now(),
            x: 25 + Math.random() * 50,
            size: 8 + Math.random() * 8
          }
        ];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex justify-between items-center py-4">
      <div className="flex items-center gap-2 relative">
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold">L</span>
        </div>
        
        <div className="relative">
          <h1 className="text-xl font-bold">LofiFy</h1>
          
          {/* Hearts animation */}
          <div className="absolute left-0 top-0 w-full h-full overflow-visible pointer-events-none">
            {hearts.map(heart => (
              <Heart
                key={heart.id}
                className="absolute text-red-400 animate-float-up"
                style={{
                  left: `${heart.x}%`,
                  width: `${heart.size}px`,
                  height: `${heart.size}px`,
                  animationDuration: `${1 + Math.random() * 2}s`,
                  opacity: 0.8
                }}
                fill="currentColor"
              />
            ))}
          </div>
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="rounded-full"
      >
        {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </Button>
    </header>
  );
};

export default Header;
