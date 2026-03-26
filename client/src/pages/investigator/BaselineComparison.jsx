import { useState, useEffect, useRef } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

// Scenario configurations
const SCENARIOS = [
  {
    id: 'late_access',
    name: '11pm System Access',
    description: 'After-hours system login attempt',
    eventTime: '11:04 PM',
    eventLabel: 'System Access at 11:04 PM',
    priya: {
      normalRange: [8, 23], // 8am to 11pm
      accessPattern: generateAccessPattern(8, 23, 0.85), // mostly within range
      currentHour: 23,
      anomalyScore: 12,
      outcome: 'approved',
      explanation: 'Priya works late regularly. This is completely normal for her.'
    },
    ramesh: {
      normalRange: [9, 18.5], // 9am to 6:30pm
      accessPattern: generateAccessPattern(9, 18, 0.95), // strictly within range
      currentHour: 23,
      anomalyScore: 87,
      outcome: 'blocked',
      explanation: 'Ramesh has never accessed systems after 7pm in 90 days. This is highly anomalous for him.'
    }
  },
  {
    id: 'bulk_download',
    name: 'Bulk Data Download',
    description: '500+ records downloaded in single session',
    eventTime: '2:30 PM',
    eventLabel: '500 Records Downloaded',
    priya: {
      normalRange: [100, 800], // typical download volume
      accessPattern: generateVolumePattern(200, 600, 0.9),
      currentVolume: 520,
      anomalyScore: 18,
      outcome: 'approved',
      explanation: 'Priya regularly processes large data sets for credit analysis. This volume is typical.'
    },
    ramesh: {
      normalRange: [10, 50], // low download volume
      accessPattern: generateVolumePattern(15, 45, 0.95),
      currentVolume: 520,
      anomalyScore: 91,
      outcome: 'blocked',
      explanation: 'Ramesh typically downloads 20-40 records. 500+ is 10x his normal volume.'
    }
  },
  {
    id: 'cross_system',
    name: 'Cross-System Access',
    description: 'Treasury system access from non-Treasury role',
    eventTime: '3:15 PM',
    eventLabel: 'Treasury System Access',
    priya: {
      systems: ['Core Banking', 'Credit Analysis', 'Treasury', 'Risk Management'],
      accessPattern: generateSystemPattern(['Core Banking', 'Credit Analysis', 'Treasury', 'Risk Management'], 0.7),
      currentSystem: 'Treasury',
      anomalyScore: 22,
      outcome: 'approved',
      explanation: 'Priya accesses Treasury weekly for credit limit approvals. This is part of her workflow.'
    },
    ramesh: {
      systems: ['Core Banking', 'Loan Origination'],
      accessPattern: generateSystemPattern(['Core Banking', 'Loan Origination'], 0.95),
      currentSystem: 'Treasury',
      anomalyScore: 94,
      outcome: 'blocked',
      explanation: 'Ramesh has zero Treasury access in 90 days. This is completely outside his role.'
    }
  }
];

// Generate time-based access pattern for 90 days
function generateAccessPattern(minHour, maxHour, concentration) {
  const data = [];
  for (let i = 0; i < 90; i++) {
    const numAccesses = Math.floor(Math.random() * 4) + 1;
    for (let j = 0; j < numAccesses; j++) {
      let hour;
      if (Math.random() < concentration) {
        // Within normal range
        hour = minHour + Math.random() * (maxHour - minHour);
      } else {
        // Outside range
        hour = Math.random() * 24;
      }
      data.push({ day: i, hour: hour });
    }
  }
  return data;
}

// Generate volume-based pattern
function generateVolumePattern(minVol, maxVol, concentration) {
  const data = [];
  for (let i = 0; i < 90; i++) {
    let volume;
    if (Math.random() < concentration) {
      volume = minVol + Math.random() * (maxVol - minVol);
    } else {
      volume = Math.random() * 1000;
    }
    data.push({ day: i, volume: Math.round(volume) });
  }
  return data;
}

