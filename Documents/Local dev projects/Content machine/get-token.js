const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔑 Netlify Token Setup');
console.log('======================');
console.log('');
console.log('To deploy automatically, you need a Netlify personal access token.');
console.log('');
console.log('📋 Steps to get your token:');
console.log('1. Go to: https://app.netlify.com/user/settings/applications#personal-access-tokens');
console.log('2. Click "New access token"');
console.log('3. Give it a name (e.g., "TrendMaster Deploy")');
console.log('4. Copy the token');
console.log('');

rl.question('🔑 Paste your Netlify token here: ', (token) => {
  if (token.trim()) {
    // Create .env file
    const envContent = `NETLIFY_TOKEN=${token.trim()}`;
    fs.writeFileSync('.env', envContent);
    
    console.log('');
    console.log('✅ Token saved to .env file');
    console.log('');
    console.log('🚀 Now you can deploy with: npm run deploy');
    console.log('');
    
    // Ask if they want to deploy now
    rl.question('🚀 Deploy now? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        console.log('');
        console.log('🚀 Starting deployment...');
        console.log('');
        
        // Install dependencies and deploy
        const { execSync } = require('child_process');
        try {
          execSync('npm install', { stdio: 'inherit' });
          execSync('npm run deploy', { stdio: 'inherit' });
        } catch (error) {
          console.error('❌ Deployment failed:', error.message);
        }
      } else {
        console.log('');
        console.log('💡 To deploy later, run: npm run deploy');
      }
      
      rl.close();
    });
  } else {
    console.log('❌ No token provided. Please run this script again with a valid token.');
    rl.close();
  }
});
