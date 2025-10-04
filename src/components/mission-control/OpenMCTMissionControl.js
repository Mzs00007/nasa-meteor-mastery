import React, { useEffect, useRef, useState } from 'react';

import { useSimulation } from '../../context/SimulationContext';
import {
  useMissionControl,
  useISSData,
  useSpaceWeather,
  useNASAData,
} from '../../hooks/useWebSocket';
import './OpenMCTMissionControl.css';

const OpenMCTMissionControl = () => {
  const { asteroidData, simulationResults, isSimulating } = useSimulation();
  const mctContainerRef = useRef(null);
  const [mctInstance, setMctInstance] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Real-time WebSocket data hooks
  const { telemetry, orbitalMechanics, events } = useMissionControl();
  const { position: issPosition, telemetry: issTelemetry } = useISSData();
  const { solarActivity, geomagneticData, alerts } = useSpaceWeather();
  const { neoData, marsWeather } = useNASAData();

  useEffect(() => {
    // Initialize OpenMCT if available
    if (window.openmct && mctContainerRef.current && !isInitialized) {
      try {
        const mct = window.openmct;

        // Configure OpenMCT
        mct.setAssetPath('/openmct/');
        mct.install(mct.plugins.LocalStorage());
        mct.install(mct.plugins.MyItems());
        mct.install(mct.plugins.Espresso());

        // Create custom telemetry plugin for asteroid data
        mct.install(createAsteroidTelemetryPlugin());

        // Start OpenMCT
        mct.start(mctContainerRef.current);
        setMctInstance(mct);
        setIsInitialized(true);
      } catch (error) {
        console.warn('OpenMCT not available, using fallback interface:', error);
      }
    }
  }, [isInitialized]);

  // Create custom telemetry plugin for asteroid data
  const createAsteroidTelemetryPlugin = () => {
    return function AsteroidTelemetryPlugin() {
      return function install(openmct) {
        // Define asteroid telemetry object
        const asteroidObject = {
          identifier: {
            namespace: 'asteroid.telemetry',
            key: 'asteroid-data',
          },
          name: 'Asteroid Tracking Data',
          type: 'telemetry.point',
          telemetry: {
            values: [
              {
                key: 'timestamp',
                name: 'Timestamp',
                format: 'utc',
                hints: { domain: 1 },
              },
              {
                key: 'distance',
                name: 'Distance (km)',
                unit: 'km',
                format: 'float',
                hints: { range: 1 },
              },
              {
                key: 'velocity',
                name: 'Velocity (km/s)',
                unit: 'km/s',
                format: 'float',
                hints: { range: 2 },
              },
              {
                key: 'diameter',
                name: 'Diameter (m)',
                unit: 'm',
                format: 'float',
                hints: { range: 3 },
              },
            ],
          },
        };

        // Register object provider
        openmct.objects.addProvider('asteroid.telemetry', {
          get: function (identifier) {
            if (identifier.key === 'asteroid-data') {
              return Promise.resolve(asteroidObject);
            }
            return Promise.resolve(undefined);
          },
        });

        // Register telemetry provider
        openmct.telemetry.addProvider({
          supportsSubscribe: function (domainObject) {
            return domainObject.identifier.namespace === 'asteroid.telemetry';
          },
          subscribe: function (domainObject, callback) {
            // Simulate real-time telemetry updates
            const interval = setInterval(() => {
              if (asteroidData) {
                const telemetryPoint = {
                  timestamp: Date.now(),
                  distance: asteroidData.distance || Math.random() * 1000000,
                  velocity: asteroidData.velocity || Math.random() * 50,
                  diameter: asteroidData.diameter || Math.random() * 1000,
                };
                callback(telemetryPoint);
              }
            }, 1000);

            return function unsubscribe() {
              clearInterval(interval);
            };
          },
          supportsRequest: function (domainObject) {
            return domainObject.identifier.namespace === 'asteroid.telemetry';
          },
          request: function (domainObject, options) {
            // Return historical data
            const data = [];
            const now = Date.now();
            for (let i = 0; i < 100; i++) {
              data.push({
                timestamp: now - (100 - i) * 1000,
                distance: Math.random() * 1000000,
                velocity: Math.random() * 50,
                diameter: Math.random() * 1000,
              });
            }
            return Promise.resolve(data);
          },
        });
      };
    };
  };

  // Fallback interface when OpenMCT is not available
  const FallbackMissionControl = () => (
    <div className='fallback-mission-control'>
      <div className='mission-control-header'>
        <h2>Mission Control Dashboard</h2>
        <div className='status-indicators'>
          <div
            className={`status-indicator ${isSimulating ? 'active' : 'inactive'}`}
          >
            <span className='indicator-light' />
            Simulation {isSimulating ? 'Active' : 'Inactive'}
          </div>
          <div
            className={`status-indicator ${telemetry ? 'active' : 'inactive'}`}
          >
            <span className='indicator-light' />
            Telemetry {telemetry ? 'Connected' : 'Disconnected'}
          </div>
          <div
            className={`status-indicator ${issPosition ? 'active' : 'inactive'}`}
          >
            <span className='indicator-light' />
            ISS Tracking {issPosition ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>

      <div className='mission-control-grid'>
        <div className='telemetry-panel'>
          <h3>Spacecraft Telemetry</h3>
          {telemetry ? (
            <div className='telemetry-data'>
              <div className='data-row'>
                <span>Power System:</span>
                <span className='telemetry-value active'>
                  {telemetry.spacecraft?.power?.battery_charge?.toFixed(1) ||
                    'N/A'}
                  %
                </span>
              </div>
              <div className='data-row'>
                <span>Solar Array:</span>
                <span className='telemetry-value'>
                  {telemetry.spacecraft?.power?.solar_array_voltage?.toFixed(
                    1
                  ) || 'N/A'}
                  V
                </span>
              </div>
              <div className='data-row'>
                <span>CPU Temp:</span>
                <span className='telemetry-value'>
                  {telemetry.spacecraft?.thermal?.cpu_temperature?.toFixed(1) ||
                    'N/A'}
                  °C
                </span>
              </div>
              <div className='data-row'>
                <span>Attitude:</span>
                <span className='telemetry-value'>
                  R:{telemetry.spacecraft?.attitude?.roll?.toFixed(1) || 'N/A'}°
                  P:{telemetry.spacecraft?.attitude?.pitch?.toFixed(1) || 'N/A'}
                  °
                </span>
              </div>
            </div>
          ) : (
            <div className='no-data'>No telemetry data available</div>
          )}
        </div>

        <div className='telemetry-panel'>
          <div className='panel-header'>
            <h3>ISS Position & Status</h3>
            <button
              className='view-details-btn'
              onClick={() => (window.location.href = '/iss-tracking')}
              title='Open detailed ISS tracking visualization'
            >
              🛰️ 3D View
            </button>
          </div>
          {issPosition ? (
            <div className='telemetry-data'>
              <div className='data-row'>
                <span>Latitude:</span>
                <span className='telemetry-value active'>
                  {issPosition.latitude?.toFixed(4) || 'N/A'}°
                </span>
              </div>
              <div className='data-row'>
                <span>Longitude:</span>
                <span className='telemetry-value active'>
                  {issPosition.longitude?.toFixed(4) || 'N/A'}°
                </span>
              </div>
              <div className='data-row'>
                <span>Altitude:</span>
                <span className='telemetry-value'>
                  {issPosition.altitude?.toFixed(2) || 'N/A'} km
                </span>
              </div>
              <div className='data-row'>
                <span>Velocity:</span>
                <span className='telemetry-value'>
                  {issPosition.velocity?.toFixed(2) || 'N/A'} km/s
                </span>
              </div>
            </div>
          ) : (
            <div className='no-data'>No ISS data available</div>
          )}
        </div>

        <div className='simulation-panel'>
          <h3>Space Weather</h3>
          {solarActivity ? (
            <div className='simulation-data'>
              <div className='data-row'>
                <span>Solar Wind Speed:</span>
                <span className='telemetry-value'>
                  {solarActivity.solar_wind_speed?.toFixed(0) || 'N/A'} km/s
                </span>
              </div>
              <div className='data-row'>
                <span>X-ray Flux:</span>
                <span className='telemetry-value'>
                  {solarActivity.xray_flux || 'N/A'}
                </span>
              </div>
              <div className='data-row'>
                <span>Kp Index:</span>
                <span className='telemetry-value'>
                  {geomagneticData?.kp_index?.toFixed(1) || 'N/A'}
                </span>
              </div>
              <div className='data-row'>
                <span>Geomagnetic Storm:</span>
                <span
                  className={`telemetry-value ${geomagneticData?.storm_level === 'None' ? '' : 'active'}`}
                >
                  {geomagneticData?.storm_level || 'N/A'}
                </span>
              </div>
            </div>
          ) : (
            <div className='no-data'>No space weather data available</div>
          )}
        </div>

        <div className='simulation-panel'>
          <h3>Orbital Mechanics</h3>
          {orbitalMechanics ? (
            <div className='simulation-data'>
              <div className='data-row'>
                <span>Orbital Period:</span>
                <span className='telemetry-value'>
                  {orbitalMechanics.orbital_period?.toFixed(2) || 'N/A'} min
                </span>
              </div>
              <div className='data-row'>
                <span>Apogee:</span>
                <span className='telemetry-value'>
                  {orbitalMechanics.apogee?.toFixed(0) || 'N/A'} km
                </span>
              </div>
              <div className='data-row'>
                <span>Perigee:</span>
                <span className='telemetry-value'>
                  {orbitalMechanics.perigee?.toFixed(0) || 'N/A'} km
                </span>
              </div>
              <div className='data-row'>
                <span>Inclination:</span>
                <span className='telemetry-value'>
                  {orbitalMechanics.inclination?.toFixed(2) || 'N/A'}°
                </span>
              </div>
            </div>
          ) : (
            <div className='no-data'>No orbital data available</div>
          )}
        </div>

        <div className='mission-timeline'>
          <h3>Real-Time Events</h3>
          <div className='timeline-events'>
            <div className='timeline-event'>
              <span className='event-time'>
                {new Date().toLocaleTimeString()}
              </span>
              <span className='event-description'>Mission Control Active</span>
            </div>
            {events &&
              events.slice(0, 3).map((event, index) => (
                <div
                  key={index}
                  className={`timeline-event ${event.priority === 'high' ? 'active' : ''}`}
                >
                  <span className='event-time'>
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                  <span className='event-description'>{event.description}</span>
                </div>
              ))}
            {issPosition && (
              <div className='timeline-event active'>
                <span className='event-time'>
                  {new Date().toLocaleTimeString()}
                </span>
                <span className='event-description'>ISS Position Updated</span>
              </div>
            )}
          </div>
        </div>

        <div className='alerts-panel'>
          <h3>System Alerts</h3>
          <div className='alerts-list'>
            {!telemetry && (
              <div className='alert warning'>
                <span className='alert-icon'>⚠️</span>
                Telemetry connection lost
              </div>
            )}
            {alerts &&
              alerts.slice(0, 2).map((alert, index) => (
                <div key={index} className={`alert ${alert.severity}`}>
                  <span className='alert-icon'>
                    {alert.severity === 'high'
                      ? '🚨'
                      : alert.severity === 'medium'
                        ? '⚠️'
                        : 'ℹ️'}
                  </span>
                  {alert.message}
                </div>
              ))}
            {geomagneticData?.storm_level !== 'None' && (
              <div className='alert warning'>
                <span className='alert-icon'>🌩️</span>
                Geomagnetic storm detected: {geomagneticData.storm_level}
              </div>
            )}
            {telemetry && issPosition && (
              <div className='alert info'>
                <span className='alert-icon'>✅</span>
                All systems operational
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className='openmct-mission-control'>
      {isInitialized ? (
        <div ref={mctContainerRef} className='mct-container' />
      ) : (
        <FallbackMissionControl />
      )}
    </div>
  );
};

export default OpenMCTMissionControl;
