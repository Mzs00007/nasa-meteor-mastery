import jsPDF from 'jspdf';
import 'jspdf-autotable';

class ExportService {
  constructor() {
    this.formatNumber = (num, decimals = 2) => {
      if (num >= 1e9) {
        return `${(num / 1e9).toFixed(decimals)}B`;
      }
      if (num >= 1e6) {
        return `${(num / 1e6).toFixed(decimals)}M`;
      }
      if (num >= 1e3) {
        return `${(num / 1e3).toFixed(decimals)}K`;
      }
      return num.toFixed(decimals);
    };
  }

  /**
   * Export simulation results as PDF report
   */
  async exportToPDF(results, parameters) {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      let yPosition = 20;

      // Header
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text(
        '🌌 Meteor Mastery - Simulation Report',
        pageWidth / 2,
        yPosition,
        { align: 'center' }
      );
      yPosition += 15;

      // Simulation Info
      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      doc.text(
        `Report Generated: ${new Date().toLocaleString()}`,
        pageWidth / 2,
        yPosition,
        { align: 'center' }
      );
      yPosition += 10;
      doc.text(
        `Simulation ID: ${results.simulationId}`,
        pageWidth / 2,
        yPosition,
        { align: 'center' }
      );
      yPosition += 20;

      // Parameters Section
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text('📋 Simulation Parameters', 20, yPosition);
      yPosition += 10;

      const parameterData = [
        ['Parameter', 'Value', 'Unit'],
        ['Diameter', parameters.diameter, 'm'],
        ['Velocity', parameters.velocity, 'km/s'],
        ['Entry Angle', parameters.angle, '°'],
        ['Composition', parameters.composition, '-'],
        ['Atmospheric Density', parameters.atmosphericDensity || 1.0, 'kg/m³'],
        [
          'Entry Altitude',
          this.formatNumber(parameters.entryAltitude || 100000),
          'm',
        ],
        ['Target Terrain', parameters.targetTerrain || 'land', '-'],
      ];

      doc.autoTable({
        startY: yPosition,
        head: [parameterData[0]],
        body: parameterData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 20, right: 20 },
      });

      yPosition = doc.lastAutoTable.finalY + 20;

      // Results Section
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.text('📊 Simulation Results', 20, yPosition);
      yPosition += 10;

      const resultsData = [
        ['Metric', 'Value', 'Unit'],
        [
          'Impact Energy',
          this.formatNumber(results.summary.impactEnergy / 1e15),
          'PJ',
        ],
        [
          'TNT Equivalent',
          this.formatNumber(results.environmentalEffects?.tntEquivalent || 0),
          'tons',
        ],
        [
          'Crater Diameter',
          this.formatNumber(results.summary.craterDiameter),
          'm',
        ],
        [
          'Devastation Radius',
          this.formatNumber(results.summary.devastationRadius),
          'm',
        ],
        [
          'Airburst Altitude',
          results.summary.airburstAltitude
            ? this.formatNumber(results.summary.airburstAltitude)
            : 'Ground Impact',
          'm',
        ],
        [
          'Seismic Magnitude',
          results.impactPhase?.seismic?.magnitude?.toFixed(1) || 'N/A',
          'Richter',
        ],
        [
          'Global Cooling',
          results.environmentalEffects?.climateEffects?.globalCooling?.toFixed(
            2
          ) || 'N/A',
          '°C',
        ],
      ];

