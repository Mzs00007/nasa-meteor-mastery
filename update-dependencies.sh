#!/bin/bash

# Meteor Madness Dependency Update Script
# Safe, incremental dependency updates with backup and testing

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Backup function
backup_dependencies() {
    log_info "Creating backup of current dependencies..."
    
    # Backup package.json
    cp package.json package.json.backup
    
    # Backup package-lock.json
    if [ -f "package-lock.json" ]; then
        cp package-lock.json package-lock.json.backup
    fi
    
    # Backup Python dependencies (if requirements.txt exists)
    if [ -f "backend/requirements.txt" ]; then
        cp backend/requirements.txt backend/requirements.txt.backup
    fi
    
    log_success "Backup created successfully"
}

# Update NPM dependencies
update_npm_dependencies() {
    log_info "Updating NPM dependencies..."
    
    # Update non-breaking dependencies first
    log_info "Updating patch and minor versions..."
    npm update
    
    # Update specific packages with care
    log_info "Updating specific packages..."
    
    # Update axios (HTTP client)
    npm install axios@latest
    
    # Update Three.js (3D graphics)
    npm install three@latest
    
    # Update D3.js (data visualization)
    npm install d3@latest
    
    # Update Bootstrap
    npm install bootstrap@latest
    
    # Update Tailwind CSS
    npm install tailwindcss@latest
    
    log_success "NPM dependencies updated successfully"
}

# Update Python dependencies
update_python_dependencies() {
    log_info "Updating Python dependencies..."
    
    if command -v pip &> /dev/null; then
        # Update all Python packages
        pip install --upgrade pip
        
        # Update specific packages
        pip install --upgrade \
            numpy \
            psutil \
            MarkupSafe \
            flatbuffers \
            grpcio
        
        log_success "Python dependencies updated successfully"
    else
        log_warning "pip not found, skipping Python dependency updates"
    fi
}

# Security audit function
run_security_audit() {
    log_info "Running security audit..."
    
    # NPM audit
    if npm audit; then
        log_success "NPM audit passed"
    else
        log_warning "NPM audit found vulnerabilities"
        log_info "Running npm audit fix..."
        if npm audit fix; then
            log_success "NPM audit fix applied successfully"
        else
            log_warning "Some vulnerabilities may require manual intervention"
        fi
    fi
    
    # Python security check (if available)
    if command -v safety &> /dev/null; then
        log_info "Running Python security check..."
        safety check
    fi
}

# Test function
run_tests() {
    log_info "Running tests to verify updates..."
    
    # Run NPM tests
    if npm test -- --passWithNoTests; then
        log_success "All tests passed"
    else
        log_error "Tests failed after dependency updates"
        log_info "Restoring backup..."
        restore_backup
        exit 1
    fi
}

# Build function
run_build() {
    log_info "Building project to verify compatibility..."
    
    if npm run build; then
        log_success "Build successful"
    else
        log_error "Build failed after dependency updates"
        log_info "Restoring backup..."
        restore_backup
        exit 1
    fi
}

# Restore backup function
restore_backup() {
    log_info "Restoring from backup..."
    
    # Restore package.json
    mv package.json.backup package.json
    
    # Restore package-lock.json
    if [ -f "package-lock.json.backup" ]; then
        mv package-lock.json.backup package-lock.json
    fi
    
    # Restore Python requirements
    if [ -f "backend/requirements.txt.backup" ]; then
        mv backend/requirements.txt.backup backend/requirements.txt
    fi
    
    # Reinstall original dependencies
    npm install
    
    log_success "Backup restored successfully"
}

# Main execution
main() {
    log_info "Starting Meteor Madness dependency update process"
    
    # Step 1: Backup
    backup_dependencies
    
    # Step 2: Update dependencies
    update_npm_dependencies
    update_python_dependencies
    
    # Step 3: Security audit
    run_security_audit
    
    # Step 4: Test
    run_tests
    
    # Step 5: Build
    run_build
    
    # Step 6: Cleanup
    log_info "Cleaning up backup files..."
    rm -f package.json.backup package-lock.json.backup
    if [ -f "backend/requirements.txt.backup" ]; then
        rm -f backend/requirements.txt.backup
    fi
    
    log_success "Dependency update process completed successfully!"
    log_info "Current versions:"
    npm list --depth=0
    
    if command -v pip &> /dev/null; then
        pip list --outdated
    fi
}

# Handle errors
trap 'log_error "Script failed. Restoring backup..."; restore_backup; exit 1' ERR

# Run main function
main "$@"