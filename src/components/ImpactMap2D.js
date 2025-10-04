import React, { useEffect, useRef, useState } from 'react';

import { useSimulation } from '../context/SimulationContext';
import { useEarthObservation, useWebSocket } from '../hooks/useWebSocket';
import visualizationDataIntegration from '../services/visualizationDataIntegration';


import '../styles/theme.css';
import '../styles/components.css';
import '../styles/seismic-data.css';
import '../styles/glassmorphic.css';

// OpenLayers imports
const ol = window.ol;

const ImpactMap2D = () => {
  const { impactLocation, simulationResults, loading } = useSimulation();
  const { satelliteImagery, environmentalIndicators, naturalDisasters } =
    useEarthObservation();
  const { isConnected, getCachedData } = useWebSocket();

  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [mapMode, setMapMode] = useState('nasa_satellite'); // nasa_satellite, nasa_blue_marble, usgs_terrain, standard
  const [overlayLayers, setOverlayLayers] = useState({
    impactZone: true,
    seismicData: true,
    atmosphericEffects: true,
    realTimeEvents: true,
    populationDensity: false,
    weatherData: false,
    tsunamiRisk: false,
  });
  const [seismicData, setSeismicData] = useState(null);
  const [realTimeEvents, setRealTimeEvents] = useState([]);
  const [mapInteractionMode, setMapInteractionMode] = useState('view'); // view, measure, analyze
  const [measurementData, setMeasurementData] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [timelinePosition, setTimelinePosition] = useState(0);
  const [downloadedData, setDownloadedData] = useState({});
  const [dataLoading, setDataLoading] = useState(false);
  const [elevationLayer, setElevationLayer] = useState(null);
  const [spaceWeatherLayer, setSpaceWeatherLayer] = useState(null);

  // Function to create base layers
  const createBaseLayers = () => {
    return {
      nasa_satellite: new ol.layer.Tile({
        source: new ol.source.XYZ({
          url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/{Time}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg',
          crossOrigin: 'anonymous',
          attributions: 'NASA Global Imagery Browse Services (GIBS)',
          maxZoom: 9,
        }),
        visible: mapMode === 'nasa_satellite',
      }),
      nasa_blue_marble: new ol.layer.Tile({
        source: new ol.source.XYZ({
          url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_NextGeneration/default/{Time}/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg',
          crossOrigin: 'anonymous',
          attributions: 'NASA Blue Marble Next Generation',
          maxZoom: 8,
        }),
        visible: mapMode === 'nasa_blue_marble',
      }),
      usgs_terrain: new ol.layer.Tile({
        source: new ol.source.XYZ({
          url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}',
          crossOrigin: 'anonymous',
          attributions: 'USGS The National Map',
        }),
        visible: mapMode === 'usgs_terrain',
      }),
      standard: new ol.layer.Tile({
        source: new ol.source.OSM(),
        visible: mapMode === 'standard',
      }),
    };
  };

  // Enhanced atmospheric effects visualization
  const createAtmosphericEffectsLayer = () => {
    if (!impactLocation || !simulationResults) {
      return null;
    }

    const features = [];
    const impactCoords = [impactLocation.longitude, impactLocation.latitude];

    // Create multiple concentric circles for atmospheric effects
    const effectRadii = [
      {
        radius: simulationResults.craterDiameter * 2,
        color: 'rgba(255, 100, 0, 0.3)',
        effect: 'Fireball',
      },
      {
        radius: simulationResults.craterDiameter * 5,
        color: 'rgba(255, 150, 0, 0.2)',
        effect: 'Thermal Radiation',
      },
      {
        radius: simulationResults.craterDiameter * 10,
        color: 'rgba(255, 200, 0, 0.15)',
        effect: 'Atmospheric Disturbance',
      },
      {
        radius: simulationResults.craterDiameter * 20,
        color: 'rgba(200, 200, 200, 0.1)',
        effect: 'Dust Cloud',
      },
    ];

    effectRadii.forEach((effect, index) => {
      const circle = new ol.geom.Circle(
        ol.proj.fromLonLat(impactCoords),
        effect.radius * 1000 // Convert km to meters
      );

      const feature = new ol.Feature({
        geometry: circle,
        effectType: effect.effect,
        radius: effect.radius,
      });

      const style = new ol.style.Style({
        fill: new ol.style.Fill({ color: effect.color }),
        stroke: new ol.style.Stroke({
          color: effect.color.replace(/0\.\d+/, '0.8'),
          width: 2,
          lineDash: [5, 5],
        }),
      });

      feature.setStyle(style);
      features.push(feature);
    });

    return new ol.layer.Vector({
      source: new ol.source.Vector({ features }),
      name: 'atmosphericEffects',
    });
  };

  // Enhanced impact zone visualization with detailed effects
  const createEnhancedImpactZone = () => {
    if (!impactLocation || !simulationResults) {
      return null;
    }

    const features = [];
    const impactCoords = [impactLocation.longitude, impactLocation.latitude];

    // Main crater
    const crater = new ol.geom.Circle(
      ol.proj.fromLonLat(impactCoords),
      (simulationResults.craterDiameter / 2) * 1000
    );

    const craterFeature = new ol.Feature({
      geometry: crater,
      type: 'crater',
      diameter: simulationResults.craterDiameter,
    });

    craterFeature.setStyle(
      new ol.style.Style({
        fill: new ol.style.Fill({ color: 'rgba(139, 0, 0, 0.6)' }),
        stroke: new ol.style.Stroke({
          color: 'rgba(255, 0, 0, 0.9)',
          width: 3,
        }),
      })
    );

    features.push(craterFeature);

    // Damage zones based on energy
    const energy = simulationResults.energy || 1e12;
    const damageZones = [
      {
        radius: simulationResults.craterDiameter * 3,
        color: 'rgba(255, 69, 0, 0.4)',
        type: 'Total Destruction',
        description: 'Complete structural collapse',
      },
      {
        radius: simulationResults.craterDiameter * 6,
        color: 'rgba(255, 140, 0, 0.3)',
        type: 'Severe Damage',
        description: 'Major structural damage',
      },
      {
        radius: simulationResults.craterDiameter * 12,
        color: 'rgba(255, 215, 0, 0.2)',
        type: 'Moderate Damage',
        description: 'Broken windows, minor damage',
      },
      {
        radius: simulationResults.craterDiameter * 25,
        color: 'rgba(255, 255, 0, 0.1)',
        type: 'Light Damage',
        description: 'Possible minor injuries',
      },
    ];

    damageZones.forEach(zone => {
      const circle = new ol.geom.Circle(
        ol.proj.fromLonLat(impactCoords),
        zone.radius * 1000
      );

      const feature = new ol.Feature({
        geometry: circle,
        damageType: zone.type,
        description: zone.description,
        radius: zone.radius,
      });

      feature.setStyle(
        new ol.style.Style({
          fill: new ol.style.Fill({ color: zone.color }),
          stroke: new ol.style.Stroke({
            color: zone.color.replace(/0\.\d+/, '0.8'),
            width: 2,
          }),
        })
      );

      features.push(feature);
    });

    return new ol.layer.Vector({
      source: new ol.source.Vector({ features }),
      name: 'enhancedImpactZone',
    });
  };

  // Population density overlay
  const createPopulationDensityLayer = () => {
    // Simulated population density data - in real implementation, this would come from actual data sources
    const populationCenters = [
      {
        coords: [-74.006, 40.7128],
        population: 8400000,
        name: 'New York City',
      },
      {
        coords: [-118.2437, 34.0522],
        population: 3900000,
        name: 'Los Angeles',
      },
      { coords: [-87.6298, 41.8781], population: 2700000, name: 'Chicago' },
      { coords: [2.3522, 48.8566], population: 2200000, name: 'Paris' },
      { coords: [139.6917, 35.6895], population: 13900000, name: 'Tokyo' },
    ];

    const features = populationCenters.map(center => {
      const feature = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat(center.coords)),
        population: center.population,
        name: center.name,
      });

      const radius = Math.log10(center.population) * 2;
      const style = new ol.style.Style({
        image: new ol.style.Circle({
          radius: radius,
          fill: new ol.style.Fill({ color: 'rgba(255, 0, 255, 0.6)' }),
          stroke: new ol.style.Stroke({ color: 'white', width: 1 }),
        }),
        text: new ol.style.Text({
          text: center.name,
          font: '12px Arial',
          fill: new ol.style.Fill({ color: 'white' }),
          stroke: new ol.style.Stroke({ color: 'black', width: 2 }),
          offsetY: -radius - 10,
        }),
      });

      feature.setStyle(style);
      return feature;
    });

    return new ol.layer.Vector({
      source: new ol.source.Vector({ features }),
      name: 'populationDensity',
    });
  };

  // Weather data overlay
  const createWeatherDataLayer = () => {
    // Simulated weather data
    const weatherStations = [
      { coords: [-100, 40], temp: 22, wind: 15, condition: 'Clear' },
      { coords: [-80, 35], temp: 28, wind: 8, condition: 'Cloudy' },
      { coords: [-120, 45], temp: 18, wind: 25, condition: 'Rainy' },
      { coords: [0, 50], temp: 15, wind: 12, condition: 'Overcast' },
      { coords: [20, 45], temp: 25, wind: 5, condition: 'Sunny' },
    ];

    const features = weatherStations.map(station => {
      const feature = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat(station.coords)),
        temperature: station.temp,
        windSpeed: station.wind,
        condition: station.condition,
      });

      const style = new ol.style.Style({
        image: new ol.style.Circle({
          radius: 8,
          fill: new ol.style.Fill({
            color:
              station.temp > 25
                ? 'rgba(255, 100, 100, 0.8)'
                : station.temp > 15
                  ? 'rgba(100, 255, 100, 0.8)'
                  : 'rgba(100, 100, 255, 0.8)',
          }),
          stroke: new ol.style.Stroke({ color: 'white', width: 2 }),
        }),
        text: new ol.style.Text({
          text: `${station.temp}°C`,
          font: '10px Arial',
          fill: new ol.style.Fill({ color: 'white' }),
          stroke: new ol.style.Stroke({ color: 'black', width: 1 }),
        }),
      });

      feature.setStyle(style);
      return feature;
    });

    return new ol.layer.Vector({
      source: new ol.source.Vector({ features }),
      name: 'weatherData',
    });
  };

  useEffect(() => {
    if (!mapRef.current || map) {
      return;
    }

    // Create base layers
    const baseLayers = createBaseLayers();

    // Initialize OpenLayers map with NASA GIBS as default
    const newMap = new ol.Map({
      target: mapRef.current,
      layers: Object.values(baseLayers),
      view: new ol.View({
        center: ol.proj.fromLonLat([0, 0]),
        zoom: 2,
        maxZoom: 18,
      }),
    });

    // Add click interaction for feature selection
    newMap.on('click', event => {
      const feature = newMap.forEachFeatureAtPixel(
        event.pixel,
        feature => feature
      );
      if (feature) {
        setSelectedFeature(feature);
      } else {
        setSelectedFeature(null);
      }
    });

    // Store base layers reference
    newMap.set('baseLayers', baseLayers);
    setMap(newMap);

    // Cleanup function
    return () => {
      if (newMap) {
        newMap.setTarget(null);
      }
    };
  }, []); // Empty dependency array to run only once

  // Fetch real-time seismic data
  useEffect(() => {
    if (isConnected) {
      const updateSeismicData = () => {
        const cachedSeismic = getCachedData('seismic_data');
        if (cachedSeismic) {
          setSeismicData(cachedSeismic);
        }

        const cachedEvents = getCachedData('real_time_events');
        if (cachedEvents) {
          setRealTimeEvents(cachedEvents.events || []);
        }
      };

      // Initial fetch
      updateSeismicData();

      // Set up periodic updates
      const interval = setInterval(updateSeismicData, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isConnected, getCachedData]);

  // Update map when impact location changes
  useEffect(() => {
    if (!map || !impactLocation) {
      return;
    }

    // Clear previous markers
    const layers = map.getLayers();
    const layersToRemove = [];
    layers.forEach(layer => {
      if (layer.get('name') === 'impactMarker') {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map.removeLayer(layer));

    // Add impact marker
    if (impactLocation && impactLocation.latitude && impactLocation.longitude) {
      // Create impact point feature
      const impactFeature = new ol.Feature({
        geometry: new ol.geom.Point(
          ol.proj.fromLonLat([
            impactLocation.longitude,
            impactLocation.latitude,
          ])
        ),
      });

      // Enhanced style for impact marker with pulsing animation
      const impactStyle = new ol.style.Style({
        image: new ol.style.Circle({
          radius: 12,
          fill: new ol.style.Fill({ color: 'rgba(255, 0, 0, 0.8)' }),
          stroke: new ol.style.Stroke({ color: 'white', width: 3 }),
        }),
        text: new ol.style.Text({
          text: '💥',
          font: '20px Arial',
          offsetY: -25,
        }),
      });

      impactFeature.setStyle(impactStyle);

      // Create vector layer for impact marker
      const impactLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
          features: [impactFeature],
        }),
        name: 'impactMarker',
      });

      // Add layer to map
      map.addLayer(impactLayer);

      // Center map on impact location
      map.getView().animate({
        center: ol.proj.fromLonLat([
          impactLocation.longitude,
          impactLocation.latitude,
        ]),
        zoom: 6,
        duration: 1500,
      });
    }
  }, [map, impactLocation]);

  // Update atmospheric effects overlay
  useEffect(() => {
    if (!map || !overlayLayers.atmosphericEffects) {
      return;
    }

    // Remove existing atmospheric layers
    const layers = map.getLayers();
    const layersToRemove = [];
    layers.forEach(layer => {
      if (layer.get('name') === 'atmosphericEffects') {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map.removeLayer(layer));

    // Add atmospheric effects layer
    const atmosphericLayer = createAtmosphericEffectsLayer();
    if (atmosphericLayer) {
      map.addLayer(atmosphericLayer);
    }
  }, [
    map,
    overlayLayers.atmosphericEffects,
    impactLocation,
    simulationResults,
  ]);

  // Update enhanced impact zone
  useEffect(() => {
    if (!map || !overlayLayers.impactZone) {
      return;
    }

    // Remove existing impact zone layers
    const layers = map.getLayers();
    const layersToRemove = [];
    layers.forEach(layer => {
      if (layer.get('name') === 'enhancedImpactZone') {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map.removeLayer(layer));

    // Add enhanced impact zone layer
    const impactZoneLayer = createEnhancedImpactZone();
    if (impactZoneLayer) {
      map.addLayer(impactZoneLayer);
    }
  }, [map, overlayLayers.impactZone, impactLocation, simulationResults]);

  // Update population density overlay
  useEffect(() => {
    if (!map || !overlayLayers.populationDensity) {
      return;
    }

    // Remove existing population layers
    const layers = map.getLayers();
    const layersToRemove = [];
    layers.forEach(layer => {
      if (layer.get('name') === 'populationDensity') {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map.removeLayer(layer));

    // Add population density layer
    const populationLayer = createPopulationDensityLayer();
    if (populationLayer) {
      map.addLayer(populationLayer);
    }
  }, [map, overlayLayers.populationDensity]);

  // Update weather data overlay
  useEffect(() => {
    if (!map || !overlayLayers.weatherData) {
      return;
    }

    // Remove existing weather layers
    const layers = map.getLayers();
    const layersToRemove = [];
    layers.forEach(layer => {
      if (layer.get('name') === 'weatherData') {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map.removeLayer(layer));

    // Add weather data layer
    const weatherLayer = createWeatherDataLayer();
    if (weatherLayer) {
      map.addLayer(weatherLayer);
    }
  }, [map, overlayLayers.weatherData]);

  useEffect(() => {
    if (!map || !seismicData || !overlayLayers.seismicData) {
      return;
    }

    // Remove existing seismic layers
    const layers = map.getLayers();
    const layersToRemove = [];
    layers.forEach(layer => {
      if (layer.get('name') === 'seismicData') {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map.removeLayer(layer));

    // Add earthquake markers
    if (seismicData.earthquakes && seismicData.earthquakes.length > 0) {
      const earthquakeFeatures = seismicData.earthquakes.map(earthquake => {
        const feature = new ol.Feature({
          geometry: new ol.geom.Point(
            ol.proj.fromLonLat([earthquake.longitude, earthquake.latitude])
          ),
          magnitude: earthquake.magnitude,
          location: earthquake.location,
          depth: earthquake.depth,
          time: earthquake.time,
          alertLevel: earthquake.alert_level,
        });

        // Style based on magnitude
        const magnitude = earthquake.magnitude || 0;
        let color = 'rgba(0, 255, 0, 0.7)'; // Green for small
        let radius = 4;

        if (magnitude >= 6.0) {
          color = 'rgba(255, 0, 0, 0.8)'; // Red for major
          radius = 12;
        } else if (magnitude >= 5.0) {
          color = 'rgba(255, 165, 0, 0.8)'; // Orange for moderate
          radius = 8;
        } else if (magnitude >= 3.0) {
          color = 'rgba(255, 255, 0, 0.7)'; // Yellow for minor
          radius = 6;
        }

        const style = new ol.style.Style({
          image: new ol.style.Circle({
            radius: radius,
            fill: new ol.style.Fill({ color: color }),
            stroke: new ol.style.Stroke({
              color: 'white',
              width: 1,
            }),
          }),
          text: new ol.style.Text({
            text: magnitude.toFixed(1),
            font: '10px Arial',
            fill: new ol.style.Fill({ color: 'white' }),
            stroke: new ol.style.Stroke({ color: 'black', width: 1 }),
          }),
        });

        feature.setStyle(style);
        return feature;
      });

      const seismicLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
          features: earthquakeFeatures,
        }),
        name: 'seismicData',
      });

      map.addLayer(seismicLayer);
    }
  }, [map, seismicData, overlayLayers.seismicData]);

  // Update real-time events overlay
  useEffect(() => {
    if (!map || !realTimeEvents || !overlayLayers.realTimeEvents) {
      return;
    }

    // Remove existing event layers
    const layers = map.getLayers();
    const layersToRemove = [];
    layers.forEach(layer => {
      if (layer.get('name') === 'realTimeEvents') {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map.removeLayer(layer));

    // Add event markers
    if (realTimeEvents.length > 0) {
      const eventFeatures = realTimeEvents
        .filter(event => event.latitude && event.longitude)
        .map(event => {
          const feature = new ol.Feature({
            geometry: new ol.geom.Point(
              ol.proj.fromLonLat([event.longitude, event.latitude])
            ),
            eventType: event.type,
            description: event.description,
            severity: event.severity,
            timestamp: event.timestamp,
          });

          // Style based on event type
          let color = 'rgba(0, 150, 255, 0.7)'; // Blue default
          let symbol = '●';

          switch (event.type) {
            case 'space_weather':
              color = 'rgba(255, 100, 255, 0.8)';
              symbol = '☀';
              break;
            case 'satellite_alert':
              color = 'rgba(255, 200, 0, 0.8)';
              symbol = '🛰';
              break;
            case 'atmospheric':
              color = 'rgba(100, 255, 100, 0.8)';
              symbol = '🌪';
              break;
            default:
              symbol = '●';
          }

          const style = new ol.style.Style({
            text: new ol.style.Text({
              text: symbol,
              font: '16px Arial',
              fill: new ol.style.Fill({ color: color }),
              stroke: new ol.style.Stroke({ color: 'white', width: 1 }),
            }),
          });

          feature.setStyle(style);
          return feature;
        });

      if (eventFeatures.length > 0) {
        const eventsLayer = new ol.layer.Vector({
          source: new ol.source.Vector({
            features: eventFeatures,
          }),
          name: 'realTimeEvents',
        });

        map.addLayer(eventsLayer);
      }
    }
  }, [map, realTimeEvents, overlayLayers.realTimeEvents]);

  // Change map mode
  const changeMapMode = mode => {
    setMapMode(mode);
    if (!map) {
      return;
    }

    const baseLayers = map.get('baseLayers');
    if (baseLayers) {
      // Update visibility of all base layers
      Object.keys(baseLayers).forEach(key => {
        const layer = baseLayers[key];
        layer.setVisible(key === mode);
      });
    }
  };

  const toggleOverlay = overlayName => {
    setOverlayLayers(prev => ({
      ...prev,
      [overlayName]: !prev[overlayName],
    }));
  };

  const calculateImpactPrediction = () => {
    if (!impactLocation || !seismicData) {
      return null;
    }

    // Simple impact prediction based on nearby seismic activity
    const nearbyEarthquakes =
      seismicData.earthquakes?.filter(eq => {
        const distance = Math.sqrt(
          Math.pow(eq.latitude - impactLocation.latitude, 2) +
            Math.pow(eq.longitude - impactLocation.longitude, 2)
        );
        return distance < 5; // Within 5 degrees
      }) || [];

    const avgMagnitude =
      nearbyEarthquakes.length > 0
        ? nearbyEarthquakes.reduce((sum, eq) => sum + eq.magnitude, 0) /
          nearbyEarthquakes.length
        : 0;

    return {
      nearbySeismicActivity: nearbyEarthquakes.length,
      averageMagnitude: avgMagnitude,
      riskLevel:
        avgMagnitude > 5 ? 'High' : avgMagnitude > 3 ? 'Moderate' : 'Low',
    };
  };

  const formatImpactEnergy = energy => {
    if (energy < 1e12) {
      return `${(energy / 1e9).toFixed(2)} kilotons TNT`;
    } else if (energy < 1e15) {
      return `${(energy / 1e12).toFixed(2)} megatons TNT`;
    }
    return `${(energy / 1e15).toFixed(2)} gigatons TNT`;
  };

  // Data integration setup
  useEffect(() => {
    const componentId = 'impactMap2D';

    // Define data types needed for this component
    const dataTypes = [
      {
        type: 'elevation',
        params: {
          bounds: impactLocation
            ? {
                north: impactLocation.latitude + 2,
                south: impactLocation.latitude - 2,
                east: impactLocation.longitude + 2,
                west: impactLocation.longitude - 2,
              }
            : { north: 45, south: 35, east: -110, west: -120 },
        },
      },
      {
        type: 'spaceWeather',
        params: {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
        },
      },
      {
        type: 'neoData',
        params: {
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
        },
      },
    ];

    // Data update callback
    const handleDataUpdate = data => {
      setDataLoading(false);
      setDownloadedData(data);

      // Process elevation data for enhanced terrain visualization
      if (data.elevation && map) {
        const transformedElevation =
          visualizationDataIntegration.transformElevationDataForImpactMap(
            data.elevation,
            dataTypes[0].params.bounds
          );

        if (transformedElevation) {
          // Create elevation contour layer
          const elevationFeatures = [];
          // Add elevation visualization logic here

          const newElevationLayer = new ol.layer.Vector({
            source: new ol.source.Vector({ features: elevationFeatures }),
            name: 'elevationData',
            opacity: 0.6,
          });

          // Remove existing elevation layer
          if (elevationLayer) {
            map.removeLayer(elevationLayer);
          }

          map.addLayer(newElevationLayer);
          setElevationLayer(newElevationLayer);
        }
      }

      // Process space weather data for atmospheric effects
      if (data.spaceWeather && map) {
        const transformedSpaceWeather =
          visualizationDataIntegration.transformSpaceWeatherDataForViz(
            data.spaceWeather
          );

        if (transformedSpaceWeather) {
          // Create space weather effects layer
          const spaceWeatherFeatures = [];

          // Add solar flare effects
          transformedSpaceWeather.solarFlares.forEach(flare => {
            if (flare.intensity > 1000) {
              // Only show significant flares
              const feature = new ol.Feature({
                geometry: new ol.geom.Point([0, 0]), // Global effect
                flareClass: flare.classType,
                intensity: flare.intensity,
                time: flare.peakTime,
              });

              const style = new ol.style.Style({
                image: new ol.style.Circle({
                  radius: Math.log10(flare.intensity) * 2,
                  fill: new ol.style.Fill({ color: 'rgba(255, 100, 0, 0.4)' }),
                  stroke: new ol.style.Stroke({ color: 'orange', width: 2 }),
                }),
              });

              feature.setStyle(style);
              spaceWeatherFeatures.push(feature);
            }
          });

          const newSpaceWeatherLayer = new ol.layer.Vector({
            source: new ol.source.Vector({ features: spaceWeatherFeatures }),
            name: 'spaceWeatherData',
            opacity: 0.7,
          });

          // Remove existing space weather layer
          if (spaceWeatherLayer) {
            map.removeLayer(spaceWeatherLayer);
          }

          map.addLayer(newSpaceWeatherLayer);
          setSpaceWeatherLayer(newSpaceWeatherLayer);
        }
      }
    };

    // Subscribe to data updates
    setDataLoading(true);
    visualizationDataIntegration.subscribeToData(
      componentId,
      dataTypes,
      handleDataUpdate
    );

    // Set up auto-refresh every 5 minutes
    visualizationDataIntegration.setupAutoRefresh(componentId, 300000);

    // Cleanup on unmount
    return () => {
      visualizationDataIntegration.unsubscribeFromData(componentId);
    };
  }, [map, impactLocation, elevationLayer, spaceWeatherLayer]);

  return (
    <div className='impact-map-container'>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '16px',
        padding: '24px',
        margin: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <div className='impact-map-header'>
          <h2 className='impact-map-title'>Impact Visualization</h2>
          <div className='connection-status'>
            <div
              className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}
            />
            <span className='status-text'>
              {isConnected ? 'Live Data' : 'Offline'}
            </span>
          </div>
        </div>

        <div className='map-controls-section'>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <h4 className='controls-title'>Base Layer</h4>
            <div className='control-buttons'>
              <button
                onClick={() => changeMapMode('nasa_satellite')}
                title='Switch to NASA satellite imagery base layer'
                style={{
                  background: mapMode === 'nasa_satellite' 
                    ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  margin: '4px'
                }}
                onMouseEnter={(e) => {
                  if (mapMode === 'nasa_satellite') {
                    e.target.style.background = 'linear-gradient(135deg, #2563eb, #7c3aed)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  }
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (mapMode === 'nasa_satellite') {
                    e.target.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                NASA Satellite
              </button>
              <button
                onClick={() => changeMapMode('nasa_blue_marble')}
                title='Switch to NASA Blue Marble Earth imagery'
                style={{
                  background: mapMode === 'nasa_blue_marble' 
                    ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  margin: '4px'
                }}
                onMouseEnter={(e) => {
                  if (mapMode === 'nasa_blue_marble') {
                    e.target.style.background = 'linear-gradient(135deg, #2563eb, #7c3aed)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  }
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (mapMode === 'nasa_blue_marble') {
                    e.target.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Blue Marble
              </button>
              <button
                onClick={() => changeMapMode('usgs_terrain')}
                title='Switch to USGS terrain and topographic map'
                style={{
                  background: mapMode === 'usgs_terrain' 
                    ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  margin: '4px'
                }}
                onMouseEnter={(e) => {
                  if (mapMode === 'usgs_terrain') {
                    e.target.style.background = 'linear-gradient(135deg, #2563eb, #7c3aed)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  }
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (mapMode === 'usgs_terrain') {
                    e.target.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                USGS Terrain
              </button>
              <button
                onClick={() => changeMapMode('standard')}
                title='Switch to standard OpenStreetMap base layer'
                style={{
                  background: mapMode === 'standard' 
                    ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  margin: '4px'
                }}
                onMouseEnter={(e) => {
                  if (mapMode === 'standard') {
                    e.target.style.background = 'linear-gradient(135deg, #2563eb, #7c3aed)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  }
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (mapMode === 'standard') {
                    e.target.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Standard
              </button>
            </div>
          </div>

          <div 
            className='overlay-controls'
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '16px'
            }}
          >
            <h4 className='controls-title'>Data Overlays</h4>
            <div className='control-buttons'>
              <button
                onClick={() => toggleOverlay('seismicData')}
                title='Toggle real-time seismic data'
                style={{
                  background: overlayLayers.seismicData 
                    ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  margin: '4px'
                }}
                onMouseEnter={(e) => {
                  if (overlayLayers.seismicData) {
                    e.target.style.background = 'linear-gradient(135deg, #2563eb, #7c3aed)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  }
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (overlayLayers.seismicData) {
                    e.target.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                🌍 Seismic Data
              </button>
              <button
                onClick={() => toggleOverlay('realTimeEvents')}
                title='Toggle real-time events'
                style={{
                  background: overlayLayers.realTimeEvents 
                    ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  margin: '4px'
                }}
                onMouseEnter={(e) => {
                  if (overlayLayers.realTimeEvents) {
                    e.target.style.background = 'linear-gradient(135deg, #2563eb, #7c3aed)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  }
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (overlayLayers.realTimeEvents) {
                    e.target.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                ⚡ Live Events
              </button>
              <button
                onClick={() => toggleOverlay('impactZone')}
                title='Toggle impact zone'
                style={{
                  background: overlayLayers.impactZone 
                    ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  margin: '4px'
                }}
                onMouseEnter={(e) => {
                  if (overlayLayers.impactZone) {
                    e.target.style.background = 'linear-gradient(135deg, #2563eb, #7c3aed)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  }
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (overlayLayers.impactZone) {
                    e.target.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                🎯 Impact Zone
              </button>
            </div>
          </div>
        </div>

        <div 
          className='map-container'
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '16px'
          }}
        >
          <div
            ref={mapRef}
            className='impact-map'
            style={{ width: '100%', height: '500px', borderRadius: '12px' }}
          />
          {loading && (
            <div className='glass-loading-overlay'>
              <div className='glass-spinner' />
              <div className='glass-loading-text'>Calculating Impact...</div>
            </div>
          )}
        </div>

        {simulationResults && (
          <div className='impact-details-grid'>
            <div 
              className='impact-analysis-card'
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px'
              }}
            >
              <h3 className='card-title'>Impact Analysis</h3>
              <div className='stats-grid'>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(5px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚡</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                    {formatImpactEnergy(simulationResults.energy)}
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Impact Energy</div>
                </div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(5px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🕳️</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                    {`${simulationResults.craterDiameter.toFixed(2)} km`}
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Crater Diameter</div>
                </div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(5px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>📍</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                    {`${Math.abs(impactLocation.latitude).toFixed(2)}°${impactLocation.latitude >= 0 ? 'N' : 'S'}, ${Math.abs(impactLocation.longitude).toFixed(2)}°${impactLocation.longitude >= 0 ? 'E' : 'W'}`}
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Impact Location</div>
                </div>
              </div>
            </div>

            {seismicData && (
              <div 
                className='seismic-data-card'
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '16px'
                }}
              >
                <h3 className='card-title'>Real-time Seismic Activity</h3>
                <div className='stats-grid'>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(5px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>🌍</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                      {seismicData.global_activity_level?.toUpperCase() || 'UNKNOWN'}
                    </div>
                    <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Global Activity Level</div>
                  </div>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(5px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                      {`${seismicData.total_events || 0} events`}
                    </div>
                    <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Recent Earthquakes</div>
                  </div>
                  {seismicData.earthquakes &&
                    seismicData.earthquakes.length > 0 && (
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(5px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        padding: '16px',
                        textAlign: 'center',
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                          {`M${Math.max(...seismicData.earthquakes.map(eq => eq.magnitude || 0)).toFixed(1)}`}
                        </div>
                        <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Largest Recent</div>
                      </div>
                    )}
                </div>
              </div>
            )}

            {calculateImpactPrediction() && (
              <div 
                className='risk-assessment-card'
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '16px'
                }}
              >
                <h3 className='card-title'>Impact Risk Assessment</h3>
                <div className='stats-grid'>
                  {(() => {
                    const prediction = calculateImpactPrediction();
                    return (
                      <>
                        <div style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          backdropFilter: 'blur(5px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          padding: '16px',
                          textAlign: 'center',
                          transition: 'all 0.3s ease'
                        }}>
                          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎯</div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                            {prediction.riskLevel}
                          </div>
                          <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Geological Risk Level</div>
                        </div>
                        <div style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          backdropFilter: 'blur(5px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          padding: '16px',
                          textAlign: 'center',
                          transition: 'all 0.3s ease'
                        }}>
                          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📍</div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                            {`${prediction.nearbySeismicActivity} events`}
                          </div>
                          <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Nearby Seismic Activity</div>
                        </div>
                        {prediction.averageMagnitude > 0 && (
                          <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(5px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            padding: '16px',
                            textAlign: 'center',
                            transition: 'all 0.3s ease'
                          }}>
                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📈</div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                              {`M${prediction.averageMagnitude.toFixed(1)}`}
                            </div>
                            <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Average Local Magnitude</div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {realTimeEvents && realTimeEvents.length > 0 && (
              <div 
                className='real-time-events-card'
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '16px'
                }}
              >
                <h3 className='card-title'>Real-time Events</h3>
                <div className='events-list'>
                  {realTimeEvents.slice(0, 3).map((event, index) => (
                    <div key={index} className='glass-event-item'>
                      <span className='event-type'>{event.type}</span>
                      <span className='event-description'>
                        {event.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImpactMap2D;
