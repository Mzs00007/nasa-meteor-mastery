# Deployment Configuration Guide

## WebSocket Configuration for Production

This guide helps ensure your NASA Meteor Mastery application maintains robust WebSocket connections in production environments.

### Environment Variables

Copy `.env.example` to `.env` and configure the following WebSocket-specific variables:

#### Required for Production
```bash
# Set to production for optimized performance
NODE_ENV=production

# Your production domain (auto-detected if not set)
REACT_APP_WEBSOCKET_URL=wss://your-domain.com
REACT_APP_BACKEND_URL=https://your-domain.com

# Server ports
PORT=5000
WEBSOCKET_PORT=3001
```

#### Optional Tuning Parameters
```bash
# Connection timeouts (milliseconds)
WEBSOCKET_TIMEOUT=20000                    # Socket.io connection timeout
WEBSOCKET_CONNECTION_TIMEOUT=60000         # Health check timeout
WEBSOCKET_HEALTH_CHECK_INTERVAL=30000      # Health check frequency

# Reconnection behavior
WEBSOCKET_MAX_RECONNECT_ATTEMPTS=10        # Attempts before extended delay
WEBSOCKET_RECONNECT_DELAY=1000             # Base delay between attempts
WEBSOCKET_MAX_RECONNECT_DELAY=30000        # Maximum delay cap
WEBSOCKET_AUTO_RECONNECT=true              # Enable automatic reconnection
```

### Deployment Platforms

#### Vercel/Netlify (Frontend)
1. Set environment variables in your platform's dashboard
2. Ensure `REACT_APP_WEBSOCKET_URL` points to your backend WebSocket server
3. The service will auto-detect URLs if not explicitly set

#### Heroku/Railway/Render (Backend)
1. Configure environment variables in your platform
2. Ensure WebSocket support is enabled
3. Use the provided PORT environment variable

#### Docker Deployment
```dockerfile
# Example environment configuration
ENV NODE_ENV=production
ENV WEBSOCKET_AUTO_RECONNECT=true
ENV WEBSOCKET_TIMEOUT=20000
```

### Network Considerations

#### Reverse Proxy (Nginx)
```nginx
# WebSocket proxy configuration
location /socket.io/ {
    proxy_pass http://backend:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Timeout settings
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

#### Load Balancer
- Enable sticky sessions for WebSocket connections
- Configure health checks on `/health` endpoint
- Set appropriate timeout values

### Monitoring & Troubleshooting

#### Connection Status Monitoring
The WebSocket service provides comprehensive status information:

```javascript
// Get connection status
const status = websocketService.getStats();
console.log('Connection Quality:', status.connectionQuality);
console.log('Network Status:', status.networkStatus);
console.log('Offline Mode:', status.offlineMode);
```

#### Common Issues & Solutions

1. **Connection Drops in Production**
   - Increase `WEBSOCKET_TIMEOUT` and `WEBSOCKET_CONNECTION_TIMEOUT`
   - Check reverse proxy timeout settings
   - Verify firewall allows WebSocket traffic

2. **Frequent Reconnections**
   - Adjust `WEBSOCKET_RECONNECT_DELAY` and `WEBSOCKET_MAX_RECONNECT_DELAY`
   - Check network stability
   - Monitor server resource usage

3. **CORS Issues**
   - Ensure `CORS_ORIGIN` includes your frontend domain
   - Configure proper headers in your reverse proxy

4. **SSL/TLS Issues**
   - Use `wss://` for secure WebSocket connections
   - Ensure SSL certificates are valid
   - Check mixed content policies

### Performance Optimization

#### Client-Side
- The service automatically caches data for offline operation
- Connection health monitoring prevents unnecessary reconnections
- Progressive fallback strategies ensure maximum compatibility

#### Server-Side
- Configure appropriate `pingTimeout` and `pingInterval`
- Use Redis adapter for multi-server deployments
- Monitor memory usage for data caching

### Testing Deployment

1. **Local Testing**
   ```bash
   npm run build
   npm start
   ```

2. **Network Simulation**
   - Test with slow network conditions
   - Simulate connection drops
   - Verify offline mode functionality

3. **Production Verification**
   - Monitor connection quality metrics
   - Check reconnection behavior
   - Verify data persistence during outages

### Security Considerations

- Use HTTPS/WSS in production
- Implement rate limiting
- Validate all incoming data
- Monitor for unusual connection patterns
- Keep dependencies updated

### Support

If you encounter issues:
1. Check browser console for WebSocket errors
2. Verify environment variables are set correctly
3. Test connection with different network conditions
4. Monitor server logs for connection patterns

The WebSocket service is designed to be self-healing and robust, automatically adapting to various network conditions and deployment environments.