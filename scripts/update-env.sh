#!/bin/bash

# Script to remove and re-add environment variables to Vercel production
echo "🚀 Updating environment variables in Vercel production..."

# Array of critical variables to update
critical_vars=(
    "NEXT_PUBLIC_APP_URL"
    "NEXT_PUBLIC_API_URL" 
    "BETTER_AUTH_URL"
    "DATABASE_URL"
    "BETTER_AUTH_SECRET"
    "CSRF_SECRET"
    "ENCRYPTION_KEY"
    "NEXT_PUBLIC_AUTH_URL"
)

# Read .env file and create associative array
declare -A env_vars
while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip empty lines and comments
    if [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Remove any quotes from the value
    value=$(echo "$value" | sed 's/^"//; s/"$//')
    env_vars["$key"]="$value"
done < .env

# Update critical variables
for var in "${critical_vars[@]}"; do
    if [[ -n "${env_vars[$var]}" ]]; then
        echo "Removing existing $var..."
        npx vercel env rm "$var" production --yes 2>/dev/null || true
        
        echo "Adding $var..."
        echo "${env_vars[$var]}" | npx vercel env add "$var" production
    fi
done

echo "✅ Done! Critical environment variables updated in production."
