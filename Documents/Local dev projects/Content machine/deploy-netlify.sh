#!/bin/bash

echo "🚀 Deploying TrendMaster to Netlify..."
echo "======================================"

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "📦 Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Check if user is logged in to Netlify
if ! netlify status &> /dev/null; then
    echo "🔐 Please log in to Netlify..."
    echo "This will open a browser window for authentication."
    netlify login
fi

echo "🌐 Deploying to Netlify..."
echo "This will create a new site and deploy your app."

# Deploy to Netlify
netlify deploy --prod --dir=frontend/build --functions=netlify/functions

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Your app is now live on Netlify!"
echo "Check the output above for your live URL."
echo ""
echo "Next steps:"
echo "1. Test your live application"
echo "2. Set up custom domain (optional)"
echo "3. Configure environment variables if needed"
echo ""
echo "Your app will automatically redeploy on every git push!"
