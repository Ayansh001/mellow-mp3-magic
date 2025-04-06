
// This serverless function downloads songs from their source URL
import axios from 'axios';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS request for CORS preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers });
  }
  
  // Get the URL from query parameters
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: "Download URL is required" }, { status: 400, headers });
  }
  
  try {
    // Fetch the file as an array buffer
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    
    // Return the file with appropriate headers
    return new NextResponse(response.data, {
      status: 200,
      headers: {
        ...headers,
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="song.mp3"`,
      },
    });
  } catch (error: any) {
    console.error(`Error downloading song: ${error}`);
    return NextResponse.json(
      { error: "Failed to download song", details: error.message },
      { status: 500, headers }
    );
  }
}
