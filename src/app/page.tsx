
"use client";

import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FileUpload from "@/components/FileUpload";
import AudioPlayer from "@/components/AudioPlayer";
import AnimatedBackground from "@/components/AnimatedBackground";
import SongSearch from "@/components/SongSearch";
import { useAudio } from "@/context/AudioContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const { fileName } = useAudio();

  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen flex flex-col container max-w-5xl px-4">
        <Header />
        
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
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
                  <AudioPlayer />
                </CardContent>
              </Card>
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
}
