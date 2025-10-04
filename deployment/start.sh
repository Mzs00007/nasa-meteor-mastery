#!/bin/bash

# Startup script for NASA Meteor Mastery application

# Set environment variables
export PYTHONPATH="/app/backend:$PYTHONPATH"
export FLASK_APP="/app/backend/app.py"

# Start Redis server in background
echo "Starting Redis server..."
redis-server --daemonize yes

# Wait for Redis to be ready
counter=0
max_attempts=30
while ! redis-cli ping > /dev/null 2>&1; do
    if [ $counter -eq $max_attempts ]; then
        echo "Redis failed to start after $max_attempts attempts"
        exit 1
    fi
    echo "Waiting for Redis to start... (attempt $((counter+1))/$max_attempts)"
    sleep 1
    counter=$((counter+1))
done
echo "Redis server started successfully"

# Start Nginx
echo "Starting Nginx..."
nginx -g "daemon off;" &

# Start Flask application
echo "Starting Flask backend..."
cd /app/backend

# Run database migrations if needed
# python manage.py db upgrade

# Start Gunicorn for production or Flask for development
if [ "$FLASK_DEBUG" = "True" ]; then
    echo "Running in development mode..."
    python -m flask run --host=0.0.0.0 --port=5000
else
    echo "Running in production mode..."
    # Use Gunicorn for production
    gunicorn --bind 0.0.0.0:5000 \
             --workers 4 \
             --threads 2 \
             --timeout 120 \
             --access-logfile - \
             --error-logfile - \
             --preload \
             app:app
fi