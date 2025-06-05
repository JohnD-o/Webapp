module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Log available environment variables (without their values for security)
    console.log('Available environment variables:', Object.keys(process.env));
    
    // Using the environment variable name as set in Vercel
    const apiKey = process.env.ORS_API;
    
    if (!apiKey) {
      console.error('API key not found. Looking for ORS_API in environment variables.');
      throw new Error('API key not configured in environment');
    }

    console.log('API key successfully retrieved from environment');
    res.status(200).json({
      apiKey: apiKey,
      message: 'Configuration loaded successfully'
    });
  } catch (error) {
    console.error('API config error:', error.message);
    res.status(500).json({
      error: 'Failed to load API configuration',
      message: error.message,
      debug: 'Check if ORS_API is set in Vercel environment variables'
    });
  }
}; 