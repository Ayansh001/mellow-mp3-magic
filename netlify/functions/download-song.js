
// This serverless function downloads songs from PagalFree.com
const axios = require('axios');

exports.handler = async (event) => {
  // Get download URL from query parameters
  const url = event.queryStringParameters.url;
  
  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Download URL is required" })
    };
  }
  
  try {
    // Download the song
    console.log(`Downloading: ${url}`);
    
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer'
    });
    
    // Get the filename from the URL
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];
    
    // Return the file as a binary response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Access-Control-Allow-Origin': '*'
      },
      body: Buffer.from(response.data, 'binary').toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error(`Error downloading song: ${error}`);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to download song", details: error.message })
    };
  }
};
