
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface AnalyticsProps {
  className?: string;
}

// Mock data storage for analytics
const useMockAnalytics = () => {
  // Initialize from localStorage if available
  const [listenData, setListenData] = useState<{
    songId: string;
    songName: string;
    count: number;
    date: string;
    effects: string[];
  }[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lofi_analytics");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [effectUsage, setEffectUsage] = useState<{
    effect: string;
    count: number;
  }[]>([
    { effect: "Lo-fi Mode", count: 0 },
    { effect: "Vinyl Crackle", count: 0 },
    { effect: "Reverb", count: 0 },
    { effect: "Slowed Down", count: 0 },
    { effect: "Jazz Mode", count: 0 }
  ]);

  // Update localStorage when data changes
  useEffect(() => {
    localStorage.setItem("lofi_analytics", JSON.stringify(listenData));
    
    // Calculate effect usage from listen data
    const effects = {
      "Lo-fi Mode": 0,
      "Vinyl Crackle": 0,
      "Reverb": 0,
      "Slowed Down": 0,
      "Jazz Mode": 0
    };
    
    listenData.forEach(item => {
      item.effects.forEach(effect => {
        if (effect in effects) {
          effects[effect as keyof typeof effects]++;
        }
      });
    });
    
    setEffectUsage([
      { effect: "Lo-fi Mode", count: effects["Lo-fi Mode"] },
      { effect: "Vinyl Crackle", count: effects["Vinyl Crackle"] },
      { effect: "Reverb", count: effects["Reverb"] },
      { effect: "Slowed Down", count: effects["Slowed Down"] },
      { effect: "Jazz Mode", count: effects["Jazz Mode"] }
    ]);
  }, [listenData]);

  // Record a listen with active effects
  const recordListen = (songId: string, songName: string, activeEffects: string[]) => {
    const today = new Date().toISOString().split("T")[0];
    
    setListenData(prev => {
      // Check if we already have this song/date combo
      const existingIndex = prev.findIndex(
        item => item.songId === songId && item.date === today
      );
      
      if (existingIndex >= 0) {
        // Update existing entry
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          count: updated[existingIndex].count + 1,
          effects: [...activeEffects]
        };
        return updated;
      } else {
        // Add new entry
        return [
          ...prev,
          {
            songId,
            songName,
            count: 1,
            date: today,
            effects: [...activeEffects]
          }
        ];
      }
    });
  };

  // Get top songs
  const getTopSongs = () => {
    const songCounts: Record<string, { name: string; count: number }> = {};
    
    listenData.forEach(item => {
      if (!songCounts[item.songId]) {
        songCounts[item.songId] = { name: item.songName, count: 0 };
      }
      songCounts[item.songId].count += item.count;
    });
    
    return Object.values(songCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(song => ({
        name: song.name.length > 20 ? song.name.substring(0, 17) + "..." : song.name,
        count: song.count
      }));
  };

  return {
    recordListen,
    getTopSongs,
    effectUsage
  };
};

const Analytics = ({ className }: AnalyticsProps) => {
  const { getTopSongs, effectUsage } = useMockAnalytics();
  const [topSongs, setTopSongs] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    setTopSongs(getTopSongs());
  }, []);

  // Helper to generate empty placeholder data if no real data exists
  const getPlaceholderData = () => {
    if (topSongs.length > 0) return topSongs;
    
    return [
      { name: "No data yet", count: 0 },
      { name: "Listen to songs", count: 0 },
      { name: "to see analytics", count: 0 }
    ];
  };

  return (
    <Card className={`${className} overflow-hidden`}>
      <CardHeader>
        <CardTitle className="text-lg">Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="songs">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="songs">Top Songs</TabsTrigger>
            <TabsTrigger value="effects">Effects Usage</TabsTrigger>
          </TabsList>
          
          <TabsContent value="songs" className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getPlaceholderData()} layout="vertical">
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#9b87f5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="effects" className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={effectUsage} layout="vertical">
                <XAxis type="number" />
                <YAxis type="category" dataKey="effect" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#9b87f5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default Analytics;
