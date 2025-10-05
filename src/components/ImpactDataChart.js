import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

import { useSimulation } from '../context/SimulationContext';
import '../styles/components.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ImpactDataChart = () => {
  const { simulationResults } = useSimulation();
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!simulationResults || !chartRef.current) {
      return;
    }

    // Clean up previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');

    // Extract energy data from simulation results
    const totalEnergy = simulationResults.energy || simulationResults.impactEnergy || 0;
    const craterDiameter = simulationResults.craterDiameter || 0;
    
    // Calculate energy distribution based on total energy
    // These are realistic proportions for meteor impacts
    const kineticEnergy = totalEnergy * 0.4; // 40% kinetic
    const thermalEnergy = totalEnergy * 0.3; // 30% thermal
    const blastEnergy = totalEnergy * 0.2;   // 20% blast wave
    const seismicEnergy = totalEnergy * 0.1; // 10% seismic

    // Create data for chart based on simulation results
    const energyData = {
      labels: [
        'Kinetic Energy',
        'Thermal Energy',
        'Blast Energy',
        'Seismic Energy',
      ],
      datasets: [
        {
          label: 'Energy Distribution (Megatons TNT)',
          data: [
            kineticEnergy,
            thermalEnergy,
            blastEnergy,
            seismicEnergy,
          ],
          backgroundColor: [
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 99, 132, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };

    // Create chart
    chartInstance.current = new ChartJS(ctx, {
      type: 'bar',
      data: energyData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#e2e8f0',
            },
          },
          title: {
            display: true,
            text: 'Impact Energy Distribution',
            color: '#e2e8f0',
            font: {
              size: 16,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
            ticks: {
              color: '#e2e8f0',
            },
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
            ticks: {
              color: '#e2e8f0',
            },
          },
        },
      },
    });

    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [simulationResults]);

  return (
    <div className='visualization-container'>
      <div className='visualization-header'>
        <h2>Impact Data Analysis</h2>
      </div>
      <div
        className='chart-container'
        style={{ position: 'relative', height: '300px', width: '100%' }}
      >
        {simulationResults ? (
          <canvas ref={chartRef} />
        ) : (
          <div className='no-data-message'>
            Run a simulation to see impact data analysis
          </div>
        )}
      </div>
    </div>
  );
};

export default ImpactDataChart;
