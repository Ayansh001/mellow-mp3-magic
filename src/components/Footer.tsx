
import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="text-sm text-center py-4 text-muted-foreground">
      <div className="flex items-center justify-center gap-1">
        Made with{" "}
        <Heart className="h-3 w-3 text-red-400 animate-pulse" /> for lo-fi lovers
      </div>
    </footer>
  );
};

export default Footer;
