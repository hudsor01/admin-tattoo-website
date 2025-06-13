#!/bin/bash

# Script to push all environment variables from .env to Vercel production
echo "🚀 Pushing environment variables to Vercel production..."

# Read .env file and push each variable to Vercel production
while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip empty lines and comments
    if [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Remove any quotes from the value
    value=$(echo "$value" | sed 's/^"//; s/"$//')
    
    echo "Setting $key..."
    npx vercel env add "$key" production <<< "$value"
done < .env

echo "✅ Done! All environment variables pushed to production."
