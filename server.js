const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Vault secret path
const VAULT_SECRET_PATH = 'services/quote-calculator/openrouteservice/api-key';

// This would be replaced with your actual Vault client implementation
async function getSecretFromVault() {
  try {
    // Example Vault client code (you'll need to implement this)
    // const vault = new VaultClient();
    // const secret = await vault.read(VAULT_SECRET_PATH);
    // return secret.data.data.value;
    
    // For now, fall back to reading from file
    return fs.readFileSync('secrets', 'utf8').trim();
  } catch (error) {
    console.error('Error reading secret:', error);
    return null;
  }
}

// Initialize API key
let apiKey;
getSecretFromVault().then(secret => {
  apiKey = secret;
  console.log('API key loaded from vault');
}).catch(error => {
  console.error('Failed to load API key:', error);
  apiKey = null;
});

// Serve static files from the public directory
app.use(express.static('public'));

// Add endpoint to serve API key
app.get('/api/config', (req, res) => {
  res.json({
    apiKey: apiKey || 'YOUR_API_KEY'
  });
});

// Serve index.html for all other routes (for SPA behavior)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); 