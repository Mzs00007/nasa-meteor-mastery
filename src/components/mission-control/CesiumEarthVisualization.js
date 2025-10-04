import React, { useEffect, useRef, useState } from 'react';

// Access global Cesium object loaded from CDN
const Cesium = window.Cesium;

// Set Cesium Ion access token
if (Cesium && Cesium.Ion) {
  Cesium.Ion.defaultAccessToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWE1OWUxNy1mMWZiLTQzYjYtYTQ0OS1kMWFjYmFkNjc5YzciLCJpZCI6NTc3MzMsImlhdCI6MTYyNzg0NTE4Mn0.XcKpgANiY19MC4bdFUXMVEBToBmqS8kuYpUlxJHYZxk';
}

const CesiumEarthVisualization = () => {
  const cesiumContainerRef = useRef(null);
  const viewerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!cesiumContainerRef.current) {
      return;
    }

    // Check if Cesium is available
    if (!window.Cesium) {
      setError(
        'Cesium library is not loaded. Please check your internet connection.'
      );
      setIsLoading(false);
      return;
    }

    const initializeCesium = async () => {
      try {
        // Initialize Cesium viewer with basic configuration first
        const viewer = new Cesium.Viewer(cesiumContainerRef.current, {
          imageryProvider: new Cesium.IonImageryProvider({ assetId: 3954 }),
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          sceneModePicker: false,
          navigationHelpButton: false,
          animation: false,
          timeline: false,
          fullscreenButton: false,
          vrButton: false,
          infoBox: false,
          selectionIndicator: false,
        });

        // Add terrain provider asynchronously
        try {
          const terrainProvider =
            await Cesium.CesiumTerrainProvider.fromIonAssetId(1);
          viewer.terrainProvider = terrainProvider;
        } catch (terrainError) {
          console.warn(
            'Could not load terrain provider, using default:',
            terrainError
          );
          // Continue with default terrain provider
        }

        // Set initial camera position to show Earth
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(
            -75.59777,
            40.03883,
            15000000.0
          ),
        });

        viewerRef.current = viewer;
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing Cesium:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    initializeCesium();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  if (error) {
    return (
      <div
        style={{
          padding: '20px',
          background: '#ff4444',
          color: 'white',
          borderRadius: '8px',
        }}
      >
        <h3>Error loading Earth visualization</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className='cesium-earth-visualization'>
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background:
              'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
            color: 'white',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              border: '4px solid rgba(255, 255, 255, 0.1)',
              borderLeft: '4px solid #4a90e2',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '20px',
            }}
          />
          <p>Loading Earth visualization...</p>
        </div>
      )}
      <div
        ref={cesiumContainerRef}
        style={{ width: '100%', height: '400px' }}
      />
    </div>
  );
};

export default CesiumEarthVisualization;
