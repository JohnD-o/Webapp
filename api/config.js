module.exports = async (req, res) => {
  try {
    // Using the environment variable name as set in Vercel
    const apiKey = process.env.ORS_API;
    
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    res.json({
      apiKey: apiKey
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to load API configuration',
      message: error.message
    });
  }
}; 