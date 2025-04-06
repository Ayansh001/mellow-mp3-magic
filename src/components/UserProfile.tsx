
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/context/UserContext";
import { toast } from "@/hooks/use-toast";
import { AlertCircle, Check, Heart, ListMusic, Palette, LogOut, User as UserIcon, PlusCircle, Trash2 } from "lucide-react";

const UserProfile = () => {
  const { user, isLoggedIn, login, logout, createPlaylist, addToPlaylist, removeFromPlaylist, setTheme, removeFromFavorites } = useUser();
  const [loginOpen, setLoginOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);

  // Handle login
  const handleLogin = () => {
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username to continue",
        variant: "destructive",
      });
      return;
    }
    
    login(username);
    setLoginOpen(false);
    toast({
      title: "Welcome!",
      description: `You're logged in as ${username}`,
    });
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You've been successfully logged out",
    });
  };

  // Handle create playlist
  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) {
      toast({
        title: "Playlist name required",
        description: "Please enter a name for your playlist",
        variant: "destructive",
      });
      return;
    }

    createPlaylist(newPlaylistName);
    setNewPlaylistName("");
    setPlaylistDialogOpen(false);
    toast({
      title: "Playlist created",
      description: `"${newPlaylistName}" has been created`,
    });
  };

  // Handle remove from favorites
  const handleRemoveFavorite = (songId: string) => {
    removeFromFavorites(songId);
    toast({
      title: "Removed from favorites",
      description: "Song removed from your favorites",
    });
  };

  // Change theme
  const handleThemeChange = (theme: "purple" | "blue" | "green" | "pink") => {
    setTheme(theme);
    toast({
      title: "Theme updated",
      description: `Theme changed to ${theme}`,
    });
  };

  return (
    <div>
      {!isLoggedIn ? (
        <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="ml-2">
              <UserIcon className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Welcome to LofiFy</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder="Enter a username"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleLogin}>Sign In</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="ml-2">
              <UserIcon className="h-4 w-4 mr-2" />
              {user?.username}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>User Profile</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="playlists">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="playlists">
                  <ListMusic className="h-4 w-4 mr-2" />
                  Playlists
                </TabsTrigger>
                <TabsTrigger value="favorites">
                  <Heart className="h-4 w-4 mr-2" />
                  Favorites
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Palette className="h-4 w-4 mr-2" />
                  Themes
                </TabsTrigger>
              </TabsList>
              
              {/* Playlists Tab */}
              <TabsContent value="playlists" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Your Playlists</h3>
                  <Dialog open={playlistDialogOpen} onOpenChange={setPlaylistDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        New Playlist
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Playlist</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="playlist-name">Playlist Name</Label>
                          <Input 
                            id="playlist-name" 
                            value={newPlaylistName} 
                            onChange={(e) => setNewPlaylistName(e.target.value)} 
                            placeholder="My Awesome Lo-fi Mix"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleCreatePlaylist}>Create Playlist</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {user?.playlists.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ListMusic className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No playlists created yet</p>
                    <p className="text-sm">Create your first playlist to save your favorite tracks</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {user?.playlists.map((playlist) => (
                      <Card key={playlist.id}>
                        <CardHeader className="py-3">
                          <CardTitle className="text-base">{playlist.name}</CardTitle>
                          <CardDescription>{playlist.songs.length} songs</CardDescription>
                        </CardHeader>
                        {playlist.songs.length > 0 && (
                          <CardContent className="py-0">
                            <ul className="space-y-1 text-sm">
                              {playlist.songs.map((song, index) => (
                                <li key={index} className="flex justify-between">
                                  <span>{song.title} - {song.artist}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {/* Favorites Tab */}
              <TabsContent value="favorites">
                {(!user?.favorites || user.favorites.length === 0) ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Heart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No favorites added yet</p>
                    <p className="text-sm">Add songs to your favorites while browsing</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    <ul className="space-y-2">
                      {user.favorites.map((songId) => (
                        <li key={songId} className="flex justify-between items-center p-2 bg-card/50 rounded-md">
                          <span>{songId}</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveFavorite(songId)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>
              
              {/* Settings Tab */}
              <TabsContent value="settings">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Select Theme</h3>
                  <div className="grid grid-cols-4 gap-2">
                    <button 
                      onClick={() => handleThemeChange("purple")}
                      className={`w-10 h-10 rounded-full bg-lofi-purple ${user?.theme === "purple" ? "ring-2 ring-primary" : ""}`}
                    >
                      {user?.theme === "purple" && <Check className="text-white m-auto" />}
                    </button>
                    <button 
                      onClick={() => handleThemeChange("blue")}
                      className={`w-10 h-10 rounded-full bg-blue-500 ${user?.theme === "blue" ? "ring-2 ring-primary" : ""}`}
                    >
                      {user?.theme === "blue" && <Check className="text-white m-auto" />}
                    </button>
                    <button 
                      onClick={() => handleThemeChange("green")}
                      className={`w-10 h-10 rounded-full bg-green-500 ${user?.theme === "green" ? "ring-2 ring-primary" : ""}`}
                    >
                      {user?.theme === "green" && <Check className="text-white m-auto" />}
                    </button>
                    <button 
                      onClick={() => handleThemeChange("pink")}
                      className={`w-10 h-10 rounded-full bg-pink-500 ${user?.theme === "pink" ? "ring-2 ring-primary" : ""}`}
                    >
                      {user?.theme === "pink" && <Check className="text-white m-auto" />}
                    </button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Missing label component import
import { Label } from "@/components/ui/label";

export default UserProfile;
