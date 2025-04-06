
"use client";

import { createContext, useContext, useState, useEffect } from "react";

// Define user profile type
export interface UserProfile {
  id: string;
  username: string;
  favorites: string[];
  playlists: {
    id: string;
    name: string;
    songs: {
      title: string;
      artist: string;
      downloadLink?: string;
    }[];
  }[];
  preferredEffects: {
    isLofiMode: boolean;
    isVinylCrackle: boolean;
    isReverbOn: boolean;
    isSlowedDown: boolean;
    isJazzMode: boolean;
  };
  theme: "purple" | "blue" | "green" | "pink";
}

interface UserContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  login: (username: string) => void;
  logout: () => void;
  addToFavorites: (songId: string) => void;
  removeFromFavorites: (songId: string) => void;
  createPlaylist: (name: string) => void;
  addToPlaylist: (playlistId: string, song: { title: string; artist: string; downloadLink?: string }) => void;
  removeFromPlaylist: (playlistId: string, songIndex: number) => void;
  updatePreferredEffects: (effects: Partial<UserProfile["preferredEffects"]>) => void;
  setTheme: (theme: UserProfile["theme"]) => void;
}

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Generate random ID helper function
const generateId = () => Math.random().toString(36).substring(2, 15);

// Provider component
export function UserProvider({ children }: { children: React.ReactNode }) {
  // Initialize state
  const [user, setUser] = useState<UserProfile | null>(() => {
    // Load from localStorage if available
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("user_profile");
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  // Effect to save user data to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem("user_profile", JSON.stringify(user));
    }
  }, [user]);

  // Login function - simple demo implementation
  const login = (username: string) => {
    const newUser = {
      id: generateId(),
      username,
      favorites: [],
      playlists: [],
      preferredEffects: {
        isLofiMode: false,
        isVinylCrackle: false,
        isReverbOn: false,
        isSlowedDown: false,
        isJazzMode: false,
      },
      theme: "purple" as const,
    };
    
    setUser(newUser);
    localStorage.setItem("user_profile", JSON.stringify(newUser));
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("user_profile");
    setUser(null);
  };

  // Add a song to favorites
  const addToFavorites = (songId: string) => {
    if (!user) return;
    
    // Check if the song is already in favorites
    if (user.favorites.includes(songId)) {
      // If it is, remove it (toggle behavior)
      removeFromFavorites(songId);
      return;
    }
    
    // If not, add it
    const updatedUser = {
      ...user,
      favorites: [...user.favorites, songId],
    };
    
    setUser(updatedUser);
    localStorage.setItem("user_profile", JSON.stringify(updatedUser));
  };

  // Remove a song from favorites
  const removeFromFavorites = (songId: string) => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      favorites: user.favorites.filter(id => id !== songId),
    };
    
    setUser(updatedUser);
    localStorage.setItem("user_profile", JSON.stringify(updatedUser));
  };

  // Create a new playlist
  const createPlaylist = (name: string) => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      playlists: [
        ...user.playlists,
        {
          id: generateId(),
          name,
          songs: [],
        },
      ],
    };
    
    setUser(updatedUser);
    localStorage.setItem("user_profile", JSON.stringify(updatedUser));
  };

  // Add a song to a playlist
  const addToPlaylist = (playlistId: string, song: { title: string; artist: string; downloadLink?: string }) => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      playlists: user.playlists.map(playlist => {
        if (playlist.id === playlistId) {
          return {
            ...playlist,
            songs: [...playlist.songs, song],
          };
        }
        return playlist;
      }),
    };
    
    setUser(updatedUser);
    localStorage.setItem("user_profile", JSON.stringify(updatedUser));
  };

  // Remove a song from a playlist
  const removeFromPlaylist = (playlistId: string, songIndex: number) => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      playlists: user.playlists.map(playlist => {
        if (playlist.id === playlistId) {
          const updatedSongs = [...playlist.songs];
          updatedSongs.splice(songIndex, 1);
          return {
            ...playlist,
            songs: updatedSongs,
          };
        }
        return playlist;
      }),
    };
    
    setUser(updatedUser);
    localStorage.setItem("user_profile", JSON.stringify(updatedUser));
  };

  // Update preferred effects
  const updatePreferredEffects = (effects: Partial<UserProfile["preferredEffects"]>) => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      preferredEffects: {
        ...user.preferredEffects,
        ...effects,
      },
    };
    
    setUser(updatedUser);
    localStorage.setItem("user_profile", JSON.stringify(updatedUser));
  };

  // Set theme
  const setTheme = (theme: UserProfile["theme"]) => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      theme,
    };
    
    setUser(updatedUser);
    localStorage.setItem("user_profile", JSON.stringify(updatedUser));
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        login,
        logout,
        addToFavorites,
        removeFromFavorites,
        createPlaylist,
        addToPlaylist,
        removeFromPlaylist,
        updatePreferredEffects,
        setTheme,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

// Custom hook for using the context
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
