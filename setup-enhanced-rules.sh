#!/bin/bash

# ===========================================
# StarShop Backend Enhanced Rules Setup
# ===========================================
# This script sets up enhanced contribution rules and quality gates

set -e

echo "🚀 Setting up enhanced contribution rules for StarShop Backend..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_status "Installing required dependencies..."

# Install Zod for environment validation
npm install zod

# Install additional dev dependencies if not present
npm install --save-dev jest-watch-typeahead

print_success "Dependencies installed"

# Make husky pre-commit hook executable
print_status "Setting up pre-commit hooks..."
chmod +x .husky/pre-commit

print_success "Pre-commit hooks configured"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_status "Creating .env file from template..."
    cp .env.example .env 2>/dev/null || print_warning "Could not copy .env.example (file may not exist)"
    print_success ".env file created"
else
    print_warning ".env file already exists, skipping creation"
fi

# Create .env.test file if it doesn't exist
if [ ! -f ".env.test" ]; then
    print_status "Creating .env.test file..."
    cat > .env.test << 'EOF'
# Test Environment Configuration
NODE_ENV=test
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=test_user
DB_PASSWORD=test_password
DB_DATABASE=starshop_test
DB_SSL=false
JWT_SECRET=test-jwt-secret-key-for-testing-only
JWT_EXPIRATION_TIME=1h
AWS_ACCESS_KEY_ID=test_access_key
AWS_SECRET_ACCESS_KEY=test_secret_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=test_bucket
CLOUDINARY_CLOUD_NAME=test_cloud
CLOUDINARY_API_KEY=test_api_key
CLOUDINARY_API_SECRET=test_api_secret
SUPABASE_URL=https://test-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=test_service_role_key
PUSHER_APP_ID=test_app_id
PUSHER_KEY=test_key
PUSHER_SECRET=test_secret
PUSHER_CLUSTER=us2
EOF
    print_success ".env.test file created"
else
    print_warning ".env.test file already exists, skipping creation"
fi

# Update jest configuration
print_status "Updating Jest configuration..."
if [ -f "jest.config.js" ]; then
    cp jest.config.js jest.config.js.backup
    print_status "Backed up existing jest.config.js"
fi

# Copy enhanced jest config
cp jest.config.enhanced.js jest.config.js
print_success "Jest configuration updated"

# Run initial linting and formatting
print_status "Running initial code quality checks..."

# Check if there are any linting issues
if npm run lint > /dev/null 2>&1; then
    print_success "Linting passed"
else
    print_warning "Linting issues found. Run 'npm run lint:fix' to fix them."
fi

# Check formatting
if npm run format:check > /dev/null 2>&1; then
    print_success "Code formatting is correct"
else
    print_warning "Code formatting issues found. Run 'npm run format' to fix them."
fi

# Check for direct process.env usage
print_status "Checking for direct process.env usage..."
if grep -r "process\.env\." src/ --exclude-dir=node_modules --exclude="*.spec.ts" --exclude="*.test.ts" > /dev/null 2>&1; then
    print_warning "Direct process.env usage detected. Please update to use centralized config."
    echo "Files with direct process.env usage:"
    grep -r "process\.env\." src/ --exclude-dir=node_modules --exclude="*.spec.ts" --exclude="*.test.ts" -l
else
    print_success "No direct process.env usage found"
fi

# Check for console.log statements
print_status "Checking for console.log statements..."
if grep -r "console\.log" src/ --exclude-dir=node_modules --exclude="*.spec.ts" --exclude="*.test.ts" > /dev/null 2>&1; then
    print_warning "console.log statements found. Please remove them before committing."
    echo "Files with console.log statements:"
    grep -r "console\.log" src/ --exclude-dir=node_modules --exclude="*.spec.ts" --exclude="*.test.ts" -l
else
    print_success "No console.log statements found"
fi

# Run tests
print_status "Running tests..."
if npm run test:ci > /dev/null 2>&1; then
    print_success "All tests passed"
else
    print_warning "Some tests failed. Please check the test output."
fi

print_success "Enhanced rules setup completed!"

echo ""
echo "📋 Next Steps:"
echo "1. Review and update your .env file with actual values"
echo "2. Run 'npm run lint:fix' to fix any linting issues"
echo "3. Run 'npm run format' to format your code"
echo "4. Run 'npm run test:ci' to ensure all tests pass"
echo "5. Update any direct process.env usage to use centralized config"
echo "6. Remove any console.log statements"
echo ""
echo "🔧 Available Commands:"
echo "- npm run lint          # Check code quality"
echo "- npm run lint:fix      # Fix linting issues"
echo "- npm run format        # Format code"
echo "- npm run format:check  # Check formatting"
echo "- npm run test:ci       # Run tests with coverage"
echo "- npm run pre-commit    # Run all pre-commit checks"
echo ""
echo "📚 Documentation:"
echo "- CONTRIBUTION_RULES_ENHANCED.md - Enhanced contribution rules"
echo "- .cursorrules - Cursor AI specific rules"
echo ""
print_success "Setup complete! Happy coding! 🎉"
