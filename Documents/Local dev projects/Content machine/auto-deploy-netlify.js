const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AutoNetlifyDeployer {
  constructor() {
    this.baseURL = 'https://api.netlify.com/api/v1';
    this.siteName = 'trendmaster-app-' + Date.now();
  }

  async createSite() {
    try {
      console.log('🚀 Creating Netlify site automatically...');
      
      // First, let's try to get a list of existing sites to see if we can use one
      const sitesResponse = await axios.get(`${this.baseURL}/sites`, {
        headers: {
          'Authorization': `Bearer ${this.getNetlifyToken()}`,
          'Content-Type': 'application/json'
        }
      });

      // Check if we already have a trendmaster site
      const existingSite = sitesResponse.data.find(site => 
        site.name.includes('trendmaster') || site.name.includes('trend')
      );

      if (existingSite) {
        console.log(`✅ Found existing site: ${existingSite.name}`);
        return existingSite;
      }

      // Create new site
      const siteData = {
        name: this.siteName,
        account_slug: 'kingivthe1st',
        force_ssl: true
      };

      const response = await axios.post(`${this.baseURL}/sites`, siteData, {
        headers: {
          'Authorization': `Bearer ${this.getNetlifyToken()}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ New site created successfully!');
      return response.data;
    } catch (error) {
      console.error('❌ Error creating site:', error.response?.data || error.message);
      throw error;
    }
  }

  getNetlifyToken() {
    // Try to get token from environment or .env file
    let token = process.env.NETLIFY_TOKEN;
    
    if (!token && fs.existsSync('.env')) {
      const envContent = fs.readFileSync('.env', 'utf8');
      const match = envContent.match(/NETLIFY_TOKEN=(.+)/);
      if (match) {
        token = match[1].trim();
      }
    }

    if (!token) {
      throw new Error('NETLIFY_TOKEN not found. Please run: node get-token.js');
    }

    return token;
  }

  async deploySite(siteId) {
    try {
      console.log('📦 Building frontend...');
      
      // Build the frontend
      execSync('cd frontend && npm install && npm run build', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      console.log('✅ Frontend built successfully');
      
      // Get the built files
      const buildDir = path.join(process.cwd(), 'frontend', 'build');
      const functionsDir = path.join(process.cwd(), 'netlify', 'functions');
      
      if (!fs.existsSync(buildDir)) {
        throw new Error('Build directory not found. Build failed.');
      }

      console.log('🚀 Deploying to Netlify...');
      
      // Create a zip file for deployment
      const zipPath = await this.createDeploymentZip(buildDir, functionsDir);
      
      // Deploy using the zip file
      const formData = new FormData();
      formData.append('file', fs.createReadStream(zipPath));
      
      const response = await axios.post(`${this.baseURL}/sites/${siteId}/deploys`, formData, {
        headers: {
          'Authorization': `Bearer ${this.getNetlifyToken()}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('🚀 Deployment started!');
      return response.data;
    } catch (error) {
      console.error('❌ Error deploying:', error.response?.data || error.message);
      throw error;
    }
  }

  async createDeploymentZip(buildDir, functionsDir) {
    const archiver = require('archiver');
    const zipPath = path.join(process.cwd(), 'deployment.zip');
    
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      output.on('close', () => resolve(zipPath));
      archive.on('error', reject);
      
      archive.pipe(output);
      
      // Add build files
      archive.directory(buildDir, '');
      
      // Add functions
      if (fs.existsSync(functionsDir)) {
        archive.directory(functionsDir, 'functions');
      }
      
      archive.finalize();
    });
  }

  async waitForDeploy(siteId, deployId) {
    console.log('⏳ Waiting for deployment to complete...');
    
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(`${this.baseURL}/sites/${siteId}/deploys/${deployId}`, {
          headers: {
            'Authorization': `Bearer ${this.getNetlifyToken()}`
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

  async run() {
    try {
      console.log('🚀 Starting automatic Netlify deployment...');
      console.log('==========================================');
      
      // Create site
      const site = await this.createSite();
      console.log(`🌐 Site: ${site.name}`);
      console.log(`🔑 Site ID: ${site.id}`);
      
      // Deploy site
      const deploy = await this.deploySite(site.id);
      console.log(`🔗 Deploy URL: ${deploy.deploy_url}`);
      
      // Wait for deployment to complete
      await this.waitForDeploy(site.id, deploy.id);
      
      console.log('\n🎉 SUCCESS! Your app is now live on Netlify!');
      console.log(`🌐 Live URL: ${site.ssl_url}`);
      console.log(`🔑 Site ID: ${site.id}`);
      console.log('\n💡 Your app will automatically redeploy on every git push!');
      
      // Save site info for future reference
      const siteInfo = {
        siteId: site.id,
        siteUrl: site.ssl_url,
        deployUrl: deploy.deploy_url,
        createdAt: new Date().toISOString()
      };
      
      fs.writeFileSync('netlify-site-info.json', JSON.stringify(siteInfo, null, 2));
      console.log('\n📁 Site information saved to netlify-site-info.json');
      
    } catch (error) {
      console.error('\n❌ Deployment failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the deployment
const deployer = new AutoNetlifyDeployer();
deployer.run();
