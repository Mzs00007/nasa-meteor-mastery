"""
Enhanced Flask Backend Server for NASA Meteor Mastery
Features: Authentication, Validation, Caching, Monitoring, and Microservices Architecture
"""
import os
import json
import logging
import redis
from datetime import datetime, timedelta
from functools import wraps
from typing import Dict, List, Optional, Any

from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
from flask_socketio import SocketIO
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv

# Import WebSocket service
from websocket_service import RealTimeDataStreamer, setup_websocket_handlers

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask application
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-me')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

# Enable CORS
CORS(app, origins=os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(','))

# Initialize SocketIO with CORS support
socketio = SocketIO(
    app,
    cors_allowed_origins=os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(','),
    async_mode='threading',
    logger=True,
    engineio_logger=True
)

# Rate limiting
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri=os.getenv('REDIS_URL', 'redis://localhost:6379')
)

# JWT Manager
jwt = JWTManager(app)

# Redis connection
redis_client = redis.Redis.from_url(
    os.getenv('REDIS_URL', 'redis://localhost:6379'),
    decode_responses=True
)

# Initialize real-time data streamer
data_streamer = RealTimeDataStreamer(socketio)
setup_websocket_handlers(socketio, data_streamer)

# Mock user database (replace with real database in production)
users = {
    "admin": {
        "password": generate_password_hash(os.getenv('ADMIN_PASSWORD', 'admin123')),
        "role": "admin"
    },
    "user": {
        "password": generate_password_hash(os.getenv('USER_PASSWORD', 'user123')),
        "role": "user"
    }
}

# Utility functions
def cache_response(key: str, data: Any, ttl: int = 300):
    """Cache API response"""
    try:
        redis_client.setex(key, ttl, json.dumps(data))
    except Exception as e:
        logger.error(f"Cache error: {e}")

def get_cached_response(key: str) -> Optional[Any]:
    """Get cached API response"""
    try:
        cached = redis_client.get(key)
        return json.loads(cached) if cached else None
    except Exception as e:
        logger.error(f"Cache retrieval error: {e}")
        return None

