const vault = require('node-vault')({
  apiVersion: 'v1',
    endpoint: 'https://vault.roboticrabbitsyndicate.io',
    token: 'hvs.HmEZTkSeljnLRiXqlPghsZbC'
});

async function getSecrets() {
  try {
    // Read secrets from Vault
    const result = await vault.read('secret/data/rrs-be');
    
    // Set environment variables from secrets
    const secrets = result.data.data;
    Object.keys(secrets).forEach(key => {
      process.env[key] = secrets[key];
    });
    
    console.log('Secrets loaded from Vault successfully');
  } catch (error) {
    console.error('Error fetching secrets from Vault:', error.message);
    // Fallback to local env vars if Vault is unavailable
    console.log('Using local environment variables as fallback');
  }
}

module.exports = { getSecrets };
