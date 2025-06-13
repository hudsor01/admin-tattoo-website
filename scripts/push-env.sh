#!/bin/bash

# Function to check if environment variable exists in Vercel
check_env_exists() {
    local key="$1"
    # List all environment variables and check if the key exists
    local env_list=$(npx vercel env ls production 2>/dev/null)
    
    # Debug: Show what we're checking against (uncomment for debugging)
    echo "DEBUG: Checking for '$key' in:"
    echo "$env_list"
    
    # Check multiple patterns to handle different output formats
    if echo "$env_list" | grep -q "^$key " || echo "$env_list" | grep -q "^$key$" || echo "$env_list" | grep -q " $key "; then
        return 0  # Found
    else
        return 1  # Not found
    fi
}

# Function to update existing environment variable
update_env() {
    local key="$1"
    local value="$2"
    echo "Updating existing variable: $key..."
    # Remove the existing variable
    npx vercel env rm "$key" production --yes 2>/dev/null
    # Add the new value
    echo "$value" | npx vercel env add "$key" production
}

# Function to add new environment variable
add_env() {
    local key="$1"
    local value="$2"
    echo "Adding new variable: $key..."
    echo "$value" | npx vercel env add "$key" production
}

echo "Starting environment variable sync with Vercel..."
echo "Reading from .env file..."

# Check if .env file exists
if [[ ! -f .env ]]; then
    echo "Error: .env file not found!"
    exit 1
fi

# Read .env file and process each variable
while IFS='=' read -r key value; do
    # Skip empty lines and comments
    if [[ -z "$key" || "$key" =~ ^#.* ]]; then
        continue
    fi
    
    # Remove quotes from value if present
    value=$(echo "$value" | sed 's/^"//;s/"$//')
    
    # Skip if key or value is empty after processing
    if [[ -z "$key" || -z "$value" ]]; then
        continue
    fi
    
    echo "Processing: $key"
    
    # Check if the environment variable already exists
    if check_env_exists "$key"; then
        update_env "$key" "$value"
    else
        add_env "$key" "$value"
    fi
    
    # Small delay to avoid rate limiting
    sleep 0.5
    
done < .env

echo "Environment variable sync completed!"
echo "All variables from .env have been synchronized with Vercel production environment."
