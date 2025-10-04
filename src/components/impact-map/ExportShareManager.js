import React, { useState } from 'react';
import '../../styles/glassmorphic.css';

const ExportShareManager = ({
  impactResults,
  meteorParams,
  simulationHistory,
  onClose,
}) => {
  const [exportFormat, setExportFormat] = useState('json');
  const [shareOptions, setShareOptions] = useState({
    includeParameters: true,
    includeResults: true,
    includeVisualization: false,
    includeHistory: false,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  // Generate CSV data
  const generateCSV = () => {
    const headers = ['Parameter', 'Value', 'Unit', 'Description'];

    const data = [
      ['Diameter', meteorParams?.diameter || 0, 'm', 'Meteoroid diameter'],
      ['Velocity', meteorParams?.velocity || 0, 'm/s', 'Entry velocity'],
      ['Angle', meteorParams?.angle || 0, '°', 'Impact angle'],
      [
        'Composition',
        meteorParams?.composition || 'unknown',
        '',
        'Material type',
      ],
      ['Latitude', meteorParams?.latitude || 0, '°', 'Impact latitude'],
      ['Longitude', meteorParams?.longitude || 0, '°', 'Impact longitude'],
    ];

    if (impactResults) {
      data.push(
        [
          'Kinetic Energy',
          impactResults.kineticEnergy || 0,
          'J',
          'Total kinetic energy',
        ],
        [
          'TNT Equivalent',
          impactResults.tntEquivalent || 0,
          'kg',
          'TNT equivalent mass',
        ],
        [
          'Crater Diameter',
          impactResults.craterDiameter || 0,
          'm',
          'Final crater diameter',
        ],
        [
          'Blast Radius',
          impactResults.blastRadius || 0,
          'm',
          'Destructive blast radius',
        ],
        [
          'Seismic Magnitude',
          impactResults.seismicMagnitude || 0,
          'Richter',
          'Earthquake magnitude',
        ],
        [
          'Casualties',
          impactResults.casualties || 0,
          'people',
          'Estimated casualties',
        ],
        [
          'Peak Temperature',
          impactResults.peakTemperature || 0,
          'K',
          'Maximum temperature',
        ],
        [
          'Peak Pressure',
          impactResults.peakPressure || 0,
          'Pa',
          'Maximum pressure',
        ]
      );
    }

    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  };

  // Generate JSON data
  const generateJSON = () => {
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0',
        source: 'Meteor Madness Impact Simulator',
      },
      meteorParameters: shareOptions.includeParameters ? meteorParams : null,
      impactResults: shareOptions.includeResults ? impactResults : null,
      simulationHistory: shareOptions.includeHistory ? simulationHistory : null,
    };

    return JSON.stringify(exportData, null, 2);
  };

  // Generate PDF report
  const generatePDFReport = () => {
    const reportData = {
      title: 'Meteor Impact Simulation Report',
      date: new Date().toLocaleDateString(),
      parameters: meteorParams,
      results: impactResults,
      summary: generateSummaryText(),
    };

    return reportData;
  };

  // Generate summary text
  const generateSummaryText = () => {
    if (!impactResults || !meteorParams) {
      return 'No simulation results available.';
    }

    // Safe access with default values
    const kineticEnergy = impactResults.kineticEnergy || 0;
    const tntEquivalent = impactResults.tntEquivalent || 0;
    const craterDiameter = impactResults.craterDiameter || 0;
    const blastRadius = impactResults.blastRadius || 0;
    const seismicMagnitude = impactResults.seismicMagnitude || 0;
    const casualties = impactResults.casualties || 0;

    const diameter = meteorParams.diameter || 0;
    const composition = meteorParams.composition || 'unknown';
    const velocity = meteorParams.velocity || 0;

    const severity =
      kineticEnergy > 1e18
        ? 'catastrophic'
        : kineticEnergy > 1e15
          ? 'severe'
          : kineticEnergy > 1e12
            ? 'moderate'
            : 'minor';

    return `
A ${diameter}m ${composition} meteoroid impacting at ${velocity.toLocaleString()}m/s 
would create a ${severity} impact event. The impact would release ${kineticEnergy.toExponential(2)} Joules 
of energy, equivalent to ${(tntEquivalent / 1000000).toFixed(1)} megatons of TNT.

The resulting crater would be approximately ${craterDiameter.toFixed(1)}km in diameter, 
with a destructive blast radius extending ${(blastRadius / 1000).toFixed(1)}km from the impact site.
The seismic effects would register ${seismicMagnitude.toFixed(1)} on the Richter scale.

Estimated casualties in the immediate impact zone: ${casualties.toLocaleString()} people.
    `.trim();
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);

    try {
      let content, filename, mimeType;

      switch (exportFormat) {
        case 'csv':
          content = generateCSV();
          filename = `meteor-impact-${Date.now()}.csv`;
          mimeType = 'text/csv';
          break;
        case 'json':
          content = generateJSON();
          filename = `meteor-impact-${Date.now()}.json`;
          mimeType = 'application/json';
          break;
        case 'pdf':
          // For PDF, we'll create a formatted text report
          const reportData = generatePDFReport();
          content = `${reportData.title}\n${'='.repeat(50)}\n\nDate: ${reportData.date}\n\n${generateSummaryText()}`;
          filename = `meteor-impact-report-${Date.now()}.txt`;
          mimeType = 'text/plain';
          break;
        default:
          throw new Error('Unsupported export format');
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportComplete(true);
      setTimeout(() => setExportComplete(false), 3000);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle share
  const handleShare = async () => {
    const shareData = {
      title: 'Meteor Impact Simulation Results',
      text: generateSummaryText(),
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Share failed:', error);
        fallbackShare(shareData);
      }
    } else {
      fallbackShare(shareData);
    }
  };

  // Fallback share method
  const fallbackShare = shareData => {
    const shareText = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Share data copied to clipboard!');
      });
    } else {
      // Create temporary textarea for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = shareText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('Share data copied to clipboard!');
    }
  };

  return (
    <div className='export-share-manager'>
      <div className='glass-panel'>
        <div className='panel-header'>
          <h3>📤 Export & Share</h3>
          <button className='glass-btn-icon' onClick={onClose}>
            ✕
          </button>
        </div>

        <div className='export-section'>
          <h4>📊 Export Data</h4>

          <div className='format-selection'>
            <label className='format-option'>
              <input
                type='radio'
                value='csv'
                checked={exportFormat === 'csv'}
                onChange={e => setExportFormat(e.target.value)}
              />
              <div className='format-card'>
                <div className='format-icon'>📊</div>
                <div className='format-info'>
                  <h5>CSV Spreadsheet</h5>
                  <p>Tabular data for analysis</p>
                </div>
              </div>
            </label>

            <label className='format-option'>
              <input
                type='radio'
                value='json'
                checked={exportFormat === 'json'}
                onChange={e => setExportFormat(e.target.value)}
              />
              <div className='format-card'>
                <div className='format-icon'>📄</div>
                <div className='format-info'>
                  <h5>JSON Data</h5>
                  <p>Structured data format</p>
                </div>
              </div>
            </label>

            <label className='format-option'>
              <input
                type='radio'
                value='pdf'
                checked={exportFormat === 'pdf'}
                onChange={e => setExportFormat(e.target.value)}
              />
              <div className='format-card'>
                <div className='format-icon'>📋</div>
                <div className='format-info'>
                  <h5>Report</h5>
                  <p>Formatted summary report</p>
                </div>
              </div>
            </label>
          </div>

          <div className='export-options'>
            <h5>Include in Export:</h5>
            <div className='option-checkboxes'>
              <label className='checkbox-option'>
                <input
                  type='checkbox'
                  checked={shareOptions.includeParameters}
                  onChange={e =>
                    setShareOptions(prev => ({
                      ...prev,
                      includeParameters: e.target.checked,
                    }))
                  }
                />
                <span>Meteor Parameters</span>
              </label>

              <label className='checkbox-option'>
                <input
                  type='checkbox'
                  checked={shareOptions.includeResults}
                  onChange={e =>
                    setShareOptions(prev => ({
                      ...prev,
                      includeResults: e.target.checked,
                    }))
                  }
                  disabled={!impactResults}
                />
                <span>Impact Results</span>
              </label>

              <label className='checkbox-option'>
                <input
                  type='checkbox'
                  checked={shareOptions.includeHistory}
                  onChange={e =>
                    setShareOptions(prev => ({
                      ...prev,
                      includeHistory: e.target.checked,
                    }))
                  }
                  disabled={
                    !simulationHistory || simulationHistory.length === 0
                  }
                />
                <span>Simulation History</span>
              </label>
            </div>
          </div>

          <button
            className='glass-btn-primary export-btn'
            onClick={handleExport}
            disabled={
              isExporting ||
              (!shareOptions.includeParameters && !shareOptions.includeResults)
            }
          >
            {isExporting ? (
              <>⏳ Exporting...</>
            ) : exportComplete ? (
              <>✅ Export Complete!</>
            ) : (
              <>📥 Export {exportFormat.toUpperCase()}</>
            )}
          </button>
        </div>

        <div className='share-section'>
          <h4>🔗 Share Results</h4>

          <div className='share-preview'>
            <h5>Preview:</h5>
            <div className='preview-content'>
              <strong>Meteor Impact Simulation Results</strong>
              <p>{generateSummaryText().substring(0, 200)}...</p>
            </div>
          </div>

          <div className='share-buttons'>
            <button
              className='glass-btn-primary share-btn'
              onClick={handleShare}
            >
              🔗 Share Results
            </button>

            <button
              className='glass-btn-secondary share-btn'
              onClick={() => {
                const url = `${window.location.origin}/impact?params=${encodeURIComponent(JSON.stringify(meteorParams))}`;
                navigator.clipboard.writeText(url);
                alert('Scenario link copied to clipboard!');
              }}
            >
              📋 Copy Scenario Link
            </button>
          </div>
        </div>

        <div className='quick-actions'>
          <h4>⚡ Quick Actions</h4>
          <div className='action-buttons'>
            <button
              className='glass-btn-secondary action-btn'
              onClick={() => {
                const scenario = {
                  name: `Impact Scenario ${new Date().toLocaleDateString()}`,
                  parameters: meteorParams,
                  results: impactResults,
                  timestamp: Date.now(),
                };

                const scenarios = JSON.parse(
                  localStorage.getItem('meteorScenarios') || '[]'
                );
                scenarios.push(scenario);
                localStorage.setItem(
                  'meteorScenarios',
                  JSON.stringify(scenarios)
                );

                alert('Scenario saved locally!');
              }}
            >
              💾 Save Scenario
            </button>

            <button
              className='glass-btn-secondary action-btn'
              onClick={() => {
                const mailtoLink = `mailto:?subject=Meteor Impact Simulation Results&body=${encodeURIComponent(generateSummaryText())}`;
                window.open(mailtoLink);
              }}
            >
              📧 Email Results
            </button>

            <button
              className='glass-btn-secondary action-btn'
              onClick={() => {
                const tweetText = `Check out this meteor impact simulation: ${generateSummaryText().substring(0, 100)}... #MeteorMadness #SpaceScience`;
                const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
                window.open(twitterUrl, '_blank');
              }}
            >
              🐦 Tweet Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportShareManager;
