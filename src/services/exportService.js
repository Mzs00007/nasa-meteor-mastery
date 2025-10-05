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
  async exportToPDF(results, parameters, impactData = null) {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      let yPosition = 20;

      // Header
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text(
        '🌌 Meteor Mastery - Detailed Impact Analysis',
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
        `Simulation ID: ${results?.simulationId || 'N/A'}`,
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
        ['Diameter', parameters?.diameter || 'N/A', 'm'],
        ['Velocity', parameters?.velocity || 'N/A', 'km/s'],
        ['Entry Angle', parameters?.angle || 'N/A', '°'],
        ['Composition', parameters?.composition || 'N/A', '-'],
        ['Atmospheric Density', parameters?.atmosphericDensity || 1.0, 'kg/m³'],
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

      // Add detailed impact data if available
      if (impactData) {
        // Check if we need a new page
        if (yPosition > pageHeight - 100) {
          doc.addPage();
          yPosition = 20;
        }

        // Impact Summary
        doc.setFontSize(16);
        doc.setTextColor(40, 40, 40);
        doc.text('💥 Impact Summary', 20, yPosition);
        yPosition += 10;

        const impactSummaryData = [
          ['Impact Metric', 'Value', 'Description'],
          ['Impact Speed', `${this.formatNumber(impactData.impactSpeed || 0)} mph`, 'Velocity at ground impact'],
          ['Impact Energy', `${this.formatNumber(impactData.impactEnergy || 0)} Gigatons TNT`, 'Total energy released'],
          ['Frequency', `Every ${this.formatNumber(impactData.frequency || 0)} years`, 'Average occurrence rate'],
          ['Energy Comparison', impactData.energyComparison || 'N/A', 'Relative to global energy consumption'],
        ];

        doc.autoTable({
          startY: yPosition,
          head: [impactSummaryData[0]],
          body: impactSummaryData.slice(1),
          theme: 'grid',
          headStyles: { fillColor: [239, 68, 68] },
          margin: { left: 20, right: 20 },
        });

        yPosition = doc.lastAutoTable.finalY + 20;

        // Crater Impact Section
        if (yPosition > pageHeight - 100) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(16);
        doc.setTextColor(40, 40, 40);
        doc.text('🕳️ Crater Impact', 20, yPosition);
        yPosition += 10;

        const craterData = [
          ['Crater Metric', 'Value', 'Impact'],
          ['Crater Diameter', `${this.formatNumber(impactData.craterDiameter || 0)} miles`, 'Size of impact crater'],
          ['Crater Depth', `${this.formatNumber(impactData.craterDepth || 0)} ft`, 'Depth of excavation'],
          ['Vaporized Casualties', this.formatNumber(impactData.craterCasualties || 0), 'People vaporized in crater'],
        ];

        doc.autoTable({
          startY: yPosition,
          head: [craterData[0]],
          body: craterData.slice(1),
          theme: 'grid',
          headStyles: { fillColor: [139, 69, 19] },
          margin: { left: 20, right: 20 },
        });

        yPosition = doc.lastAutoTable.finalY + 20;

        // Fireball Section
        if (yPosition > pageHeight - 100) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(16);
        doc.setTextColor(40, 40, 40);
        doc.text('🔥 Fireball Effects', 20, yPosition);
        yPosition += 10;

        const fireballData = [
          ['Fireball Metric', 'Value', 'Impact Zone'],
          ['Fireball Diameter', `${this.formatNumber(impactData.fireballDiameter || 0)} miles`, 'Size of thermal fireball'],
          ['Deaths from Fireball', this.formatNumber(impactData.fireballDeaths || 0), 'Immediate thermal deaths'],
          ['3rd Degree Burns', this.formatNumber(impactData.thirdDegreeBurns || 0), 'Severe burn casualties'],
          ['2nd Degree Burns', this.formatNumber(impactData.secondDegreeBurns || 0), 'Moderate burn casualties'],
          ['Clothing Ignition Range', `${this.formatNumber(impactData.clothingIgnitionRange || 0)} miles`, 'Distance clothes catch fire'],
          ['Tree Ignition Range', `${this.formatNumber(impactData.treeIgnitionRange || 0)} miles`, 'Distance trees catch fire'],
        ];

        doc.autoTable({
          startY: yPosition,
          head: [fireballData[0]],
          body: fireballData.slice(1),
          theme: 'grid',
          headStyles: { fillColor: [255, 69, 0] },
          margin: { left: 20, right: 20 },
        });

        yPosition = doc.lastAutoTable.finalY + 20;

        // Shockwave Section
        if (yPosition > pageHeight - 100) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(16);
        doc.setTextColor(40, 40, 40);
        doc.text('💨 Shockwave Effects', 20, yPosition);
        yPosition += 10;

        const shockwaveData = [
          ['Shockwave Metric', 'Value', 'Damage Zone'],
          ['Shockwave Intensity', `${this.formatNumber(impactData.shockwaveDecibels || 0)} decibels`, 'Sound pressure level'],
          ['Shockwave Deaths', this.formatNumber(impactData.shockwaveDeaths || 0), 'Deaths from pressure wave'],
          ['Lung Damage Range', `${this.formatNumber(impactData.lungDamageRange || 0)} miles`, 'Severe respiratory damage'],
          ['Eardrum Rupture Range', `${this.formatNumber(impactData.eardrumRuptureRange || 0)} miles`, 'Hearing damage zone'],
          ['Building Collapse Range', `${this.formatNumber(impactData.buildingCollapseRange || 0)} miles`, 'Structural failure zone'],
          ['Home Collapse Range', `${this.formatNumber(impactData.homeCollapseRange || 0)} miles`, 'Residential destruction'],
        ];

        doc.autoTable({
          startY: yPosition,
          head: [shockwaveData[0]],
          body: shockwaveData.slice(1),
          theme: 'grid',
          headStyles: { fillColor: [75, 85, 99] },
          margin: { left: 20, right: 20 },
        });

        yPosition = doc.lastAutoTable.finalY + 20;

        // Wind Blast Section
        if (yPosition > pageHeight - 100) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(16);
        doc.setTextColor(40, 40, 40);
        doc.text('🌪️ Wind Blast Effects', 20, yPosition);
        yPosition += 10;

        const windBlastData = [
          ['Wind Blast Metric', 'Value', 'Destruction Zone'],
          ['Peak Wind Speed', `${this.formatNumber(impactData.peakWindSpeed || 0)} mph`, 'Maximum wind velocity'],
          ['Wind Blast Deaths', this.formatNumber(impactData.windBlastDeaths || 0), 'Deaths from wind forces'],
          ['Jupiter Storm Comparison', `${this.formatNumber(impactData.jupiterStormRange || 0)} miles`, 'Winds faster than Jupiter storms'],
          ['Complete Leveling Range', `${this.formatNumber(impactData.completeLevelingRange || 0)} miles`, 'Total home destruction'],
          ['EF5 Tornado Range', `${this.formatNumber(impactData.ef5TornadoRange || 0)} miles`, 'Tornado-level winds'],
          ['Tree Destruction Range', `${this.formatNumber(impactData.treeDestructionRange || 0)} miles`, 'Forest devastation'],
        ];

        doc.autoTable({
          startY: yPosition,
          head: [windBlastData[0]],
          body: windBlastData.slice(1),
          theme: 'grid',
          headStyles: { fillColor: [34, 197, 94] },
          margin: { left: 20, right: 20 },
        });

        yPosition = doc.lastAutoTable.finalY + 20;

        // Earthquake Section
        if (yPosition > pageHeight - 100) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(16);
        doc.setTextColor(40, 40, 40);
        doc.text('🌍 Seismic Effects', 20, yPosition);
        yPosition += 10;

        const earthquakeData = [
          ['Seismic Metric', 'Value', 'Affected Area'],
          ['Earthquake Magnitude', `${this.formatNumber(impactData.earthquakeMagnitude || 0)} Richter`, 'Seismic intensity'],
          ['Earthquake Deaths', this.formatNumber(impactData.earthquakeDeaths || 0), 'Seismic casualties'],
          ['Felt Distance', `${this.formatNumber(impactData.earthquakeFeltDistance || 0)} miles`, 'Tremor detection range'],
        ];

        doc.autoTable({
          startY: yPosition,
          head: [earthquakeData[0]],
          body: earthquakeData.slice(1),
          theme: 'grid',
          headStyles: { fillColor: [168, 85, 247] },
          margin: { left: 20, right: 20 },
        });

        yPosition = doc.lastAutoTable.finalY + 20;

        // Total Casualties Summary
        if (yPosition > pageHeight - 100) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(16);
        doc.setTextColor(40, 40, 40);
        doc.text('📊 Total Impact Summary', 20, yPosition);
        yPosition += 10;

        const totalCasualties = (impactData.craterCasualties || 0) + 
                               (impactData.fireballDeaths || 0) + 
                               (impactData.shockwaveDeaths || 0) + 
                               (impactData.windBlastDeaths || 0) + 
                               (impactData.earthquakeDeaths || 0);

        const totalSummaryData = [
          ['Summary Metric', 'Value', 'Description'],
          ['Total Estimated Deaths', this.formatNumber(totalCasualties), 'Combined casualties from all effects'],
          ['Primary Cause of Death', impactData.primaryCause || 'Wind Blast', 'Most lethal impact effect'],
          ['Affected Radius', `${this.formatNumber(Math.max(
            impactData.treeDestructionRange || 0,
            impactData.earthquakeFeltDistance || 0,
            impactData.treeIgnitionRange || 0
          ))} miles`, 'Maximum impact radius'],
          ['Recovery Time Estimate', impactData.recoveryTime || '10+ years', 'Time for regional recovery'],
        ];

        doc.autoTable({
          startY: yPosition,
          head: [totalSummaryData[0]],
          body: totalSummaryData.slice(1),
          theme: 'grid',
          headStyles: { fillColor: [220, 38, 127] },
          margin: { left: 20, right: 20 },
        });

        yPosition = doc.lastAutoTable.finalY + 20;
      }

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
  exportToCSV(results, parameters, impactData = null) {
    try {
      const csvData = [];

      // Header
      csvData.push(['Meteor Mastery - Detailed Impact Analysis Export']);
      csvData.push(['Generated:', new Date().toISOString()]);
      csvData.push(['Simulation ID:', results?.simulationId || 'N/A']);
      csvData.push([]);

      // Parameters
      csvData.push(['SIMULATION PARAMETERS']);
      csvData.push(['Parameter', 'Value', 'Unit']);
      csvData.push(['Diameter', parameters?.diameter || 'N/A', 'm']);
      csvData.push(['Velocity', parameters?.velocity || 'N/A', 'km/s']);
      csvData.push(['Entry Angle', parameters?.angle || 'N/A', 'degrees']);
      csvData.push(['Composition', parameters?.composition || 'N/A', '']);
      csvData.push([
        'Atmospheric Density',
        parameters?.atmosphericDensity || 1.0,
        'kg/m³',
      ]);
      csvData.push(['Entry Altitude', parameters?.entryAltitude || 100000, 'm']);
      csvData.push(['Target Terrain', parameters?.targetTerrain || 'land', '']);
      csvData.push([]);

      // Add detailed impact data if available
      if (impactData) {
        // Impact Summary
        csvData.push(['IMPACT SUMMARY']);
        csvData.push(['Metric', 'Value', 'Unit/Description']);
        csvData.push(['Impact Speed', impactData.impactSpeed || 0, 'mph']);
        csvData.push(['Impact Energy', impactData.impactEnergy || 0, 'Gigatons TNT']);
        csvData.push(['Frequency', impactData.frequency || 0, 'years']);
        csvData.push(['Energy Comparison', impactData.energyComparison || 'N/A', 'relative to global consumption']);
        csvData.push([]);

        // Crater Impact
        csvData.push(['CRATER IMPACT']);
        csvData.push(['Metric', 'Value', 'Unit']);
        csvData.push(['Crater Diameter', impactData.craterDiameter || 0, 'miles']);
        csvData.push(['Crater Depth', impactData.craterDepth || 0, 'feet']);
        csvData.push(['Vaporized Casualties', impactData.craterCasualties || 0, 'people']);
        csvData.push([]);

        // Fireball Effects
        csvData.push(['FIREBALL EFFECTS']);
        csvData.push(['Metric', 'Value', 'Unit']);
        csvData.push(['Fireball Diameter', impactData.fireballDiameter || 0, 'miles']);
        csvData.push(['Fireball Deaths', impactData.fireballDeaths || 0, 'people']);
        csvData.push(['3rd Degree Burns', impactData.thirdDegreeBurns || 0, 'people']);
        csvData.push(['2nd Degree Burns', impactData.secondDegreeBurns || 0, 'people']);
        csvData.push(['Clothing Ignition Range', impactData.clothingIgnitionRange || 0, 'miles']);
        csvData.push(['Tree Ignition Range', impactData.treeIgnitionRange || 0, 'miles']);
        csvData.push([]);

        // Shockwave Effects
        csvData.push(['SHOCKWAVE EFFECTS']);
        csvData.push(['Metric', 'Value', 'Unit']);
        csvData.push(['Shockwave Intensity', impactData.shockwaveDecibels || 0, 'decibels']);
        csvData.push(['Shockwave Deaths', impactData.shockwaveDeaths || 0, 'people']);
        csvData.push(['Lung Damage Range', impactData.lungDamageRange || 0, 'miles']);
        csvData.push(['Eardrum Rupture Range', impactData.eardrumRuptureRange || 0, 'miles']);
        csvData.push(['Building Collapse Range', impactData.buildingCollapseRange || 0, 'miles']);
        csvData.push(['Home Collapse Range', impactData.homeCollapseRange || 0, 'miles']);
        csvData.push([]);

        // Wind Blast Effects
        csvData.push(['WIND BLAST EFFECTS']);
        csvData.push(['Metric', 'Value', 'Unit']);
        csvData.push(['Peak Wind Speed', impactData.peakWindSpeed || 0, 'mph']);
        csvData.push(['Wind Blast Deaths', impactData.windBlastDeaths || 0, 'people']);
        csvData.push(['Jupiter Storm Range', impactData.jupiterStormRange || 0, 'miles']);
        csvData.push(['Complete Leveling Range', impactData.completeLevelingRange || 0, 'miles']);
        csvData.push(['EF5 Tornado Range', impactData.ef5TornadoRange || 0, 'miles']);
        csvData.push(['Tree Destruction Range', impactData.treeDestructionRange || 0, 'miles']);
        csvData.push([]);

        // Seismic Effects
        csvData.push(['SEISMIC EFFECTS']);
        csvData.push(['Metric', 'Value', 'Unit']);
        csvData.push(['Earthquake Magnitude', impactData.earthquakeMagnitude || 0, 'Richter scale']);
        csvData.push(['Earthquake Deaths', impactData.earthquakeDeaths || 0, 'people']);
        csvData.push(['Felt Distance', impactData.earthquakeFeltDistance || 0, 'miles']);
        csvData.push([]);

        // Total Summary
        const totalCasualties = (impactData.craterCasualties || 0) + 
                               (impactData.fireballDeaths || 0) + 
                               (impactData.shockwaveDeaths || 0) + 
                               (impactData.windBlastDeaths || 0) + 
                               (impactData.earthquakeDeaths || 0);

        csvData.push(['TOTAL IMPACT SUMMARY']);
        csvData.push(['Metric', 'Value', 'Description']);
        csvData.push(['Total Estimated Deaths', totalCasualties, 'combined casualties']);
        csvData.push(['Primary Cause of Death', impactData.primaryCause || 'Wind Blast', 'most lethal effect']);
        csvData.push(['Maximum Affected Radius', Math.max(
          impactData.treeDestructionRange || 0,
          impactData.earthquakeFeltDistance || 0,
          impactData.treeIgnitionRange || 0
        ), 'miles']);
        csvData.push(['Recovery Time Estimate', impactData.recoveryTime || '10+ years', 'regional recovery']);
        csvData.push([]);
      }

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