      doc.autoTable({
        startY: yPosition,
        head: [resultsData[0]],
        body: resultsData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68] },
        margin: { left: 20, right: 20 },
      });

      yPosition = doc.lastAutoTable.finalY + 20;

      // Environmental Effects
      if (results.environmentalEffects && yPosition < pageHeight - 80) {
        doc.setFontSize(16);
        doc.text('🌍 Environmental Impact', 20, yPosition);
        yPosition += 10;

        const envData = [
          ['Effect', 'Assessment', 'Details'],
          [
            'Tsunami Risk',
            results.environmentalEffects.tsunamiRisk?.risk || 'N/A',
            results.environmentalEffects.tsunamiRisk?.estimatedWaveHeight
              ? `${this.formatNumber(results.environmentalEffects.tsunamiRisk.estimatedWaveHeight)} m waves`
              : 'No significant waves',
          ],
          [
            'Climate Impact',
            results.environmentalEffects.climateEffects?.globalCooling
              ? 'Significant'
              : 'Minimal',
            `${results.environmentalEffects.climateEffects?.dustCloudDuration || 0} days dust cloud`,
          ],
          [
            'Ozone Damage',
            results.environmentalEffects.climateEffects?.ozoneDamage ||
              'Minimal',
            'Atmospheric chemistry effects',
          ],
        ];

        doc.autoTable({
          startY: yPosition,
          head: [envData[0]],
          body: envData.slice(1),
          theme: 'grid',
          headStyles: { fillColor: [34, 197, 94] },
          margin: { left: 20, right: 20 },
        });
      }

      // Footer
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(120, 120, 120);
        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth - 30,
          pageHeight - 10,
          { align: 'right' }
        );
        doc.text(
          'Generated by Meteor Mastery - NASA Integration',
          20,
          pageHeight - 10
        );
      }

      // Save the PDF
      const filename = `meteor-simulation-${results.simulationId}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);

      return { success: true, filename };
    } catch (error) {
      console.error('PDF export failed:', error);
      throw new Error(`Failed to generate PDF report: ${error.message}`);
    }
  }

  /**
   * Export simulation data as CSV
   */
  exportToCSV(results, parameters) {
    try {
      const csvData = [];

      // Header
      csvData.push(['Meteor Mastery - Simulation Data Export']);
      csvData.push(['Generated:', new Date().toISOString()]);
      csvData.push(['Simulation ID:', results.simulationId]);
      csvData.push([]);

      // Parameters
      csvData.push(['SIMULATION PARAMETERS']);
      csvData.push(['Parameter', 'Value', 'Unit']);
      csvData.push(['Diameter', parameters.diameter, 'm']);
      csvData.push(['Velocity', parameters.velocity, 'km/s']);
      csvData.push(['Entry Angle', parameters.angle, 'degrees']);
      csvData.push(['Composition', parameters.composition, '']);
      csvData.push([
        'Atmospheric Density',
        parameters.atmosphericDensity || 1.0,
        'kg/m³',
      ]);
      csvData.push(['Entry Altitude', parameters.entryAltitude || 100000, 'm']);
      csvData.push(['Target Terrain', parameters.targetTerrain || 'land', '']);
      csvData.push([]);

      // Results
      csvData.push(['SIMULATION RESULTS']);
      csvData.push(['Metric', 'Value', 'Unit']);
      csvData.push(['Impact Energy', results.summary.impactEnergy, 'J']);
      csvData.push([
        'TNT Equivalent',
        results.environmentalEffects?.tntEquivalent || 0,
        'tons',
      ]);
      csvData.push(['Crater Diameter', results.summary.craterDiameter, 'm']);
      csvData.push([
        'Crater Depth',
        results.impactPhase?.crater?.depth || 0,
        'm',
      ]);
      csvData.push([
        'Devastation Radius',
        results.summary.devastationRadius,
        'm',
      ]);
      csvData.push([
        'Airburst Altitude',
        results.summary.airburstAltitude || 0,
        'm',
      ]);
      csvData.push(['Final Mass', results.entryPhase?.finalMass || 0, 'kg']);
      csvData.push([]);

      // Trajectory Data (if available)
      if (
        results.entryPhase?.trajectory &&
        results.entryPhase.trajectory.length > 0
      ) {
        csvData.push(['TRAJECTORY DATA']);
        csvData.push([
          'Time (s)',
          'Altitude (m)',
          'Velocity (m/s)',
          'Mass (kg)',
          'Temperature (K)',
        ]);

        results.entryPhase.trajectory.forEach(point => {
          csvData.push([
            point.time,
            point.altitude,
            point.velocity,
            point.mass,
            point.temperature,
          ]);
        });
        csvData.push([]);
      }

      // Environmental Effects
      if (results.environmentalEffects) {
        csvData.push(['ENVIRONMENTAL EFFECTS']);
        csvData.push(['Effect', 'Value', 'Unit']);
        csvData.push([
          'Global Cooling',
          results.environmentalEffects.climateEffects?.globalCooling || 0,
          'degrees C',
        ]);
        csvData.push([
          'Dust Cloud Duration',
          results.environmentalEffects.climateEffects?.dustCloudDuration || 0,
          'days',
        ]);
        csvData.push([
          'Tsunami Risk Level',
          results.environmentalEffects.tsunamiRisk?.risk || 'none',
          '',
        ]);
        csvData.push([
          'Estimated Wave Height',
          results.environmentalEffects.tsunamiRisk?.estimatedWaveHeight || 0,
          'm',
        ]);
        csvData.push([
          'Seismic Magnitude',
          results.impactPhase?.seismic?.magnitude || 0,
          'Richter',
        ]);
        csvData.push([]);
      }

      // Convert to CSV string
      const csvContent = csvData
        .map(row =>
          row
            .map(cell => {
              // Escape quotes and wrap in quotes if contains comma
              const cellStr = String(cell);
              if (
                cellStr.includes(',') ||
                cellStr.includes('"') ||
                cellStr.includes('\n')
              ) {
                return `"${cellStr.replace(/"/g, '""')}"`;
              }
              return cellStr;
            })
            .join(',')
        )
        .join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const filename = `meteor-simulation-${results.simulationId}-${new Date().toISOString().split('T')[0]}.csv`;

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      return { success: true, filename };
    } catch (error) {
      console.error('CSV export failed:', error);
      throw new Error(`Failed to generate CSV file: ${error.message}`);
    }
  }

  /**
   * Export trajectory data as specialized CSV for analysis
   */
  exportTrajectoryCSV(results) {
    try {
      if (
        !results.entryPhase?.trajectory ||
        results.entryPhase.trajectory.length === 0
      ) {
        throw new Error('No trajectory data available for export');
      }

      const csvData = [];

      // Header
      csvData.push(['Meteor Mastery - Trajectory Data Export']);
      csvData.push(['Simulation ID:', results.simulationId]);
      csvData.push(['Generated:', new Date().toISOString()]);
      csvData.push([]);

      // Column headers
      csvData.push([
        'Time (s)',
        'Altitude (m)',
        'Velocity (m/s)',
        'Mass (kg)',
        'Temperature (K)',
        'Dynamic Pressure (Pa)',
        'Drag Force (N)',
        'Heat Flux (W/m²)',
        'Ablation Rate (kg/s)',
      ]);

      // Data rows
      results.entryPhase.trajectory.forEach(point => {
        csvData.push([
          point.time,
          point.altitude,
          point.velocity,
          point.mass,
          point.temperature,
          point.dynamicPressure || 0,
          point.dragForce || 0,
          point.heatFlux || 0,
          point.ablationRate || 0,
        ]);
      });

      // Convert to CSV and download
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const filename = `trajectory-data-${results.simulationId}-${new Date().toISOString().split('T')[0]}.csv`;

      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true, filename };
    } catch (error) {
      console.error('Trajectory CSV export failed:', error);
      throw new Error(`Failed to export trajectory data: ${error.message}`);
    }
  }

  /**
   * Export comparison data for multiple simulations
   */
  exportComparisonCSV(simulationResults) {
    try {
      const csvData = [];

      // Header
      csvData.push(['Meteor Mastery - Simulation Comparison Export']);
      csvData.push(['Generated:', new Date().toISOString()]);
      csvData.push(['Number of Simulations:', simulationResults.length]);
      csvData.push([]);

      // Column headers
      csvData.push([
        'Simulation ID',
        'Diameter (m)',
        'Velocity (km/s)',
        'Angle (deg)',
        'Composition',
        'Impact Energy (J)',
        'TNT Equivalent (tons)',
        'Crater Diameter (m)',
        'Devastation Radius (m)',
        'Airburst Altitude (m)',
        'Global Cooling (°C)',
        'Tsunami Risk',
      ]);

      // Data rows
      simulationResults.forEach(sim => {
        csvData.push([
          sim.results.simulationId,
          sim.parameters.diameter,
          sim.parameters.velocity,
          sim.parameters.angle,
          sim.parameters.composition,
          sim.results.summary.impactEnergy,
          sim.results.environmentalEffects?.tntEquivalent || 0,
          sim.results.summary.craterDiameter,
          sim.results.summary.devastationRadius,
          sim.results.summary.airburstAltitude || 0,
          sim.results.environmentalEffects?.climateEffects?.globalCooling || 0,
          sim.results.environmentalEffects?.tsunamiRisk?.risk || 'none',
        ]);
      });

      // Convert to CSV and download
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const filename = `simulation-comparison-${new Date().toISOString().split('T')[0]}.csv`;

      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true, filename };
    } catch (error) {
      console.error('Comparison CSV export failed:', error);
      throw new Error(`Failed to export comparison data: ${error.message}`);
    }
  }
}

export const exportService = new ExportService();
