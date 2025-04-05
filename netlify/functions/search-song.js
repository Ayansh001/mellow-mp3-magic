
// This serverless function searches for songs on PagalFree.com
const axios = require('axios');
const cheerio = require('cheerio');

// Helper function to extract download links from song pages
async function extractDownloadLink(songPageUrl) {
  try {
    const response = await axios.get(songPageUrl);
    const $ = cheerio.load(response.data);
    
    // PagalFree typically has download links with specific patterns
    // This may need adjustment based on the website's current structure
    const downloadLink = $('a[href*=".mp3"]').attr('href') || 
                         $('a:contains("320 Kbps")').attr('href') ||
                         $('a:contains("Download")').attr('href');
    
    return downloadLink;
  } catch (error) {
    console.error(`Error extracting download link: ${error}`);
    return null;
  }
}

exports.handler = async (event) => {
  // Get search query from query parameters
  const query = event.queryStringParameters.q;
  
  if (!query) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Search query is required" })
    };
  }
  
  try {
    // Search PagalFree.com
    const searchUrl = `https://pagalfree.com/search/${encodeURIComponent(query)}`;
    console.log(`Searching: ${searchUrl}`);
    
    const response = await axios.get(searchUrl);
    const $ = cheerio.load(response.data);
    
    // Parse search results
    const songs = [];
    
    // This selector may need adjustment based on the website's structure
    $('.plist-block').each(async (index, element) => {
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
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query,
        results: songsWithDownloadLinks
      })
    };
  } catch (error) {
    console.error(`Error searching songs: ${error}`);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to search for songs", details: error.message })
    };
  }
};