def validate_json(schema: Dict) -> bool:
    """Validate JSON against schema"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return jsonify({"error": "Request must be JSON"}), 400
            
            data = request.get_json()
            for field, field_type in schema.items():
                if field not in data:
                    return jsonify({"error": f"Missing required field: {field}"}), 400
                if not isinstance(data[field], field_type):
                    return jsonify({"error": f"Field {field} must be {field_type.__name__}"}), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Authentication routes
@app.route('/api/auth/login', methods=['POST'])
@validate_json({"username": str, "password": str})
def login():
    """User login endpoint"""
    data = request.get_json()
    username = data['username']
    password = data['password']
    
    user = users.get(username)
    if user and check_password_hash(user['password'], password):
        access_token = create_access_token(identity={
            'username': username,
            'role': user['role']
        })
        return jsonify({
            'access_token': access_token,
            'username': username,
            'role': user['role']
        }), 200
    
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/auth/register', methods=['POST'])
@validate_json({"username": str, "password": str, "email": str})
def register():
    """User registration endpoint"""
    data = request.get_json()
    username = data['username']
    
    if username in users:
        return jsonify({"error": "Username already exists"}), 409
    
    users[username] = {
        "password": generate_password_hash(data['password']),
        "email": data['email'],
        "role": "user"
    }
    
    return jsonify({"message": "User created successfully"}), 201

# NASA NEO API routes
@app.route('/api/neo/feed', methods=['GET'])
@jwt_required()
@limiter.limit("10 per minute")
async def neo_feed():
    """Get NEO feed with caching"""
    cache_key = f"neo:feed:{request.args.get('start_date')}:{request.args.get('end_date')}"
    
    # Check cache first
    cached = get_cached_response(cache_key)
    if cached:
        return jsonify(cached)
    
    try:
        # This would integrate with the actual NASA API
        # For now, return mock data with improved error handling
        
        # Validate date parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if start_date and end_date:
            try:
                from datetime import datetime
                datetime.strptime(start_date, '%Y-%m-%d')
                datetime.strptime(end_date, '%Y-%m-%d')
            except ValueError:
                return jsonify({
                    "error": "Invalid date format. Use YYYY-MM-DD",
                    "status": "error"
                }), 400
        
        mock_data = {
            "element_count": 12,
            "status": "success",
            "data_source": "mock_api",
            "near_earth_objects": {
                "2023-12-15": [
                    {
                        "id": "1234567",
                        "name": "(2023 XY)",
                        "estimated_diameter": {
                            "meters": {"estimated_diameter_min": 50, "estimated_diameter_max": 120}
                        },
                        "is_potentially_hazardous_asteroid": True,
                        "close_approach_data": [
                            {
                                "close_approach_date": "2023-12-15",
                                "relative_velocity": {"kilometers_per_second": "17.5"},
                                "miss_distance": {"kilometers": "4500000"}
                            }
                        ]
                    }
                ]
            }
        }
        
        # Cache the response
        cache_response(cache_key, mock_data, ttl=300)
        
        return jsonify(mock_data)
    
    except ValueError as ve:
        logger.error(f"NEO feed validation error: {ve}")
        return jsonify({
            "error": "Invalid request parameters",
            "details": str(ve),
            "status": "error"
        }), 400
    except Exception as e:
        logger.error(f"NEO feed error: {e}")
        
        # Return fallback data instead of just error
        fallback_data = {
            "element_count": 0,
            "status": "fallback",
            "message": "Using cached fallback data due to API unavailability",
            "near_earth_objects": {}
        }
        
        return jsonify(fallback_data), 200

@app.route('/api/neo/<asteroid_id>', methods=['GET'])
@jwt_required()
@limiter.limit("20 per minute")
async def neo_lookup(asteroid_id: str):
    """Get specific asteroid data"""
    cache_key = f"neo:lookup:{asteroid_id}"
    
    cached = get_cached_response(cache_key)
    if cached:
        return jsonify(cached)
    
    try:
        # Mock asteroid data
        mock_asteroid = {
            "id": asteroid_id,
            "name": f"Asteroid {asteroid_id}",
            "estimated_diameter": {
                "meters": {"estimated_diameter_min": 30, "estimated_diameter_max": 80}
            },
            "is_potentially_hazardous_asteroid": False,
            "orbital_data": {
                "orbit_class": {"orbit_class_type": "Apollo"}
            },
            "close_approach_data": [
                {
                    "close_approach_date": "2023-12-20",
                    "relative_velocity": {"kilometers_per_second": "12.3"},
                    "miss_distance": {"kilometers": "7800000"}
                }
            ]
        }
        
        cache_response(cache_key, mock_asteroid, ttl=3600)
        
        return jsonify(mock_asteroid)
    
    except Exception as e:
        logger.error(f"Asteroid lookup error: {e}")
        return jsonify({"error": "Failed to fetch asteroid data"}), 500

# USGS Earthquake API routes
@app.route('/api/earthquakes', methods=['GET'])
@jwt_required()
@limiter.limit("15 per minute")
async def earthquakes():
    """Get earthquake data"""
    cache_key = f"earthquakes:{request.args.get('starttime')}:{request.args.get('endtime')}"
    
    cached = get_cached_response(cache_key)
    if cached:
        return jsonify(cached)
    
    try:
        # Mock earthquake data
        mock_earthquakes = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "mag": 6.2,
                        "place": "150km SSE of Homer, Alaska",
                        "time": 1702600000000,
                        "tsunami": 0
                    },
                    "geometry": {
                        "type": "Point",
                        "coordinates": [-150.123, 58.456]
                    }
                }
            ]
        }
        
        cache_response(cache_key, mock_earthquakes, ttl=600)
        
        return jsonify(mock_earthquakes)
    
    except Exception as e:
        logger.error(f"Earthquake data error: {e}")
        return jsonify({"error": "Failed to fetch earthquake data"}), 500

# Impact simulation routes
@app.route('/api/impact/simulate', methods=['POST'])
@jwt_required()
@validate_json({
    "diameter": float,
    "density": float,
    "velocity": float,
    "angle": float,
    "latitude": float,
    "longitude": float
})
async def simulate_impact():
    """Simulate meteor impact"""
    data = request.get_json()
    
    try:
        # Calculate impact energy (kinetic energy)
        volume = (4/3) * 3.14159 * (data['diameter']/2)**3
        mass = data['density'] * volume  # kg
        energy_joules = 0.5 * mass * (data['velocity'] * 1000)**2  # Convert km/s to m/s
        energy_megatons = energy_joules / (4.184 * 10**15)  # Convert to megatons of TNT
        
        # Simple crater diameter estimation
        crater_diameter = 0.1 * energy_megatons**(1/3)  # km
        
        result = {
            "impact_energy_joules": energy_joules,
            "impact_energy_megatons": energy_megatons,
            "estimated_crater_diameter_km": crater_diameter,
            "mass_kg": mass,
            "simulation_timestamp": datetime.now().isoformat(),
            "input_parameters": data
        }
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Impact simulation error: {e}")
        return jsonify({"error": "Impact simulation failed"}), 500

# Health check endpoint
@app.route('/api/health', methods=['GET'])
async def health_check():
    """Health check endpoint"""
    try:
        # Check Redis connection
        redis_client.ping()
        
        return jsonify({
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "redis": "connected",
                "api": "operational"
            }
        })
    
    except Exception as e:
        return jsonify({
            "status": "degraded",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }), 503

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {error}")
    return jsonify({"error": "Internal server error"}), 500

@app.errorhandler(429)
def rate_limit_exceeded(error):
    return jsonify({"error": "Rate limit exceeded"}), 429

if __name__ == "__main__":
    # Start real-time data streaming
    data_streamer.start_streaming()
    
    # Run the Flask-SocketIO application
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting NASA Meteor Mastery server on port {port}")
    socketio.run(app, host='0.0.0.0', port=port, debug=debug, allow_unsafe_werkzeug=True)