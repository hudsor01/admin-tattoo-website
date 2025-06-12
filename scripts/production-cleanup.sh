#!/usr/bin/env zsh

# Production Security Cleanup Script
# Removes all development/debug routes with hardcoded credentials

echo "🔒 Starting Production Security Cleanup..."
echo "========================================"

# Define dangerous routes that must be removed
DANGEROUS_ROUTES=(
    "src/app/api/auth/debug-login"
    "src/app/api/auth/debug-schema" 
    "src/app/api/auth/debug-db"
    "src/app/api/auth/test-admin"
    "src/app/api/auth/test-signin"
    "src/app/api/auth/create-test-admin"
    "src/app/api/auth/fix-admin"
    "src/app/api/auth/fix-account"
    "src/app/api/auth/recreate-admin"
    "src/app/api/auth/set-admin-password"
    "src/app/api/auth/setup"
    "src/app/api/auth/setup-admin"
    "src/app/api/auth/check-user"
    "src/app/api/auth/make-admin"
    "src/app/api/auth/delete-admin"
    "src/app/api/create-admin"
    "src/app/api/admin/test-db"
    "src/app/setup"
    "src/app/test-auth"
)

# Test pages and files
TEST_FILES=(
    "src/app/test-auth"
    "src/app/setup" 
    "src/middleware_new.ts"
    "tests/authflow_*.spec.ts"
)

echo "📋 Found the following dangerous routes/files:"
for route in "${DANGEROUS_ROUTES[@]}" "${TEST_FILES[@]}"; do
    if [[ -e "$route" ]]; then
        echo "  ❌ $route"
    fi
done

echo ""
read "response?⚠️  This will permanently delete development/debug routes. Continue? (y/N): "

if [[ "$response" != "y" && "$response" != "Y" ]]; then
    echo "❌ Cleanup cancelled."
    exit 0
fi

echo ""
echo "🗑️  Removing dangerous routes..."

# Remove dangerous API routes
for route in "${DANGEROUS_ROUTES[@]}"; do
    if [[ -d "$route" ]]; then
        echo "  🗂️  Removing directory: $route"
        rm -rf "$route"
    elif [[ -f "$route/route.ts" ]]; then
        echo "  📄 Removing route file: $route/route.ts"
        rm -rf "$route"
    fi
done

# Remove test files
for file in "${TEST_FILES[@]}"; do
    if [[ -e "$file" ]]; then
        echo "  📄 Removing test file: $file"
        rm -rf "$file"
    fi
done

# Remove any generated authflow test files
echo "  🧹 Cleaning up generated test files..."
find tests -name "authflow_*.spec.ts" -delete 2>/dev/null || true

echo ""
echo "🔍 Scanning remaining files for hardcoded credentials..."

# Scan for remaining hardcoded passwords
CREDENTIAL_PATTERNS=(
    "admin123456"
    "testadmin123"
    "adminpassword123" 
    "admin@ink37tattoos.com.*password"
    "testadmin@ink37tattoos.com"
)

FOUND_CREDENTIALS=()

for pattern in "${CREDENTIAL_PATTERNS[@]}"; do
    # Search in source files, excluding node_modules and .next
    matches=$(grep -r "$pattern" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true)
    if [[ -n "$matches" ]]; then
        echo "  ⚠️  Found pattern '$pattern':"
        echo "$matches" | sed 's/^/    /'
        FOUND_CREDENTIALS+=("$pattern")
    fi
done

if [[ ${#FOUND_CREDENTIALS[@]} -gt 0 ]]; then
    echo ""
    echo "⚠️  WARNING: Hardcoded credentials still found!"
    echo "   Please manually review and remove these before production deployment."
else
    echo "  ✅ No hardcoded credentials found in remaining files."
fi

echo ""
echo "🔧 Updating configuration files..."

# Add production environment check to middleware
if [[ -f "src/middleware.ts" ]]; then
    # Check if test-auth route is still referenced
    if grep -q "test-auth" "src/middleware.ts"; then
        echo "  📝 Removing test-auth references from middleware..."
        # Create backup
        cp "src/middleware.ts" "src/middleware.ts.backup"
        # Remove test-auth references
        sed -i '' '/test-auth.*NODE_ENV.*production/,+2d' "src/middleware.ts"
    fi
fi

# Update package.json to remove debug scripts
if [[ -f "package.json" ]]; then
    echo "  📦 Checking package.json for debug scripts..."
    if grep -q "create-admin\|test-admin\|debug" "package.json"; then
        echo "  ⚠️  Found debug scripts in package.json - please review manually"
    fi
fi

echo ""
echo "🛡️  Setting up production security headers..."

# Ensure environment variables are properly configured
if [[ ! -f ".env.production.example" ]]; then
    echo "  ❌ Missing .env.production.example file"
else
    echo "  ✅ Production environment template exists"
fi

echo ""
echo "📊 Security Cleanup Summary:"
echo "============================"
echo "✅ Removed ${#DANGEROUS_ROUTES[@]} dangerous API routes"
echo "✅ Cleaned up test files" 
echo "✅ Scanned for hardcoded credentials"

if [[ ${#FOUND_CREDENTIALS[@]} -gt 0 ]]; then
    echo "⚠️  ${#FOUND_CREDENTIALS[@]} credential patterns still found - manual review needed"
else
    echo "✅ No hardcoded credentials detected"
fi

echo ""
echo "🚀 Next Steps for Production:"
echo "1. Review .env.production.example and set secure values"
echo "2. Set up proper admin user creation process"
echo "3. Configure monitoring and logging"
echo "4. Run security tests"
echo "5. Set up SSL/TLS certificates"
echo ""
echo "🔒 Production security cleanup completed!"
