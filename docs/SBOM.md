# Software Bill of Materials (SBOM) - Meteor Madness

## Project Overview
**Project Name:** Meteor Madness  
**Version:** 1.0.0  
**Description:** NASA-themed meteor impact simulation and visualization application  
**Last Updated:** 2024-12-19  
**SBOM Version:** 2.0.0

## Frontend Dependencies (JavaScript/React)

| Package | Version | License | Purpose | Security Status | Update Status |
|---------|---------|---------|---------|-----------------|---------------|
| @popperjs/core | 2.11.8 | MIT | Tooltip and popover positioning | ✅ Secure | Current |
| axios | 1.12.2 | MIT | HTTP client for API requests | ✅ Secure | Current |
| bootstrap | 5.3.8 | MIT | CSS framework for responsive design | ✅ Secure | Current |
| d3 | 7.9.0 | BSD-3-Clause | Data visualization library | ✅ Secure | Current |
| react | 18.3.1 | MIT | React library for UI components | ✅ Secure | ⚠️ Update Available (19.1.1) |
| react-dom | 18.3.1 | MIT | React DOM rendering | ✅ Secure | ⚠️ Update Available (19.1.1) |
| react-router-dom | 7.9.3 | MIT | React routing library | ✅ Secure | Current |
| react-scripts | 5.0.1 | MIT | Create React App scripts | 🔴 Vulnerable | ⚠️ Requires Migration |
| tailwindcss | 4.1.13 | MIT | Utility-first CSS framework | ✅ Secure | Current |
| three | 0.155.0 | MIT | 3D graphics library | ✅ Secure | ⚠️ Update Available (0.180.0) |
| topojson-client | 3.1.0 | BSD-3-Clause | TopoJSON client library | ✅ Secure | Current |

### Security Vulnerabilities Identified:
- **react-scripts@5.0.1**: Multiple vulnerabilities through transitive dependencies
  - `css-select` (high severity) - Fixed in newer versions
  - `nth-check` (high severity) - Fixed in newer versions
  - `postcss` (moderate severity) - Fixed in newer versions
  - `webpack-dev-server` (moderate severity) - Fixed in newer versions

## Backend Dependencies (Python)

| Package | Current Version | Latest Version | License | Purpose | Update Status |
|---------|-----------------|----------------|---------|---------|---------------|
| flatbuffers | 25.2.10 | 25.9.23 | Apache-2.0 | Serialization library | ⚠️ Update Available |
| grpcio | 1.74.0 | 1.75.1 | Apache-2.0 | gRPC framework | ⚠️ Update Available |
| MarkupSafe | 3.0.2 | 3.0.3 | BSD-3-Clause | XML/HTML/XHTML markup safe string | ⚠️ Update Available |
| numpy | 2.3.2 | 2.3.3 | BSD-3-Clause | Numerical computing library | ⚠️ Update Available |
| psutil | 7.0.0 | 7.1.0 | BSD-3-Clause | Process and system utilities | ⚠️ Update Available |

## Security Vulnerabilities

### Critical Vulnerabilities
- **None** - No critical vulnerabilities detected

### High Severity Vulnerabilities
1. **nth-check** (indirect dependency via react-scripts)
   - **CVSS Score**: 7.5 (High)
   - **Affected Versions**: <=2.0.1
   - **Fix**: Update react-scripts (breaking change required)

2. **css-select** (indirect dependency via svgo)
   - **CVSS Score**: 7.5 (High)
   - **Affected Versions**: <=3.1.0
   - **Fix**: Update react-scripts (breaking change required)

### Moderate Severity Vulnerabilities
1. **postcss** (indirect dependency via resolve-url-loader)
   - **CVSS Score**: 5.9 (Moderate)
   - **Affected Versions**: <8.4.31
   - **Fix**: Update react-scripts (breaking change required)

2. **webpack-dev-server** (indirect dependency)
   - **CVSS Score**: 5.4 (Moderate)
   - **Affected Versions**: <=5.2.0
   - **Fix**: Update react-scripts (breaking change required)

## Dependency Tree Analysis

### Frontend Dependency Chain Vulnerabilities:
```
react-scripts (5.0.1)
├── @svgr/webpack
│   └── @svgr/plugin-svgo
│       └── svgo
│           └── css-select
│               └── nth-check (VULNERABLE)
├── resolve-url-loader
│   └── postcss (VULNERABLE)
└── webpack-dev-server (VULNERABLE)
```

## Recommended Actions

### Immediate Actions (Security):
1. **Update react-scripts** to latest version (requires migration to newer React build system)
2. **Consider migrating from Create React App** to Vite or Next.js for better security
3. **Implement Dependabot** for automated security updates

### Recommended Updates (Functionality):
1. **Update React** from 18.3.1 to 19.1.1
2. **Update Three.js** from 0.155.0 to 0.180.0
3. **Update Python packages** to latest versions

## Automated Security Monitoring Setup

### GitHub Dependabot Configuration
Create `.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    ignore:
      - dependency-name: "react-scripts"
        # Requires manual migration

  - package-ecosystem: "pip"
    directory: "/backend"
    schedule:
      interval: "weekly"
```

### Snyk Integration
1. Install Snyk: `npm install -g snyk`
2. Test: `snyk test`
3. Monitor: `snyk monitor`
4. Fix: `snyk wizard`

## Supply Chain Security

### Recommended Practices:
1. **Use package signing**: Enable npm audit signatures
2. **Implement lockfiles**: Ensure package-lock.json is committed
3. **Use vulnerability scanning**: Integrate with GitHub Security
4. **Regular dependency reviews**: Monthly security audits

### Critical Dependencies to Monitor:
- **react-scripts**: High security risk, consider migration
- **axios**: HTTP client, ensure no supply chain compromises
- **bootstrap**: UI framework, monitor for vulnerabilities
- **numpy**: Scientific computing, critical for data processing

## License Compliance

All dependencies use permissive licenses (MIT, BSD, Apache-2.0) - no license conflicts detected.

## Update History

| Date | Action | Performed By |
|------|--------|-------------|
| $(date) | SBOM Created | Automated Tool |

---

*This SBOM is automatically generated. For the most current information, run `npm audit` and `pip list --outdated`.*