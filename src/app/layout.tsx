
"use client";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/context/ThemeContext";
import { AudioProvider } from "@/context/AudioContext";
import { UserProvider } from "@/context/UserContext";
import "../index.css";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <UserProvider>
            <AudioProvider>
              <TooltipProvider>
                {children}
                <Toaster />
                <Sonner />
              </TooltipProvider>
            </AudioProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
