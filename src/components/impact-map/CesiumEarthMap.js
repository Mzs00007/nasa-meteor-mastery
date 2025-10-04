import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';

// Function to wait for Cesium to load
const waitForCesium = () => {
  return new Promise((resolve, reject) => {
    const checkCesium = () => {
      if (window.Cesium) {
        resolve(window.Cesium);
      } else {
        setTimeout(checkCesium, 100);
      }
    };
    checkCesium();

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!window.Cesium) {
        reject(new Error('Cesium failed to load within 10 seconds'));
      }
    }, 10000);
  });
};

// Multiple Cesium Ion access tokens for redundancy
const CESIUM_TOKENS = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWE1OWUxNy1mMWZiLTQzYjYtYTQ0OS1kMWFjYmFkNjc5YzciLCJpZCI6NTc3MzMsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE2Mzg0NzI5NTJ9.VKdUTpWcRBJ8OdKqXlNQjKw7eYGiQqjd5c6FjV8XqWs',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5N2UyMjcwOS00MDY1LTQxYjEtYWE3My04YmQzNzM4YjNkMzciLCJpZCI6MTAzNDEwLCJpYXQiOjE2NjI0MjM4NzF9.4jSLJyj6fwg_nzHCNsqNd1KD5s7Vt8uGhRjFpLqE9Xc',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkZGNhMjlhMS00NjczLTQxMjYtYjc2ZC0zMGQ0ZjMwZGY3YzMiLCJpZCI6MTAzNDEwLCJpYXQiOjE2NjI0MjM4NzF9.Kg_nzHCNsqNd1KD5s7Vt8uGhRjFpLqE9XcjSLJyj6fw',
];

