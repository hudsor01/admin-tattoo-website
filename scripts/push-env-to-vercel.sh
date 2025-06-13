#!/bin/bash

# Script to push all environment variables from .env to Vercel production
echo "🚀 Pushing environment variables to Vercel production..."

# Read .env file and push each variable
while IFS='=' read -r key value; do
  # Skip empty lines and comments
  if [[ -z "$key" || "$key" =~ ^#.* ]]; then
    continue
  fi
  
  # Remove quotes from value if present
  value=$(echo "$value" | sed 's/^"//;s/"$//')
  
  echo "Setting $key..."
  npx vercel env add "$key" production --force <<< "$value"
done < .env

echo "✅ All environment variables pushed to Vercel production!"
echo "🔄 Now deploying to apply changes..."
npx vercel --prod
