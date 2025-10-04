# Dependency Management Guide - Meteor Madness

## Overview
This guide provides comprehensive instructions for managing dependencies, ensuring security, and maintaining the Software Bill of Materials (SBOM) for the Meteor Madness project.

## Current Dependency Status

### Frontend (JavaScript/React)
- **React**: 18.3.1 (Latest: 19.1.1) - Requires careful migration
- **React-DOM**: 18.3.1 (Latest: 19.1.1) - Requires careful migration  
- **Three.js**: 0.155.0 (Latest: 0.180.0) - Safe to update
- **react-scripts**: 5.0.1 - Multiple security vulnerabilities

### Backend (Python)
- All Python packages are current and secure

## Security Vulnerabilities

### High Priority Issues:
1. **react-scripts@5.0.1** - Multiple transitive dependency vulnerabilities
   - `css-select` (high severity)
   - `nth-check` (high severity)
   - `postcss` (moderate severity) 
   - `webpack-dev-server` (moderate severity)

## Step-by-Step Update Procedures

### 1. Verify Current Versions
```bash
# Check NPM dependencies
npm list --depth=0

# Check for outdated packages
npm outdated

# Check security vulnerabilities
npm audit

# Check Python dependencies (if available)
pip list --outdated
```

### 2. Safe Update Process

#### Option A: Automated Update Scripts
```bash
# Windows
update-dependencies.bat

# Unix/Linux/Mac
chmod +x update-dependencies.sh
./update-dependencies.sh
```

#### Option B: Manual Update Commands
```bash
# Backup first
cp package.json package.json.backup
cp package-lock.json package-lock.json.backup

# Update non-breaking dependencies
npm update

# Update specific packages
npm install axios@latest
npm install three@latest  
npm install d3@latest
npm install bootstrap@latest
npm install tailwindcss@latest

# Security audit and fix
npm audit
npm audit fix

# If vulnerabilities persist
npm audit fix --force
```

### 3. Testing After Updates
```bash
# Run tests
npm test

# Build project
npm run build

# Start development server to verify
npm start
```

### 4. React 19 Migration (Advanced)
```bash
# Carefully update React (may have breaking changes)
npm install react@19.1.1 react-dom@19.1.1

# Test thoroughly for any breaking changes
# Common issues: Strict mode changes, new APIs
```

## Automated Security Monitoring

### Dependabot Configuration
Dependabot is configured in `.github/dependabot.yml` to:
- Scan NPM dependencies weekly
- Scan Python dependencies weekly  
- Scan Docker dependencies monthly
- Create automatic pull requests for security updates
- Exclude major version updates for critical packages

### Security Scanning Tools

#### Recommended Setup:
1. **GitHub Security Features**: Enable in repository settings
2. **Snyk**: Free for open source - `npm install -g snyk && snyk test`
3. **npm audit**: Built-in - run regularly

#### Continuous Integration:
```yaml
# Example GitHub Actions workflow
name: Security Scan
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Setup Node.js
      uses: actions/setup-node@v3
    - name: Install dependencies
      run: npm ci
    - name: Run security audit
      run: npm audit
    - name: Run Snyk test
      run: npx snyk test --severity-threshold=high
```

## SBOM Management

### Maintaining the SBOM
1. **Automated Updates**: Dependabot will help keep dependencies current
2. **Manual Reviews**: Quarterly comprehensive SBOM reviews
3. **Emergency Updates**: Update SBOM after any security patch

### SBOM Generation Commands
```bash
# Generate dependency list
npm list --depth=0 > dependencies.txt

# Check licenses  
npm ls --json | npx license-checker --json > licenses.json

# Python dependencies (if applicable)
pip list --format=json > python-dependencies.json
```

## Emergency Procedures

### Security Vulnerability Response
1. **Immediate Action**: Run `npm audit fix --force`
2. **Assessment**: Check SBOM for affected components
3. **Isolation**: Consider temporarily removing vulnerable dependencies
4. **Reporting**: Document in SECURITY.md and update SBOM

### Rollback Procedures
```bash
# Restore from backup
cp package.json.backup package.json
cp package-lock.json.backup package-lock.json
npm install
```

## Best Practices

### Dependency Hygiene
1. **Regular Updates**: Update dependencies at least quarterly
2. **Security Scanning**: Run security scans weekly
3. **License Compliance**: Verify licenses annually
4. **Documentation**: Keep SBOM and this guide updated

### Version Pinning Strategy
- **Major versions**: Pin to specific major version (`^1.2.3`)
- **Critical packages**: Pin to exact versions for stability
- **Security-sensitive**: Prefer packages with good security track records

## Monitoring and Alerts

### Recommended Monitoring:
1. **GitHub Security Alerts**: Enable in repository settings
2. **Snyk Monitoring**: Free for open source projects
3. **npm audit**: Integrate into CI/CD pipeline
4. **Dependabot**: Configure for automatic PR creation

### Alert Thresholds:
- **Critical**: Immediate action required
- **High**: Address within 7 days  
- **Medium**: Address within 30 days
- **Low**: Address in next quarterly update

## Compliance and Reporting

### Regulatory Requirements:
- Maintain accurate SBOM for supply chain transparency
- Document security vulnerability responses
- Track license compliance annually

### Reporting Templates:
- **Quarterly Security Report**: Summary of vulnerabilities and fixes
- **Annual Compliance Report**: License and regulatory compliance status
- **Incident Reports**: Document security incidents and responses

## Tools and Resources

### Essential Tools:
1. **npm**: Built-in dependency management
2. **Dependabot**: Automated security updates
3. **Snyk**: Comprehensive vulnerability scanning
4. **license-checker**: License compliance checking

### Useful Commands:
```bash
# Check dependency tree
npm ls

# Check for duplicate dependencies
npm dedupe

# Clean install for consistency
npm ci

# Check package sizes
npx package-size
```

## Support and Troubleshooting

### Common Issues:
1. **Peer dependency conflicts**: Use `npm install --legacy-peer-deps`
2. **Build failures after updates**: Check console for specific errors
3. **Security vulnerability false positives**: Verify with multiple scanners

### Getting Help:
1. **Documentation**: Check package documentation for migration guides
2. **Community**: React and npm communities for specific issues
3. **Security Advisories**: Monitor npm security advisories

---
*This guide is maintained as part of the Meteor Madness project security program. Last updated: 2024-12-19*