#!/bin/bash

# Read .env file and push each variable to Vercel production
while IFS='=' read -r key value; do
    # Skip empty lines and comments
    if [[ -z "$key" || "$key" =~ ^#.* ]]; then
        continue
    fi
    
    # Remove quotes from value if present
    value=$(echo "$value" | sed 's/^"//;s/"$//')
    
    echo "Setting $key..."
    echo "$value" | npx vercel env add "$key" production
done < .env
