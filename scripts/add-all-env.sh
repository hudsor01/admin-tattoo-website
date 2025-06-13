#!/bin/bash

# Script to push all environment variables from .env to both Vercel environments
echo "🚀 Pushing environment variables to Vercel production and preview..."

# Read .env file and push each variable to both environments
while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip empty lines and comments
    if [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Remove any quotes from the value
    value=$(echo "$value" | sed 's/^"//; s/"$//')
    
    echo "Adding $key to production..."
    echo "$value" | npx vercel env add "$key" production
    
    echo "Adding $key to preview..."
    echo "$value" | npx vercel env add "$key" preview
    
done < .env

echo "✅ Done! All environment variables pushed to both environments."
