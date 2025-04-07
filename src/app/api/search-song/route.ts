
// This serverless function searches for songs on PagalFree.com
import axios from 'axios';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

// Helper function to extract download links from song pages
async function extractDownloadLink(songPageUrl: string) {
  try {
    const response = await axios.get(songPageUrl);
    const $ = cheerio.load(response.data);
    
    // PagalFree typically has download links with specific patterns
    const downloadLink = $('a[href*=".mp3"]').attr('href') || 
                         $('a:contains("320 Kbps")').attr('href') ||
                         $('a:contains("Download")').attr('href');
    
    return downloadLink;
  } catch (error) {
    console.error(`Error extracting download link: ${error}`);
    return null;
  }
}

// This function handles the GET request for searching songs
export async function GET(request: Request) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request for CORS preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers });
  }
  
  try {
    // Get the URL to extract query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400, headers });
    }
    
    // Search PagalFree.com
    const searchUrl = `https://pagalfree.com/search/${encodeURIComponent(query)}`;
    console.log(`Searching: ${searchUrl}`);
    
    const response = await axios.get(searchUrl);
    const $ = cheerio.load(response.data);
    
    // Parse search results
    const songs = [];
    
    // This selector may need adjustment based on the website's structure
    $('.plist-block').each((index, element) => {
      const title = $(element).find('.link-reset').text().trim();
      const songPageUrl = $(element).find('.link-reset').attr('href');
      const artist = $(element).find('.specific-authors').text().trim();
      
      if (title && songPageUrl) {
        songs.push({
          title,
          artist,
          songPageUrl,
          id: `song-${index}`
        });
      }
    });
    
    // For each song, get the actual download link
    const songsWithDownloadLinks = await Promise.all(songs.slice(0, 5).map(async (song) => {
      const downloadLink = await extractDownloadLink(song.songPageUrl);
      return {
        ...song,
        downloadLink
      };
    }));
    
    // Return proper JSON response
    return NextResponse.json({
      query,
      results: songsWithDownloadLinks
    }, { headers });
    
  } catch (error: any) {
    console.error(`Error searching songs: ${error.message}`);
    // Ensure we always return JSON
    return NextResponse.json(
      { error: "Failed to search for songs", details: error.message || "Unknown error" },
      { status: 500, headers }
    );
  }
}
