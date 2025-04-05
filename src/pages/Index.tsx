
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FileUpload from "@/components/FileUpload";
import AudioPlayer from "@/components/AudioPlayer";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useAudio } from "@/context/AudioContext";

const Index = () => {
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardContent className="p-0">
                <FileUpload />
              </CardContent>
            </Card>
            
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardContent className="p-0">
                <AudioPlayer />
              </CardContent>
            </Card>
          </div>
          
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
