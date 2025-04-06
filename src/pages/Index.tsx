
import { Card, CardContent } from "@/components/ui/card";
import EnhancedHeader from "@/components/EnhancedHeader";
import Footer from "@/components/Footer";
import FileUpload from "@/components/FileUpload";
import EnhancedAudioPlayer from "@/components/EnhancedAudioPlayer";
import EnhancedAnimatedBackground from "@/components/EnhancedAnimatedBackground";
import SongSearch from "@/components/SongSearch";
import { useAudio } from "@/context/AudioContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Analytics from "@/components/Analytics";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const { fileName } = useAudio();
  const isMobile = useIsMobile();
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Show analytics after user has interacted with the app for a while
  useEffect(() => {
    if (fileName) {
      const timer = setTimeout(() => {
        setShowAnalytics(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [fileName]);

  return (
    <>
      <EnhancedAnimatedBackground />
      <div className="min-h-screen flex flex-col container max-w-5xl px-4">
        <EnhancedHeader />
        
        <main className="flex-1 flex flex-col items-center justify-center py-12">
          <h1 className="text-4xl font-bold text-center mb-2">
            LofiFy
          </h1>
          <p className="text-center text-muted-foreground mb-8 max-w-md">
            Upload your MP3 and transform it into a relaxing lo-fi track with customizable effects
          </p>
          
          <Tabs defaultValue="upload" className="w-full max-w-4xl">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="upload">Upload File</TabsTrigger>
              <TabsTrigger value="search">Search Song</TabsTrigger>
            </TabsList>
            
            <div className={`grid grid-cols-1 ${isMobile ? "" : "md:grid-cols-2"} gap-8 w-full`}>
              <TabsContent value="upload" className="mt-0">
                <Card className="bg-card/80 backdrop-blur-sm border-primary/10 animate-border-glow card-hover-effect">
                  <CardContent className="p-0">
                    <FileUpload />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="search" className="mt-0">
                <Card className="bg-card/80 backdrop-blur-sm border-primary/10 animate-border-glow card-hover-effect">
                  <CardContent className="p-0">
                    <SongSearch />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <Card className="bg-card/80 backdrop-blur-sm border-primary/10 animate-border-glow card-hover-effect">
                <CardContent className="p-0">
                  <EnhancedAudioPlayer />
                </CardContent>
              </Card>
              
              {/* Display analytics if we have a file loaded and enough time has passed */}
              {showAnalytics && (
                <Card className="bg-card/80 backdrop-blur-sm border-primary/10 animate-border-glow card-hover-effect">
                  <CardContent className="p-0">
                    <Analytics />
                  </CardContent>
                </Card>
              )}
            </div>
          </Tabs>
          
          {fileName && (
            <div className="mt-8 text-center">
              <h3 className="text-lg font-medium">Now Playing</h3>
              <p className="text-muted-foreground">{fileName}</p>
            </div>
          )}
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default Index;
