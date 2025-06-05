module.exports = async (req, res) => {
  try {
    // In Vercel, we'll use environment variables instead of Vault
    const apiKey = process.env.OPENROUTE_API_KEY;
    
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