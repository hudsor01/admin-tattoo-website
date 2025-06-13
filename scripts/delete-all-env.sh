#!/bin/bash

# Script to delete all environment variables from both Preview and Production
echo "🗑️ Deleting all environment variables from Vercel..."

# List of all variables to delete
vars=(
    "ADMIN_EMAILS"
    "BETTER_AUTH_SECRET"
    "BETTER_AUTH_URL"
    "CAL_API_KEY"
    "CAL_API_URL"
    "CAL_CLIENT_ID"
    "CAL_CLIENT_SECRET"
    "CAL_CONSULTATION_EVENT_ID"
    "CAL_OAUTH_CLIENT_ID"
    "CAL_TATTOO_SESSION_EVENT_ID"
    "CAL_TOUCHUP_EVENT_ID"
    "CAL_WEBHOOK_SECRET"
    "CAL_WEBHOOK_URL"
    "CSRF_SECRET"
    "DATABASE_URL"
    "DIRECT_URL"
    "ENCRYPTION_KEY"
    "GOOGLE_CLIENT_ID"
    "GOOGLE_CLIENT_SECRET"
    "MAIN_WEBSITE_API_KEY"
    "MAIN_WEBSITE_API_URL"
    "NEXT_PUBLIC_API_URL"
    "NEXT_PUBLIC_APP_URL"
    "NEXT_PUBLIC_AUTH_URL"
    "NEXT_PUBLIC_CALCOM_API_URL"
    "NEXT_PUBLIC_CAL_CONSULTATION_EVENT_ID"
    "NEXT_PUBLIC_CAL_USERNAME"
    "NEXT_PUBLIC_GA_MEASUREMENT_ID"
    "NEXT_PUBLIC_MAIN_WEBSITE_URL"
    "NEXT_PUBLIC_REFRESH_URL"
    "NEXT_PUBLIC_X_CAL_ID"
    "RESEND_API_KEY"
    "SMTP_HOST"
    "SMTP_PORT"
    "SMTP_USER"
    "SVIX_API_KEY"
    "SVIX_ENV_ID"
    "X_CAL_SECRET_KEY"
)

echo "Deleting from PRODUCTION environment..."
for var in "${vars[@]}"; do
    echo "  Deleting $var from production..."
    npx vercel env rm "$var" production --yes 2>/dev/null || echo "    (not found)"
done

echo "Deleting from PREVIEW environment..."
for var in "${vars[@]}"; do
    echo "  Deleting $var from preview..."
    npx vercel env rm "$var" preview --yes 2>/dev/null || echo "    (not found)"
done

echo "✅ Done! All environment variables deleted from both environments."
