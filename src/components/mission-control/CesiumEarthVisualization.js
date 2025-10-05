import React, { useEffect, useRef, useState } from 'react';
import { ModernSpinner, LoadingOverlay, ProgressBar } from '../ui/ModernLoadingComponents';

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
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('Initializing...');
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
        setLoadingStage('Loading Cesium viewer...');
        setLoadingProgress(20);

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

        setLoadingStage('Loading imagery...');
        setLoadingProgress(50);

        // Add terrain provider asynchronously
        try {
          setLoadingStage('Loading terrain data...');
          setLoadingProgress(70);
          
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

        setLoadingStage('Setting up camera...');
        setLoadingProgress(90);

        // Set initial camera position to show Earth
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(
            -75.59777,
            40.03883,
            15000000.0
          ),
        });

        setLoadingStage('Complete!');
        setLoadingProgress(100);

        // Small delay to show completion
        setTimeout(() => {
          viewerRef.current = viewer;
          setIsLoading(false);
        }, 500);
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
      <div className="flex items-center justify-center h-96 bg-gradient-to-br from-red-900/20 to-red-800/20 rounded-lg border border-red-500/30">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🌍💥</div>
          <h3 className="text-xl font-bold text-red-400 mb-2">
            Earth Visualization Error
          </h3>
          <p className="text-red-300 mb-4 max-w-md">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
          >
            🔄 Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='cesium-earth-visualization relative'>
      {isLoading && (
        <LoadingOverlay>
          <div className="text-center space-y-6">
            <ModernSpinner variant="orbit" size="lg" />
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-white">
                🌍 Loading Earth Visualization
              </h3>
              <p className="text-gray-300">{loadingStage}</p>
              <div className="w-64 mx-auto">
                <ProgressBar 
                  progress={loadingProgress} 
                  variant="gradient"
                  showPercentage={true}
                />
              </div>
            </div>
          </div>
        </LoadingOverlay>
      )}
      <div
        ref={cesiumContainerRef}
        style={{ width: '100%', height: '400px' }}
        className="rounded-lg overflow-hidden"
      />
    </div>
  );
};

export default CesiumEarthVisualization;