const CesiumEarthMap = forwardRef(
  (
    {
      meteorParams,
      simulationState,
      impactResults,
      mapSettings,
      onLocationSelect,
    },
    ref
  ) => {
    const cesiumContainerRef = useRef(null);
    const viewerRef = useRef(null);
    const meteorEntityRef = useRef(null);
    const trajectoryEntityRef = useRef(null);
    const impactEntityRef = useRef(null);
    const blastRadiusEntityRef = useRef(null);
    const seismicRingsRef = useRef([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    // Handle container resizing
    useEffect(() => {
      if (!cesiumContainerRef.current) {
        return;
      }

      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          setContainerSize({ width, height });

          // Trigger Cesium canvas resize if viewer exists
          if (viewerRef.current) {
            setTimeout(() => {
              viewerRef.current.resize();
            }, 100);
          }
        }
      });

      resizeObserver.observe(cesiumContainerRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }, []);

    // Initialize Cesium viewer
    useEffect(() => {
      if (!cesiumContainerRef.current || viewerRef.current) {
        return;
      }

      const initializeCesium = async () => {
        try {
          setIsLoading(true);
          setError(null);

          // Wait for Cesium to load
          const Cesium = await waitForCesium();

          // Try different tokens until one works
          let tokenWorked = false;
          for (const token of CESIUM_TOKENS) {
            try {
              Cesium.Ion.defaultAccessToken = token;
              // Test the token by trying to access Ion
              await Cesium.Ion.getDefaultTokenCredit();
              tokenWorked = true;
              break;
            } catch (e) {
              console.warn(`Token failed: ${token.substring(0, 20)}...`);
              continue;
            }
          }

          if (!tokenWorked) {
            console.warn('All Cesium tokens failed, using default imagery');
          }

          // Create fallback imagery provider
          let imageryProvider;
          try {
            if (tokenWorked) {
              imageryProvider = new Cesium.IonImageryProvider({
                assetId: 3954,
              });
            } else {
              // Fallback to OpenStreetMap
              imageryProvider = new Cesium.OpenStreetMapImageryProvider({
                url: 'https://a.tile.openstreetmap.org/',
              });
            }
          } catch (e) {
            console.warn(
              'Failed to create Ion imagery, using OpenStreetMap fallback'
            );
            imageryProvider = new Cesium.OpenStreetMapImageryProvider({
              url: 'https://a.tile.openstreetmap.org/',
            });
          }

          // Create terrain provider with fallback
          let terrainProvider;
          try {
            if (tokenWorked) {
              terrainProvider = Cesium.createWorldTerrain({
                requestWaterMask: true,
                requestVertexNormals: true,
              });
            } else {
              terrainProvider = new Cesium.EllipsoidTerrainProvider();
            }
          } catch (e) {
            console.warn(
              'Failed to create world terrain, using ellipsoid fallback'
            );
            terrainProvider = new Cesium.EllipsoidTerrainProvider();
          }

          const viewer = new Cesium.Viewer(cesiumContainerRef.current, {
            terrainProvider: terrainProvider,
            imageryProvider: imageryProvider,
            baseLayerPicker: true,
            geocoder: true,
            homeButton: true,
            sceneModePicker: true,
            navigationHelpButton: false,
            animation: false,
            timeline: false,
            fullscreenButton: true,
            vrButton: false,
            scene3DOnly: false,
            requestRenderMode: true,
            maximumRenderTimeChange: Infinity,
          });

          // Configure scene
          viewer.scene.globe.enableLighting = true;
          viewer.scene.globe.dynamicAtmosphereLighting = true;
          viewer.scene.globe.atmosphereLightIntensity = 10.0;
          viewer.scene.fog.enabled = true;
          viewer.scene.fog.density = 0.0002;

          // Set initial camera position
          viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(
              meteorParams.longitude,
              meteorParams.latitude,
              15000000
            ),
            orientation: {
              heading: 0.0,
              pitch: -Cesium.Math.PI_OVER_TWO,
              roll: 0.0,
            },
          });

          // Add click handler for location selection
          viewer.cesiumWidget.screenSpaceEventHandler.setInputAction(event => {
            const pickedPosition = viewer.camera.pickEllipsoid(
              event.position,
              viewer.scene.globe.ellipsoid
            );
            if (pickedPosition) {
              const cartographic =
                Cesium.Cartographic.fromCartesian(pickedPosition);
              const longitude = Cesium.Math.toDegrees(cartographic.longitude);
              const latitude = Cesium.Math.toDegrees(cartographic.latitude);
              onLocationSelect(latitude, longitude);
            }
          }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

          viewerRef.current = viewer;
          setIsLoading(false);
        } catch (error) {
          console.error('Error initializing Cesium viewer:', error);
          setError(`Failed to initialize 3D map: ${error.message}`);
          setIsLoading(false);
        }
      };

      // Start initialization
      initializeCesium();

      return () => {
        if (viewerRef.current) {
          viewerRef.current.destroy();
          viewerRef.current = null;
        }
      };
    }, []);

    // Update imagery based on map settings
    useEffect(() => {
      if (!viewerRef.current) {
        return;
      }

      const viewer = viewerRef.current;

      try {
        switch (mapSettings.viewMode) {
          case 'satellite':
            viewer.imageryLayers.removeAll();
            viewer.imageryLayers.addImageryProvider(
              new Cesium.IonImageryProvider({ assetId: 3954 })
            );
            break;
          case 'terrain':
            viewer.imageryLayers.removeAll();
            viewer.imageryLayers.addImageryProvider(
              new Cesium.IonImageryProvider({ assetId: 3812 })
            );
            break;
          case '3d':
          default:
            viewer.imageryLayers.removeAll();
            viewer.imageryLayers.addImageryProvider(
              new Cesium.IonImageryProvider({ assetId: 2 })
            );
            break;
        }
      } catch (error) {
        console.error('Error updating imagery:', error);
      }
    }, [mapSettings.viewMode]);

    // Update meteor position marker
    useEffect(() => {
      if (!viewerRef.current) {
        return;
      }

      const viewer = viewerRef.current;

      // Remove existing meteor entity
      if (meteorEntityRef.current) {
        viewer.entities.remove(meteorEntityRef.current);
      }

      // Add new meteor position marker
      meteorEntityRef.current = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(
          meteorParams.longitude,
          meteorParams.latitude,
          meteorParams.altitude
        ),
        point: {
          pixelSize: 15,
          color: Cesium.Color.ORANGE,
          outlineColor: Cesium.Color.RED,
          outlineWidth: 3,
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          scaleByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e7, 0.5),
        },
        label: {
          text: `Impact Point\n${meteorParams.latitude.toFixed(4)}°, ${meteorParams.longitude.toFixed(4)}°`,
          font: '12pt sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -50),
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        },
      });

      // Update camera to focus on impact point
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          meteorParams.longitude,
          meteorParams.latitude,
          1000000
        ),
        duration: 2.0,
      });
    }, [meteorParams.latitude, meteorParams.longitude, meteorParams.altitude]);

    // Create trajectory visualization
    const createTrajectory = () => {
      if (!viewerRef.current) {
        return;
      }

      const viewer = viewerRef.current;

      // Remove existing trajectory
      if (trajectoryEntityRef.current) {
        viewer.entities.remove(trajectoryEntityRef.current);
      }

      // Calculate trajectory points
      const startAltitude = meteorParams.altitude;
      const endAltitude = 0;
      const angle = Cesium.Math.toRadians(meteorParams.angle);
      const distance = startAltitude / Math.tan(angle);

      const startLon =
        meteorParams.longitude -
        (distance / 111320) *
          Math.cos(Cesium.Math.toRadians(meteorParams.latitude));
      const startLat = meteorParams.latitude - distance / 110540;

      const positions = [];
      const numPoints = 50;

      for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const lon = startLon + t * (meteorParams.longitude - startLon);
        const lat = startLat + t * (meteorParams.latitude - startLat);
        const alt = startAltitude * (1 - t);
        positions.push(Cesium.Cartesian3.fromDegrees(lon, lat, alt));
      }

      trajectoryEntityRef.current = viewer.entities.add({
        polyline: {
          positions: positions,
          width: 5,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.2,
            color: Cesium.Color.ORANGE,
          }),
          clampToGround: false,
        },
      });
    };

    // Create impact visualization
    const createImpactVisualization = () => {
      if (!viewerRef.current || !impactResults.craterDiameter) {
        return;
      }

      const viewer = viewerRef.current;

      // Remove existing impact visualization
      if (impactEntityRef.current) {
        viewer.entities.remove(impactEntityRef.current);
      }

      // Create crater
      impactEntityRef.current = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(
          meteorParams.longitude,
          meteorParams.latitude,
          0
        ),
        ellipse: {
          semiMajorAxis: impactResults.craterDiameter / 2,
          semiMinorAxis: impactResults.craterDiameter / 2,
          material: Cesium.Color.RED.withAlpha(0.5),
          outline: true,
          outlineColor: Cesium.Color.RED,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      });

      // Create blast radius
      if (blastRadiusEntityRef.current) {
        viewer.entities.remove(blastRadiusEntityRef.current);
      }

      blastRadiusEntityRef.current = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(
          meteorParams.longitude,
          meteorParams.latitude,
          0
        ),
        ellipse: {
          semiMajorAxis: impactResults.blastRadius,
          semiMinorAxis: impactResults.blastRadius,
          material: Cesium.Color.YELLOW.withAlpha(0.2),
          outline: true,
          outlineColor: Cesium.Color.YELLOW,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      });

      // Create seismic rings
      seismicRingsRef.current.forEach(ring => viewer.entities.remove(ring));
      seismicRingsRef.current = [];

      if (mapSettings.showSeismicRings && impactResults.seismicMagnitude > 0) {
        const numRings = Math.min(
          5,
          Math.floor(impactResults.seismicMagnitude)
        );
        for (let i = 1; i <= numRings; i++) {
          const radius = impactResults.blastRadius * (i * 2);
          const ring = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(
              meteorParams.longitude,
              meteorParams.latitude,
              0
            ),
            ellipse: {
              semiMajorAxis: radius,
              semiMinorAxis: radius,
              material: Cesium.Color.CYAN.withAlpha(0.1),
              outline: true,
              outlineColor: Cesium.Color.CYAN.withAlpha(0.5),
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            },
          });
          seismicRingsRef.current.push(ring);
        }
      }
    };

    // Animate impact sequence
    const animateImpact = async (meteorParams, results) => {
      if (!viewerRef.current) {
        return;
      }

      const viewer = viewerRef.current;

      // Create trajectory
      createTrajectory();

      // Animate meteor along trajectory
      const startTime = Cesium.JulianDate.now();
      const stopTime = Cesium.JulianDate.addSeconds(
        startTime,
        10,
        new Cesium.JulianDate()
      );

      viewer.clock.startTime = startTime.clone();
      viewer.clock.stopTime = stopTime.clone();
      viewer.clock.currentTime = startTime.clone();
      viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
      viewer.clock.multiplier = 1;

      // Create animated meteor
      const meteorEntity = viewer.entities.add({
        availability: new Cesium.TimeIntervalCollection([
          new Cesium.TimeInterval({
            start: startTime,
            stop: stopTime,
          }),
        ]),
        position: new Cesium.SampledPositionProperty(),
        point: {
          pixelSize: 20,
          color: Cesium.Color.ORANGE,
          outlineColor: Cesium.Color.RED,
          outlineWidth: 3,
        },
        path: {
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.3,
            color: Cesium.Color.ORANGE,
          }),
          width: 10,
          leadTime: 0,
          trailTime: 2,
        },
      });

      // Add position samples
      const startAltitude = meteorParams.altitude;
      const angle = Cesium.Math.toRadians(meteorParams.angle);
      const distance = startAltitude / Math.tan(angle);
      const startLon =
        meteorParams.longitude -
        (distance / 111320) *
          Math.cos(Cesium.Math.toRadians(meteorParams.latitude));
      const startLat = meteorParams.latitude - distance / 110540;

      for (let i = 0; i <= 100; i++) {
        const t = i / 100;
        const time = Cesium.JulianDate.addSeconds(
          startTime,
          t * 10,
          new Cesium.JulianDate()
        );
        const lon = startLon + t * (meteorParams.longitude - startLon);
        const lat = startLat + t * (meteorParams.latitude - startLat);
        const alt = startAltitude * (1 - t);
        const position = Cesium.Cartesian3.fromDegrees(lon, lat, alt);
        meteorEntity.position.addSample(time, position);
      }

      // Start animation
      viewer.clock.shouldAnimate = true;

      // Wait for impact
      await new Promise(resolve => setTimeout(resolve, 8000));

      // Create impact visualization
      createImpactVisualization();

      // Remove animated meteor
      viewer.entities.remove(meteorEntity);
    };

    // Reset visualization
    const resetVisualization = () => {
      if (!viewerRef.current) {
        return;
      }

      const viewer = viewerRef.current;

      // Remove all entities except the impact point marker
      const entitiesToRemove = [];
      viewer.entities.values.forEach(entity => {
        if (entity !== meteorEntityRef.current) {
          entitiesToRemove.push(entity);
        }
      });
      entitiesToRemove.forEach(entity => viewer.entities.remove(entity));

      // Clear refs
      trajectoryEntityRef.current = null;
      impactEntityRef.current = null;
      blastRadiusEntityRef.current = null;
      seismicRingsRef.current = [];

      // Reset clock
      viewer.clock.shouldAnimate = false;
    };

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      animateImpact,
      resetVisualization,
      createTrajectory,
      createImpactVisualization,
    }));

    // Update visualizations based on settings
    useEffect(() => {
      if (mapSettings.showTrajectory) {
        createTrajectory();
      } else if (trajectoryEntityRef.current) {
        viewerRef.current?.entities.remove(trajectoryEntityRef.current);
        trajectoryEntityRef.current = null;
      }
    }, [mapSettings.showTrajectory, meteorParams]);

    useEffect(() => {
      if (mapSettings.showBlastRadius && impactResults.blastRadius > 0) {
        createImpactVisualization();
      }
    }, [mapSettings.showBlastRadius, impactResults]);

    if (error) {
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--color-background-secondary)',
            borderRadius: 'var(--border-radius-lg)',
            color: 'var(--color-text-secondary)',
            textAlign: 'center',
            padding: '2rem',
          }}
        >
          <div>
            <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>⚠️</div>
            <div>{error}</div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--color-background-secondary)',
              borderRadius: 'var(--border-radius-lg)',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
              }}
            >
              <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                🌍
              </div>
              <div>Loading 3D Earth...</div>
            </div>
          </div>
        )}
        <div
          ref={cesiumContainerRef}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 'var(--border-radius-lg)',
          }}
        />
      </div>
    );
  }
);

CesiumEarthMap.displayName = 'CesiumEarthMap';

export default CesiumEarthMap;
