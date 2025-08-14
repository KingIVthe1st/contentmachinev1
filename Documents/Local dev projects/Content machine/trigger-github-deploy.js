const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Triggering GitHub-based Netlify deployment...');
console.log('===============================================');

try {
  // Step 1: Create a deployment branch
  console.log('📝 Creating deployment branch...');
  execSync('git checkout -b deploy-trigger', { stdio: 'inherit' });
  
  // Step 2: Add all files
  console.log('📦 Adding all files...');
  execSync('git add .', { stdio: 'inherit' });
  
  // Step 3: Commit changes
  console.log('💾 Committing changes...');
  execSync('git commit -m "Trigger Netlify deployment"', { stdio: 'inherit' });
  
  // Step 4: Push to trigger deployment
  console.log('🚀 Pushing to trigger deployment...');
  execSync('git push origin deploy-trigger', { stdio: 'inherit' });
  
  // Step 5: Switch back to main
  console.log('🔄 Switching back to main branch...');
  execSync('git checkout main', { stdio: 'inherit' });
  
  // Step 6: Delete the deployment branch
  console.log('🗑️ Cleaning up deployment branch...');
  execSync('git branch -D deploy-trigger', { stdio: 'inherit' });
  
  console.log('\n🎉 SUCCESS! Deployment triggered!');
  console.log('\n📋 Next steps:');
  console.log('1. Go to your Netlify dashboard');
  console.log('2. Click "Add new project"');
  console.log('3. Choose "Import an existing project"');
  console.log('4. Select your GitHub repository: KingIVthe1st/contentmachinev1');
  console.log('5. Set build command: cd frontend && npm install && npm run build');
  console.log('6. Set publish directory: frontend/build');
  console.log('7. Click "Deploy site"');
  console.log('\n💡 Once connected, every push to main will auto-deploy!');
  
} catch (error) {
  console.error('\n❌ Error triggering deployment:', error.message);
  console.log('\n🔧 Manual deployment required:');
  console.log('1. Go to your Netlify dashboard');
  console.log('2. Click "Add new project"');
  console.log('3. Choose "Import an existing project"');
  console.log('4. Select: KingIVthe1st/contentmachinev1');
  console.log('5. Deploy!');
}