// Generate system access pattern
function generateSystemPattern(systems, concentration) {
  const data = [];
  const allSystems = ['Core Banking', 'Loan Origination', 'Credit Analysis', 'Treasury', 'Risk Management', 'HR System'];
  for (let i = 0; i < 90; i++) {
    const numAccesses = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < numAccesses; j++) {
      let system;
      if (Math.random() < concentration) {
        system = systems[Math.floor(Math.random() * systems.length)];
      } else {
        system = allSystems[Math.floor(Math.random() * allSystems.length)];
      }
      data.push({ day: i, system });
    }
  }
  return data;
}

export default function BaselineComparison() {
  const [activeScenario, setActiveScenario] = useState(SCENARIOS[0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0); // 0: idle, 1: attempt, 2: analyzing, 3: result
  const [chartsVisible, setChartsVisible] = useState(false);
  const canvasLeftRef = useRef(null);
  const canvasRightRef = useRef(null);

  useEffect(() => {
    // Animate charts on load
    setTimeout(() => setChartsVisible(true), 300);
  }, []);

  useEffect(() => {
    if (chartsVisible) {
      drawChart(canvasLeftRef.current, activeScenario.priya, activeScenario.id, true);
      drawChart(canvasRightRef.current, activeScenario.ramesh, activeScenario.id, false);
    }
  }, [chartsVisible, activeScenario]);

  const drawChart = (canvas, data, scenarioId, isPriya) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, width, height);

    if (scenarioId === 'late_access') {
      drawTimeChart(ctx, data, width, height, padding, isPriya);
    } else if (scenarioId === 'bulk_download') {
      drawVolumeChart(ctx, data, width, height, padding, isPriya);
    } else {
      drawSystemChart(ctx, data, width, height, padding, isPriya);
    }
  };

  const drawTimeChart = (ctx, data, width, height, padding, isPriya) => {
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Draw normal range band
    const minY = padding + chartHeight - (data.normalRange[0] / 24) * chartHeight;
    const maxY = padding + chartHeight - (data.normalRange[1] / 24) * chartHeight;
    ctx.fillStyle = isPriya ? 'rgba(29, 158, 117, 0.15)' : 'rgba(226, 75, 74, 0.15)';
    ctx.fillRect(padding, maxY, chartWidth, minY - maxY);

    // Draw axes
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Y-axis labels (hours)
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    for (let h = 0; h <= 24; h += 6) {
      const y = padding + chartHeight - (h / 24) * chartHeight;
      ctx.fillText(`${h}:00`, padding - 5, y + 3);
    }

    // X-axis label
    ctx.textAlign = 'center';
    ctx.fillText('Last 90 Days', width / 2, height - 10);

    // Draw data points with animation
    data.accessPattern.forEach((point, i) => {
      const x = padding + (point.day / 90) * chartWidth;
      const y = padding + chartHeight - (point.hour / 24) * chartHeight;
      const isInRange = point.hour >= data.normalRange[0] && point.hour <= data.normalRange[1];

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = isInRange
        ? (isPriya ? 'rgba(29, 158, 117, 0.6)' : 'rgba(186, 117, 23, 0.6)')
        : 'rgba(226, 75, 74, 0.6)';
      ctx.fill();
    });

    // Draw current access point (larger, highlighted)
    if (animationPhase >= 1) {
      const x = width - padding - 20;
      const y = padding + chartHeight - (data.currentHour / 24) * chartHeight;
      const isInRange = data.currentHour >= data.normalRange[0] && data.currentHour <= data.normalRange[1];

      // Pulse effect
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fillStyle = isInRange ? 'rgba(29, 158, 117, 0.3)' : 'rgba(226, 75, 74, 0.3)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = isInRange ? '#1D9E75' : '#E24B4A';
      ctx.fill();

      ctx.fillStyle = 'white';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NOW', x, y + 3);
    }
  };

  const drawVolumeChart = (ctx, data, width, height, padding, isPriya) => {
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const maxVolume = 1000;

    // Draw normal range band
    const minY = padding + chartHeight - (data.normalRange[0] / maxVolume) * chartHeight;
    const maxY = padding + chartHeight - (data.normalRange[1] / maxVolume) * chartHeight;
    ctx.fillStyle = isPriya ? 'rgba(29, 158, 117, 0.15)' : 'rgba(226, 75, 74, 0.15)';
    ctx.fillRect(padding, maxY, chartWidth, minY - maxY);

    // Draw axes
    ctx.strokeStyle = '#d1d5db';
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    for (let v = 0; v <= maxVolume; v += 250) {
      const y = padding + chartHeight - (v / maxVolume) * chartHeight;
      ctx.fillText(`${v}`, padding - 5, y + 3);
    }

    ctx.textAlign = 'center';
    ctx.fillText('Records Downloaded (Last 90 Days)', width / 2, height - 10);

    // Draw bars
    const barWidth = chartWidth / 90 - 1;
    data.accessPattern.forEach((point, i) => {
      const x = padding + (i / 90) * chartWidth;
      const barHeight = (point.volume / maxVolume) * chartHeight;
      const y = padding + chartHeight - barHeight;
      const isInRange = point.volume >= data.normalRange[0] && point.volume <= data.normalRange[1];

      ctx.fillStyle = isInRange
        ? (isPriya ? 'rgba(29, 158, 117, 0.5)' : 'rgba(186, 117, 23, 0.5)')
        : 'rgba(226, 75, 74, 0.5)';
      ctx.fillRect(x, y, barWidth, barHeight);
    });

    // Current volume indicator
    if (animationPhase >= 1) {
      const x = width - padding - 15;
      const barHeight = (data.currentVolume / maxVolume) * chartHeight;
      const y = padding + chartHeight - barHeight;
      const isInRange = data.currentVolume >= data.normalRange[0] && data.currentVolume <= data.normalRange[1];

      ctx.fillStyle = isInRange ? '#1D9E75' : '#E24B4A';
      ctx.fillRect(x - 8, y, 16, barHeight);

      ctx.fillStyle = 'white';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.save();
      ctx.translate(x, y + barHeight / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('NOW', 0, 3);
      ctx.restore();
    }
  };

  const drawSystemChart = (ctx, data, width, height, padding, isPriya) => {
    const allSystems = ['Core Banking', 'Loan Orig.', 'Credit', 'Treasury', 'Risk Mgmt', 'HR'];
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Count accesses per system
    const counts = {};
    allSystems.forEach(s => counts[s] = 0);
    data.accessPattern.forEach(p => {
      const shortName = p.system.includes('Loan') ? 'Loan Orig.' :
                        p.system.includes('Credit') ? 'Credit' :
                        p.system.includes('Risk') ? 'Risk Mgmt' : p.system;
      if (counts[shortName] !== undefined) counts[shortName]++;
    });
    const maxCount = Math.max(...Object.values(counts), 1);

    // Draw bars
    const barWidth = chartWidth / allSystems.length - 10;
    allSystems.forEach((system, i) => {
      const x = padding + i * (chartWidth / allSystems.length) + 5;
      const barHeight = (counts[system] / maxCount) * (chartHeight - 30);
      const y = padding + chartHeight - 30 - barHeight;

      const isNormalSystem = data.systems.some(s =>
        s.includes('Loan') ? system === 'Loan Orig.' :
        s.includes('Credit') ? system === 'Credit' :
        s.includes('Risk') ? system === 'Risk Mgmt' : s === system
      );

      ctx.fillStyle = isNormalSystem
        ? (isPriya ? 'rgba(29, 158, 117, 0.6)' : 'rgba(186, 117, 23, 0.6)')
        : 'rgba(209, 213, 219, 0.6)';
      ctx.fillRect(x, y, barWidth, barHeight);

      // Label
      ctx.fillStyle = '#6b7280';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(system, x + barWidth / 2, height - padding + 15);
    });

    // Highlight current system
    if (animationPhase >= 1) {
      const currentShort = data.currentSystem.includes('Loan') ? 'Loan Orig.' :
                           data.currentSystem.includes('Credit') ? 'Credit' :
                           data.currentSystem.includes('Risk') ? 'Risk Mgmt' : data.currentSystem;
      const idx = allSystems.indexOf(currentShort);
      if (idx >= 0) {
        const x = padding + idx * (chartWidth / allSystems.length) + 5;
        const isNormal = data.systems.includes(data.currentSystem);

        ctx.strokeStyle = isNormal ? '#1D9E75' : '#E24B4A';
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 2, padding, barWidth + 4, chartHeight - 28);

        ctx.fillStyle = isNormal ? '#1D9E75' : '#E24B4A';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('NOW', x + barWidth / 2, padding - 5);
      }
    }
  };

  const triggerAnimation = async () => {
    setIsAnimating(true);
    setAnimationPhase(0);

    // Phase 1: Access attempt
    await new Promise(r => setTimeout(r, 500));
    setAnimationPhase(1);

    // Redraw charts with current access point
    drawChart(canvasLeftRef.current, activeScenario.priya, activeScenario.id, true);
    drawChart(canvasRightRef.current, activeScenario.ramesh, activeScenario.id, false);

    // Phase 2: Analyzing
    await new Promise(r => setTimeout(r, 1000));
    setAnimationPhase(2);

    // Phase 3: Results
    await new Promise(r => setTimeout(r, 1500));
    setAnimationPhase(3);

    setIsAnimating(false);
  };

  const resetAnimation = () => {
    setAnimationPhase(0);
    drawChart(canvasLeftRef.current, activeScenario.priya, activeScenario.id, true);
    drawChart(canvasRightRef.current, activeScenario.ramesh, activeScenario.id, false);
  };

  const handleScenarioChange = (scenario) => {
    setActiveScenario(scenario);
    setAnimationPhase(0);
    setTimeout(() => {
      drawChart(canvasLeftRef.current, scenario.priya, scenario.id, true);
      drawChart(canvasRightRef.current, scenario.ramesh, scenario.id, false);
    }, 50);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">Same Event. Opposite Scores.</h1>
        <p className="text-xl text-neutral-500">
          See how Sentinel responds differently to the same action by two different employees
        </p>
      </div>

      {/* Scenario Selector */}
      <div className="flex justify-center">
        <div className="inline-flex bg-neutral-100 rounded-xl p-1">
          {SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => handleScenarioChange(scenario)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeScenario.id === scenario.id
                  ? 'bg-white text-primary shadow-md'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {scenario.name}
            </button>
          ))}
        </div>
      </div>

      {/* Trigger Button */}
      <div className="flex justify-center">
        <button
          onClick={triggerAnimation}
          disabled={isAnimating}
          className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
            isAnimating
              ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-xl hover:scale-105'
          }`}
        >
          {isAnimating ? (
            <span className="flex items-center gap-3">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span>⚡</span>
              Trigger Access Attempt
            </span>
          )}
        </button>
      </div>

      {/* Event Label */}
      {animationPhase >= 1 && (
        <div className="text-center animate-fadeIn">
          <div className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-full">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="font-mono">{activeScenario.eventTime}</span>
            <span className="text-neutral-400">—</span>
            <span>{activeScenario.eventLabel}</span>
          </div>
        </div>
      )}

      {/* Two Column Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: Priya Sharma */}
        <div className={`transition-all duration-500 ${chartsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Card className="border-2 border-green-200">
            {/* Profile */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👩‍💼</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neutral-900">Priya Sharma</h3>
                  <p className="text-neutral-500">Credit Manager • Mumbai HQ</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-400">Risk Score</p>
                <p className="text-3xl font-bold text-green-600">12</p>
              </div>
            </div>

            {/* Chart */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-neutral-500 mb-2">90-Day Access Pattern</h4>
              <div className="bg-neutral-50 rounded-xl p-2">
                <canvas
                  ref={canvasLeftRef}
                  width={400}
                  height={200}
                  className="w-full"
                />
              </div>
              <div className="flex items-center justify-center gap-4 mt-2 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-green-500/30" />
                  Normal Range
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-600" />
                  Access Event
                </span>
              </div>
            </div>

            {/* Anomaly Score */}
            <div className={`mb-6 transition-all duration-500 ${animationPhase >= 2 ? 'opacity-100' : 'opacity-30'}`}>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Anomaly Score</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-3 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-1000"
                      style={{ width: animationPhase >= 2 ? `${activeScenario.priya.anomalyScore}%` : '0%' }}
                    />
                  </div>
                  <span className="text-2xl font-bold text-green-600">{activeScenario.priya.anomalyScore}</span>
                </div>
              </div>
              <Badge variant="success" className="mt-2">Within normal pattern</Badge>
            </div>

            {/* Outcome */}
            <div className={`transition-all duration-500 ${animationPhase >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="bg-green-600 text-white p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">✓</span>
                  <span className="text-xl font-bold">Auto Approved</span>
                </div>
                <p className="text-green-100">{activeScenario.priya.explanation}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT: Ramesh Kumar */}
        <div className={`transition-all duration-500 delay-150 ${chartsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Card className="border-2 border-red-200">
            {/* Profile */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👨‍💼</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neutral-900">Ramesh Kumar</h3>
                  <p className="text-neutral-500">Loans Officer • Mumbai Central</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-400">Risk Score</p>
                <p className="text-3xl font-bold text-red-600">87</p>
              </div>
            </div>

            {/* Chart */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-neutral-500 mb-2">90-Day Access Pattern</h4>
              <div className="bg-neutral-50 rounded-xl p-2">
                <canvas
                  ref={canvasRightRef}
                  width={400}
                  height={200}
                  className="w-full"
                />
              </div>
              <div className="flex items-center justify-center gap-4 mt-2 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-red-500/30" />
                  Normal Range
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-600" />
                  Access Event
                </span>
              </div>
            </div>

            {/* Anomaly Score */}
            <div className={`mb-6 transition-all duration-500 ${animationPhase >= 2 ? 'opacity-100' : 'opacity-30'}`}>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Anomaly Score</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-3 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 transition-all duration-1000"
                      style={{ width: animationPhase >= 2 ? `${activeScenario.ramesh.anomalyScore}%` : '0%' }}
                    />
                  </div>
                  <span className="text-2xl font-bold text-red-600">{activeScenario.ramesh.anomalyScore}</span>
                </div>
              </div>
              <Badge variant="danger" className="mt-2">Significant deviation detected</Badge>
            </div>

            {/* Outcome */}
            <div className={`transition-all duration-500 ${animationPhase >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="bg-red-600 text-white p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🚫</span>
                  <span className="text-xl font-bold">Access Blocked — Ticket Required</span>
                </div>
                <p className="text-red-100">{activeScenario.ramesh.explanation}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Explanation Box */}
      <Card className={`bg-gradient-to-r from-primary/5 to-accent/5 border-2 border-primary/20 transition-all duration-500 ${animationPhase >= 3 ? 'opacity-100' : 'opacity-50'}`}>
        <div className="text-center max-w-4xl mx-auto py-4">
          <p className="text-lg text-neutral-700 leading-relaxed">
            <span className="font-bold text-primary">Both employees attempted access at {activeScenario.eventTime} tonight.</span>
            {' '}Sentinel did not apply a single company-wide rule. It compared each person against their own 90-day history.
            {' '}<span className="font-bold">The same event received opposite responses because normal is personal — not universal.</span>
          </p>
        </div>
      </Card>

      {/* Reset Button */}
      {animationPhase > 0 && (
        <div className="flex justify-center">
          <button
            onClick={resetAnimation}
            className="text-neutral-500 hover:text-neutral-700 underline"
          >
            Reset Demo
          </button>
        </div>
      )}

      {/* Animation CSS */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      `}</style>
    </div>
  );
}
