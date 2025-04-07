
import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

/**
 * NotFound component - 404 page for the application
 * This component is imported in App.tsx and renders when a route doesn't match
 * Uses react-router-dom's useNavigate hook to navigate back to home
 */
const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-medium mb-6">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button onClick={() => navigate('/')}>
          Go back home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
