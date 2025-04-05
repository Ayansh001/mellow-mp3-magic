
import { ChangeEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAudio } from "@/context/AudioContext";
import { Upload } from "lucide-react";

const FileUpload = () => {
  const { loadAudio } = useAudio();
  const [isDragging, setIsDragging] = useState(false);

  // This function handles file selection through the file input
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("audio/")) {
        loadAudio(file);
      }
    }
  };

  // These functions handle drag and drop functionality
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("audio/")) {
        loadAudio(file);
      }
    }
  };

  return (
    <div
      className={`p-6 border-2 border-dashed rounded-lg flex flex-col items-center justify-center bg-opacity-50 transition-colors ${
        isDragging ? "bg-primary/10 border-primary" : "bg-background border-border"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Upload className="w-12 h-12 text-primary mb-3 animate-pulse-slow" />
      <h3 className="text-lg font-medium mb-2">Upload your audio file</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Drag and drop your MP3 here or click to browse
      </p>
      <Button variant="outline" className="relative w-full sm:w-auto">
        Choose File
        <input
          type="file"
          accept="audio/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
        />
      </Button>
    </div>
  );
};

export default FileUpload;
