const axios = require('axios');
const fs = require('fs');
const path = require('path');

class NetlifyAutoDeployer {
  constructor() {
    this.netlifyToken = process.env.NETLIFY_TOKEN;
    this.baseURL = 'https://api.netlify.com/api/v1';
  }

  async createSite() {
    try {
      console.log('🚀 Creating Netlify site...');
      
      const siteData = {
        name: 'trendmaster-app',
        account_slug: 'kingivthe1st',
        custom_domain: null,
        force_ssl: true,
        processing_settings: {
          skip: false,
          css: {
            bundle: true,
            minify: true
          },
          js: {
            bundle: true,
            minify: true
          },
          html: {
            pretty_urls: true
          },
          images: {
            compress: true
          }
        }
      };

      const response = await axios.post(`${this.baseURL}/sites`, siteData, {
        headers: {
          'Authorization': `Bearer ${this.netlifyToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Site created successfully!');
      console.log(`🌐 Site URL: ${response.data.ssl_url}`);
      console.log(`🔑 Site ID: ${response.data.id}`);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error creating site:', error.response?.data || error.message);
      throw error;
    }
  }

  async deploySite(siteId) {
    try {
      console.log('📦 Building and deploying...');
      
      // Build the frontend
      const { execSync } = require('child_process');
      execSync('cd frontend && npm install && npm run build', { stdio: 'inherit' });
      
      console.log('✅ Frontend built successfully');
      
      // Deploy to Netlify
      const deployData = {
        files: this.getFilesToDeploy()
      };

      const response = await axios.post(`${this.baseURL}/sites/${siteId}/deploys`, deployData, {
        headers: {
          'Authorization': `Bearer ${this.netlifyToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🚀 Deployment started!');
      console.log(`🔗 Deploy URL: ${response.data.deploy_url}`);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error deploying:', error.response?.data || error.message);
      throw error;
    }
  }

  getFilesToDeploy() {
    const buildDir = path.join(__dirname, 'frontend', 'build');
    const files = {};
    
    this.readDirectoryRecursive(buildDir, '', files);
    
    // Add serverless functions
    const functionsDir = path.join(__dirname, 'netlify', 'functions');
    this.readDirectoryRecursive(functionsDir, 'functions', files);
    
    return files;
  }

  readDirectoryRecursive(dir, prefix, files) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativePath = prefix ? `${prefix}/${item}` : item;
      
      if (fs.statSync(fullPath).isDirectory()) {
        this.readDirectoryRecursive(fullPath, relativePath, files);
      } else {
        const content = fs.readFileSync(fullPath);
        files[relativePath] = content.toString('base64');
      }
    }
  }

  async waitForDeploy(siteId, deployId) {
    console.log('⏳ Waiting for deployment to complete...');
    
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(`${this.baseURL}/sites/${siteId}/deploys/${deployId}`, {
          headers: {
            'Authorization': `Bearer ${this.netlifyToken}`
          }
        });
        
        const deploy = response.data;
        
        if (deploy.state === 'ready') {
          console.log('🎉 Deployment completed successfully!');
          console.log(`🌐 Live URL: ${deploy.ssl_url}`);
          return deploy;
        } else if (deploy.state === 'error') {
          throw new Error(`Deployment failed: ${deploy.error_message}`);
        }
        
        console.log(`⏳ Deployment status: ${deploy.state}`);
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        attempts++;
      } catch (error) {
        console.error('❌ Error checking deployment status:', error.message);
        break;
      }
    }
    
    throw new Error('Deployment timeout');
  }
}

async function main() {
  if (!process.env.NETLIFY_TOKEN) {
    console.error('❌ NETLIFY_TOKEN environment variable is required');
    console.log('💡 Get your token from: https://app.netlify.com/user/settings/applications#personal-access-tokens');
    process.exit(1);
  }

  const deployer = new NetlifyAutoDeployer();
  
  try {
    // Create site
    const site = await deployer.createSite();
    
    // Deploy site
    const deploy = await deployer.deploySite(site.id);
    
    // Wait for deployment to complete
    await deployer.waitForDeploy(site.id, deploy.id);
    
    console.log('\n🎉 SUCCESS! Your app is now live on Netlify!');
    console.log(`🌐 URL: ${site.ssl_url}`);
    console.log(`🔑 Site ID: ${site.id}`);
    console.log('\n💡 Save these details for future reference');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = NetlifyAutoDeployer;
