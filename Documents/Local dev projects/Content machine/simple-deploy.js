const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SimpleNetlifyDeployer {
  constructor() {
    this.siteName = 'trendmaster-app';
  }

  async run() {
    try {
      console.log('🚀 Starting simple Netlify deployment...');
      console.log('========================================');
      
      // Step 1: Build the frontend
      console.log('📦 Building frontend...');
      execSync('cd frontend && npm install && npm run build', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Frontend built successfully');
      
      // Step 2: Create netlify.toml if it doesn't exist
      if (!fs.existsSync('netlify.toml')) {
        console.log('📝 Creating netlify.toml...');
        const netlifyConfig = `[build]
  base = "."
  command = "cd frontend && npm install && npm run build"
  publish = "frontend/build"
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200`;
        
        fs.writeFileSync('netlify.toml', netlifyConfig);
        console.log('✅ netlify.toml created');
      }
      
      // Step 3: Try to deploy using netlify deploy with specific options
      console.log('🚀 Deploying to Netlify...');
      
      try {
        // First, try to link to existing project
        execSync('netlify link --name trendmaster-app', { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        console.log('✅ Linked to existing project');
      } catch (error) {
        console.log('📝 Creating new project...');
        // Create new project
        execSync('netlify sites:create --name trendmaster-app --manual', { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
      }
      
      // Step 4: Deploy
      console.log('🚀 Starting deployment...');
      execSync('netlify deploy --prod --dir=frontend/build --functions=netlify/functions', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      console.log('\n🎉 SUCCESS! Your app is now live on Netlify!');
      console.log('\n💡 To get your live URL, run: netlify status');
      
    } catch (error) {
      console.error('\n❌ Deployment failed:', error.message);
      console.log('\n🔧 Alternative: Use the manual deployment method');
      console.log('1. Go to your Netlify dashboard');
      console.log('2. Click "Add new project"');
      console.log('3. Choose "Import an existing project"');
      console.log('4. Select your GitHub repository: KingIVthe1st/contentmachinev1');
      console.log('5. Click "Deploy site"');
      process.exit(1);
    }
  }
}

// Run the deployment
const deployer = new SimpleNetlifyDeployer();
deployer.run();
