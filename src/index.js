import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/main.css';
import './styles/theme.css';
import App from './App';
// Add local Cesium Widgets CSS to fix remote InfoBoxDescription.css load error
import 'cesium/Build/Cesium/Widgets/widgets.css';

const root = createRoot(document.getElementById('root'));
root.render(<App />);
