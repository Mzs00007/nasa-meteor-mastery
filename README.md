# NASA Meteor Mastery 🌠

A comprehensive meteor impact simulation and visualization platform that combines real-time data from NASA NEO APIs with advanced 3D visualization and impact prediction modeling.

## 🚀 Project Overview

NASA Meteor Mastery is an educational and research-focused application that simulates meteor impacts on Earth using real orbital data. The platform provides:

- **Real-time NEO Data**: Integration with NASA's Near Earth Object Web Service API
- **3D Visualization**: Interactive Three.js-based orbital and impact visualization
- **Impact Simulation**: Physics-based impact energy and crater size calculations
- **Educational Tools**: Learn about planetary defense and asteroid characteristics

### 🎯 Challenge Goals

- **Awareness**: Educate the public about near-Earth objects and impact risks
- **Research**: Provide tools for studying orbital mechanics and impact physics
- **Visualization**: Create immersive 3D representations of celestial mechanics
- **Accessibility**: Make complex astronomical concepts understandable through interactive simulations

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript for type-safe development
- **Three.js** for 3D visualization and WebGL rendering
- **Leaflet/Cesium** for 2D/3D mapping (planned integration)
- **Bootstrap 5/Tailwind CSS** for responsive UI components
- **Web Workers** for off-thread physics calculations

### Backend
- **Node.js/Express** JavaScript server for API orchestration
- **Python Flask** microservices for scientific computations
- **Redis** for caching and session management
- **MongoDB/PostgreSQL** for data persistence

### Data Processing
- **NumPy/SciPy** for scientific computing (Python)
- **WebAssembly** for performance-critical calculations
- **TensorFlow.js** for client-side AI predictions

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Redis server
- MongoDB/PostgreSQL (optional)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/nasa-meteor-mastery.git
   cd nasa-meteor-mastery/MM (NASA)
   ```

2. **Install dependencies**
   ```bash
   # Frontend dependencies
   npm install
   
   # Backend dependencies
   cd backend
   npm install
   ```

3. **Environment configuration**
   ```bash
   # Copy and configure environment variables
   cp .env.example .env
   
   # Add your NASA API key
   echo "NASA_API_KEY=your_api_key_here" >> .env
   echo "REDIS_URL=redis://localhost:6379" >> .env
   ```

4. **Start development servers**
   ```bash
   # Frontend (port 3000)
   npm start
   
   # Backend (port 5000)
   cd backend
   npm run dev
   ```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build individually
docker build -t meteor-mastery-frontend .
docker build -t meteor-mastery-backend ./backend
```

## 🌐 API Integration

### NASA NEO API
```javascript
// Example API call with caching
const response = await fetch(`https://api.nasa.gov/neo/rest/v1/feed?api_key=${process.env.NASA_API_KEY}`);
const data = await response.json();
```

### USGS Earthquake API
```javascript
// Seismic data for impact correlation
const usgsData = await fetch('https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson');
```

### Environment Variables
```bash
NASA_API_KEY=your_nasa_api_key
USGS_API_KEY=your_usgs_api_key
REDIS_URL=redis://localhost:6379
MONGODB_URI=mongodb://localhost:27017/meteor-mastery
```

## 🧮 Data Processing

### Orbital Calculations
```python
# Python implementation with NumPy
def calculate_trajectory(velocity, angle, mass):
    """Calculate meteor trajectory using physics equations"""
    # Vectorized calculations for performance
    trajectory = np.array([...])
    return trajectory
```

### Impact Energy Calculation
```javascript
// JavaScript implementation
function calculateImpactEnergy(mass, velocity) {
    // E = 0.5 * m * v^2
    return 0.5 * mass * Math.pow(velocity, 2);
}
```

## 🎨 Frontend Visualization

### 3D Scene Setup
```jsx
// Three.js scene configuration
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000011);

// Earth geometry and materials
const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
const earthMaterial = new THREE.MeshPhongMaterial({/* ... */});
```

### Responsive Design
```css
/* Mobile-first responsive design */
@media (max-width: 768px) {
    .simulation-container {
        grid-template-columns: 1fr;
    }
    
    .controls-panel {
        order: 2;
    }
}
```

## 🤖 AI & Modeling

### Impact Prediction Model
```python
# TensorFlow model for impact prediction
model = tf.keras.Sequential([
    tf.keras.layers.Dense(64, activation='relu', input_shape=(10,)),
    tf.keras.layers.Dense(32, activation='relu'),
    tf.keras.layers.Dense(1, activation='linear')
])
```

### Confidence Intervals
```javascript
// Bayesian uncertainty estimation
function calculateConfidenceInterval(predictions, confidence = 0.95) {
    const mean = predictions.reduce((a, b) => a + b) / predictions.length;
    const stdDev = Math.sqrt(predictions.reduce((sq, n) => sq + Math.pow(n - mean, 2)) / predictions.length);
    return [mean - 1.96 * stdDev, mean + 1.96 * stdDev];
}
```

## 🎮 User Controls

### Scenario Configuration
```jsx
<Slider
    label="Meteor Size"
    min={1}
    max={1000}
    step={1}
    value={meteorSize}
    onChange={handleSizeChange}
    aria-label="Adjust meteor size in meters"
/>
```

### Input Validation
```javascript
function validateInput(value, min, max) {
    if (value < min || value > max) {
        throw new Error(`Value must be between ${min} and ${max}`);
    }
    return true;
}
```

## 🔒 Backend Security

### API Authentication
```javascript
// JWT token validation middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.sendStatus(401);
    
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};
```

### Input Sanitization
```javascript
// Prevent NoSQL injection
function sanitizeInput(input) {
    return input.replace(/[\$\{\}\\/\"\']/g, '');
}
```

## 🐳 Deployment

### Docker Configuration
```dockerfile
# Multi-stage build for optimized image size
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: meteor-mastery-frontend
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: frontend
        image: meteor-mastery-frontend:latest
        ports:
        - containerPort: 3000
```

## 🧪 Testing

### Unit Tests
```javascript
// Jest test suite
describe('Impact Calculations', () => {
    test('calculates impact energy correctly', () => {
        const energy = calculateImpactEnergy(1000, 20000);
        expect(energy).toBe(2e8);
    });
});
```

### Integration Tests
```python
# Pytest integration tests
def test_api_endpoint(client):
    response = client.get('/api/meteors')
    assert response.status_code == 200
    assert 'near_earth_objects' in response.json()
```

## 📚 Documentation

### API Documentation
Available at `/api/docs` when running the development server. Includes:
- Endpoint descriptions
- Request/response schemas
- Authentication requirements
- Rate limiting information

### User Guide
Comprehensive user documentation covering:
- Simulation setup and configuration
- Interpretation of results
- Educational content about meteor impacts
- Troubleshooting common issues

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Follow ESLint and Prettier configurations
- Write comprehensive tests for new features
- Document complex algorithms and business logic
- Maintain accessibility standards (WCAG 2.1)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- NASA for providing the NEO API and astronomical data
- Three.js community for excellent WebGL documentation
- Scientific researchers in planetary defense and impact physics

## 📞 Support

For questions and support:
- Create an issue on GitHub
- Join our Discord community
- Check the FAQ section in the documentation

---

**Disclaimer**: This is an educational simulation. Actual impact predictions require sophisticated modeling beyond this application's scope.