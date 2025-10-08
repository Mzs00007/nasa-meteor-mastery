@echo off
REM Meteor Madness Dependency Update Script for Windows
REM Safe, incremental dependency updates with backup and testing

setlocal enabledelayedexpansion

REM Colors for output (Windows compatible)
set "RED="
set "GREEN="
set "YELLOW="
set "BLUE="
set "NC="

REM Logging functions
:log_info
echo [INFO] %*
goto :eof

:log_success
echo [SUCCESS] %*
goto :eof

:log_warning
echo [WARNING] %*
goto :eof

:log_error
echo [ERROR] %*
goto :eof

REM Backup function
:backup_dependencies
call :log_info "Creating backup of current dependencies..."

REM Backup package.json
if exist package.json (
    copy package.json package.json.backup >nul
)

REM Backup package-lock.json
if exist package-lock.json (
    copy package-lock.json package-lock.json.backup >nul
)

REM Backup Python dependencies (if requirements.txt exists)
if exist backend\requirements.txt (
    copy backend\requirements.txt backend\requirements.txt.backup >nul
)

call :log_success "Backup created successfully"
goto :eof

REM Update NPM dependencies
:update_npm_dependencies
call :log_info "Updating NPM dependencies..."

REM Update non-breaking dependencies first
call :log_info "Updating patch and minor versions..."
npm update

REM Update specific packages with care
call :log_info "Updating specific packages..."

REM Update axios (HTTP client)
npm install axios@latest

REM Update Three.js (3D graphics)
npm install three@latest

REM Update D3.js (data visualization)
npm install d3@latest

REM Update Bootstrap
npm install bootstrap@latest

REM Update Tailwind CSS
npm install tailwindcss@latest

call :log_success "NPM dependencies updated successfully"
goto :eof

REM Security audit function
:run_security_audit
call :log_info "Running security audit..."

REM NPM audit
npm audit
if !errorlevel! equ 0 (
    call :log_success "NPM audit passed"
) else (
    call :log_warning "NPM audit found vulnerabilities"
    call :log_info "Running npm audit fix..."
    npm audit fix
    if !errorlevel! equ 0 (
        call :log_success "NPM audit fix applied successfully"
    ) else (
        call :log_warning "Some vulnerabilities may require manual intervention"
    )
)

goto :eof

REM Test function
:run_tests
call :log_info "Running tests to verify updates..."

REM Run NPM tests
npm test -- --passWithNoTests
if !errorlevel! equ 0 (
    call :log_success "All tests passed"
) else (
    call :log_error "Tests failed after dependency updates"
    call :log_info "Restoring backup..."
    call :restore_backup
    exit /b 1
)

goto :eof

REM Build function
:run_build
call :log_info "Building project to verify compatibility..."

npm run build
if !errorlevel! equ 0 (
    call :log_success "Build successful"
) else (
    call :log_error "Build failed after dependency updates"
    call :log_info "Restoring backup..."
    call :restore_backup
    exit /b 1
)

goto :eof

REM Restore backup function
:restore_backup
call :log_info "Restoring from backup..."

REM Restore package.json
if exist package.json.backup (
    move /Y package.json.backup package.json >nul
)

REM Restore package-lock.json
if exist package-lock.json.backup (
    move /Y package-lock.json.backup package-lock.json >nul
)

REM Restore Python requirements
if exist backend\requirements.txt.backup (
    move /Y backend\requirements.txt.backup backend\requirements.txt >nul
)

REM Reinstall original dependencies
npm install

call :log_success "Backup restored successfully"
goto :eof

REM Main execution
:main
call :log_info "Starting Meteor Madness dependency update process"

REM Step 1: Backup
call :backup_dependencies

REM Step 2: Update dependencies
call :update_npm_dependencies

REM Step 3: Security audit
call :run_security_audit

REM Step 4: Test
call :run_tests

REM Step 5: Build
call :run_build

REM Step 6: Cleanup
call :log_info "Cleaning up backup files..."
if exist package.json.backup del package.json.backup
if exist package-lock.json.backup del package-lock.json.backup
if exist backend\requirements.txt.backup del backend\requirements.txt.backup

call :log_success "Dependency update process completed successfully!"
call :log_info "Current versions:"
npm list --depth=0

goto :eof

REM Execute main function
call :main

REM Check if any error occurred
if !errorlevel! neq 0 (
    call :log_error "Script failed with error code !errorlevel!"
    exit /b !errorlevel!
)

endlocal