const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Cesium configuration
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        cesium: path.resolve(__dirname, 'node_modules/cesium')
      };

      // Define Cesium global variables
      webpackConfig.plugins.push(
        new webpack.DefinePlugin({
          CESIUM_BASE_URL: JSON.stringify('/cesium')
        })
      );

      // Copy Cesium static files
      webpackConfig.plugins.push(
        new CopyWebpackPlugin({
          patterns: [
            {
              from: path.join(__dirname, 'node_modules/cesium/Build/Cesium/Workers'),
              to: 'cesium/Workers'
            },
            {
              from: path.join(__dirname, 'node_modules/cesium/Build/Cesium/ThirdParty'),
              to: 'cesium/ThirdParty'
            },
            {
              from: path.join(__dirname, 'node_modules/cesium/Build/Cesium/Assets'),
              to: 'cesium/Assets'
            },
            {
              from: path.join(__dirname, 'node_modules/cesium/Build/Cesium/Widgets'),
              to: 'cesium/Widgets'
            }
          ]
        })
      );

      // Handle Cesium's static assets
      webpackConfig.module.rules.push({
        test: /\.(png|gif|jpg|jpeg|svg|xml|json)$/,
        use: ['url-loader'],
        include: path.resolve(__dirname, 'node_modules/cesium/Source')
      });

      // Handle Cesium workers
      webpackConfig.output.sourcePrefix = '';
      
      return webpackConfig;
    }
  }
};