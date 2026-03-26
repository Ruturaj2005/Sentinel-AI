import { useState, useEffect, useRef } from 'react';
import { dashboardService } from '../../services';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import { formatRelativeTime } from '../../utils/formatters';

// System definitions with baseline info for Ramesh Kumar (Loans Officer)
const SYSTEMS = [
  { id: 'core_banking', name: 'Core Banking', subtitle: 'CBS Finacle', icon: '🏦', baseline: true },
  { id: 'customer_db', name: 'Customer Database', subtitle: 'CRM Portal', icon: '👥', baseline: true },
  { id: 'loan_origination', name: 'Loan Origination', subtitle: 'LOS System', icon: '📋', baseline: true },
  { id: 'treasury', name: 'Treasury Platform', subtitle: 'Treasury Ops', icon: '💰', baseline: false },
  { id: 'file_server', name: 'File Server', subtitle: 'Document Store', icon: '📁', baseline: true },
  { id: 'hr_system', name: 'HR System', subtitle: 'HRMS Portal', icon: '👤', baseline: false }
];

// Analysis checks
const CHECKS = [
  { id: 'nlp', name: 'NLP Reason Score', type: 'score' },
  { id: 'response_time', name: 'Response Time', type: 'time' },
  { id: 'role_match', name: 'Role Match', type: 'pass_fail' },
  { id: 'calendar', name: 'Calendar Check', type: 'pass_fail' },
  { id: 'volume', name: 'Volume Check', type: 'pass_fail' }
];

export default function EmployeeDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Block flow state
  const [blockFlow, setBlockFlow] = useState({
    active: false,
    system: null,
    step: 0, // 0=none, 1=block, 2=analyzing, 3=verdict
    explanation: '',
    timer: 0,
    checkResults: [],
    animatingScore: 0,
    finalScore: null,
    routing: null
  });

  const timerRef = useRef(null);
  const scoreAnimRef = useRef(null);

  useEffect(() => {
    loadDashboard();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (scoreAnimRef.current) clearInterval(scoreAnimRef.current);
    };
  }, []);

  // Timer effect - counts up while on block screen
  useEffect(() => {
    if (blockFlow.step === 1) {
      timerRef.current = setInterval(() => {
        setBlockFlow(prev => ({ ...prev, timer: prev.timer + 1 }));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [blockFlow.step]);

  const loadDashboard = async () => {
    try {
      const result = await dashboardService.getEmployeeDashboard();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSystemClick = (system) => {
    if (system.baseline) {
      // Within baseline - grant access with toast
      setToast({ type: 'success', system: system.name });
      setTimeout(() => setToast(null), 3000);
    } else {
      // Outside baseline - trigger block flow
      setBlockFlow({
        active: true,
        system,
        step: 1,
        explanation: '',
        timer: 0,
        checkResults: [],
        animatingScore: 0,
        finalScore: null,
        routing: null
      });
    }
  };

  const handleSubmitExplanation = async () => {
    const responseTime = blockFlow.timer;
    const explanationLength = blockFlow.explanation.length;
    const systemId = blockFlow.system.id;

    // Move to analyzing step
    setBlockFlow(prev => ({ ...prev, step: 2, checkResults: [] }));

    // Generate check results
    const results = [];

    // Check 1: NLP Score
    await new Promise(r => setTimeout(r, 600));
    const nlpScore = Math.min(10, Math.round((explanationLength / 150) * 10));
    results.push({
      id: 'nlp',
      name: 'NLP Reason Score',
      score: nlpScore,
      maxScore: 10,
      status: nlpScore >= 7 ? 'pass' : nlpScore >= 4 ? 'warning' : 'fail',
      detail: nlpScore >= 7 ? 'Explanation appears genuine and detailed' :
              nlpScore >= 4 ? 'Explanation lacks specific details' :
              'Explanation too brief or generic'
    });
    setBlockFlow(prev => ({ ...prev, checkResults: [...results] }));

    // Check 2: Response Time
    await new Promise(r => setTimeout(r, 600));
    const timeStatus = responseTime < 15 ? 'fail' : responseTime < 60 ? 'warning' : 'pass';
    results.push({
      id: 'response_time',
      name: 'Response Time',
      time: responseTime,
      status: timeStatus,
      detail: responseTime < 15
        ? `Responded in ${responseTime} seconds — typical of prepared excuse`
        : responseTime < 60
        ? `Responded in ${responseTime} seconds — moderately quick`
        : `Responded in ${Math.floor(responseTime / 60)}m ${responseTime % 60}s — typical of genuine need`
    });
    setBlockFlow(prev => ({ ...prev, checkResults: [...results] }));

    // Check 3: Role Match
    await new Promise(r => setTimeout(r, 600));
    const roleMatch = systemId !== 'treasury';
    results.push({
      id: 'role_match',
      name: 'Role Match',
      passed: roleMatch,
      status: roleMatch ? 'pass' : 'fail',
      detail: roleMatch
        ? 'Access aligns with Loans Officer responsibilities'
        : 'Treasury access not typical for Loans department'
    });
    setBlockFlow(prev => ({ ...prev, checkResults: [...results] }));

    // Check 4: Calendar Check
    await new Promise(r => setTimeout(r, 600));
    const calendarPass = Math.random() > 0.4;
    results.push({
      id: 'calendar',
      name: 'Calendar Check',
      passed: calendarPass,
      status: calendarPass ? 'pass' : 'fail',
      detail: calendarPass
        ? 'Request aligns with scheduled work activities'
        : 'No related meetings or tasks found in calendar'
    });
    setBlockFlow(prev => ({ ...prev, checkResults: [...results] }));

    // Check 5: Volume Check
    await new Promise(r => setTimeout(r, 600));
    const volumePass = Math.random() > 0.3;
    results.push({
      id: 'volume',
      name: 'Volume Check',
      passed: volumePass,
      status: volumePass ? 'pass' : 'warning',
      detail: volumePass
        ? 'Access volume within normal parameters'
        : 'Higher than usual access frequency detected'
    });
    setBlockFlow(prev => ({ ...prev, checkResults: [...results] }));

    // Calculate final score
    await new Promise(r => setTimeout(r, 800));

    let score = 50; // Base
    score += results[0].score * 3; // NLP (0-30)
    score += results[1].status === 'pass' ? 20 : results[1].status === 'warning' ? 10 : 0;
    score += results[2].passed ? 15 : -20;
    score += results[3].passed ? 10 : -10;
    score += results[4].passed ? 10 : 0;
    score = Math.max(0, Math.min(100, score));

    // Animate score climbing
    setBlockFlow(prev => ({ ...prev, step: 3, finalScore: score }));

    let currentScore = 0;
    scoreAnimRef.current = setInterval(() => {
      currentScore += 2;
      if (currentScore >= score) {
        currentScore = score;
        clearInterval(scoreAnimRef.current);

        // Determine routing after score animation
        setTimeout(() => {
          let routing;
          if (score >= 70) {
            routing = { type: 'approved', label: 'Auto Approved — Access Granted', color: 'green' };
          } else if (score >= 40) {
            routing = { type: 'manager', label: 'Sent to your manager for review', color: 'yellow' };
          } else {
            routing = { type: 'cvu', label: 'Escalated to Central Vigilance Unit — A CVU officer will contact you', color: 'red' };
          }
          setBlockFlow(prev => ({ ...prev, routing }));
        }, 500);
      }
      setBlockFlow(prev => ({ ...prev, animatingScore: currentScore }));
    }, 30);
  };

  const closeBlockFlow = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (scoreAnimRef.current) clearInterval(scoreAnimRef.current);
    setBlockFlow({
      active: false, system: null, step: 0, explanation: '',
      timer: 0, checkResults: [], animatingScore: 0, finalScore: null, routing: null
    });
  };

  const formatTimer = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (loading) return <Loader text="Loading dashboard..." />;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!data?.employee) return <div className="p-6">No data available</div>;

  const healthScore = 100 - (data.employee.currentRiskScore || 0);
  const healthColor = healthScore >= 80 ? '#1D9E75' : healthScore >= 60 ? '#BA7517' : '#E24B4A';

  return (
    <div className="space-y-6">
      {/* Success Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-slideIn">
          <div className="bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">✓</span>
            </div>
            <div>
              <p className="font-bold">Access Granted</p>
              <p className="text-sm text-green-100">{toast.system} — logged</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary">Welcome, {data.employee.name}</h1>
        <p className="text-neutral-500 mt-1">
          {data.employee.role || 'Staff'} • {data.employee.department} • {data.employee.branch}
        </p>
      </div>

      {/* Top Section: Health Score + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Access Health Score */}
        <Card className="text-center">
          <h3 className="text-sm font-medium text-neutral-500 mb-6">Access Health Score</h3>
          <div className="relative w-36 h-36 mx-auto mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#E5E7EB" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={healthColor} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${healthScore * 2.64} 264`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold" style={{ color: healthColor }}>{healthScore}</span>
              <span className="text-xs text-neutral-400">/100</span>
            </div>
          </div>
          <Badge variant={healthScore >= 80 ? 'success' : healthScore >= 60 ? 'warning' : 'danger'}>
            {healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'Needs Attention'}
          </Badge>
        </Card>

        {/* Recent Access Timeline */}
        <Card className="lg:col-span-2">
          <h3 className="text-sm font-medium text-neutral-500 mb-4">Recent Access Timeline</h3>
          <div className="space-y-3">
            {(data.recentEvents || []).slice(0, 5).map((event, idx) => (
              <div key={event._id || idx} className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                <div className="flex-1 flex items-center justify-between py-2 border-b border-neutral-100">
                  <div>
                    <span className="font-medium text-neutral-800">{event.system}</span>
                    <span className="text-neutral-400 mx-2">•</span>
                    <span className="text-neutral-500 text-sm">{event.action}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${
                      event.anomalyScore > 70 ? 'text-red-600' :
                      event.anomalyScore > 40 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {event.anomalyScore}
                    </span>
                    <span className="text-xs text-neutral-400">{formatRelativeTime(event.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* System Access Panel */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">System Access</h2>
            <p className="text-sm text-neutral-500">Select a system to request access</p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
              Within baseline
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
              Outside baseline
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {SYSTEMS.map((system) => (
            <button
              key={system.id}
              onClick={() => handleSystemClick(system)}
              className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl text-left ${
                system.baseline
                  ? 'border-green-200 bg-gradient-to-br from-green-50 to-white hover:border-green-400 hover:shadow-green-100'
                  : 'border-amber-200 bg-gradient-to-br from-amber-50 to-white hover:border-amber-400 hover:shadow-amber-100'
              }`}
            >
              {/* Status dot */}
              <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${
                system.baseline ? 'bg-green-500 shadow-sm shadow-green-500/50' : 'bg-amber-500 shadow-sm shadow-amber-500/50'
              }`} />

              <span className="text-4xl block mb-3 group-hover:scale-110 transition-transform">{system.icon}</span>
              <h3 className="font-bold text-neutral-900 text-sm leading-tight">{system.name}</h3>
              <p className="text-xs text-neutral-500 mt-1">{system.subtitle}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Block Flow Modal */}
      {blockFlow.active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fadeIn"
            onClick={blockFlow.step === 3 && blockFlow.routing ? closeBlockFlow : undefined}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp">

            {/* STEP 1: Block Screen */}
            {blockFlow.step === 1 && (
              <div className="p-8">
                {/* Red Lock Icon */}
                <div className="text-center mb-8">
                  <div className="w-28 h-28 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <span className="text-6xl">🔒</span>
                  </div>
                  <h2 className="text-3xl font-bold text-red-600 mb-2">Access Blocked</h2>
                  <p className="text-neutral-600 max-w-md mx-auto">
                    This request to <span className="font-bold">{blockFlow.system.name}</span> falls outside your normal access pattern
                  </p>
                </div>

                {/* Timer - watching feeling */}
                <div className="text-center mb-8">
                  <p className="text-xs text-neutral-400 uppercase tracking-wider mb-2">Response Time</p>
                  <div className="inline-flex items-center gap-3 bg-neutral-900 text-white px-6 py-3 rounded-full">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="font-mono text-3xl font-bold tracking-wider">
                      {formatTimer(blockFlow.timer)}
                    </span>
                  </div>
                </div>

                {/* Explanation Input */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-neutral-700 mb-3">
                    Please explain why you need access:
                  </label>
                  <textarea
                    value={blockFlow.explanation}
                    onChange={(e) => setBlockFlow(prev => ({ ...prev, explanation: e.target.value }))}
                    className="w-full h-36 p-4 border-2 border-neutral-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none text-lg transition-all"
                    placeholder="Provide a detailed explanation for this access request..."
                    autoFocus
                  />
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-neutral-400">Be specific and detailed for better approval chances</span>
                    <span className={blockFlow.explanation.length < 20 ? 'text-red-500' : 'text-green-600'}>
                      {blockFlow.explanation.length} characters
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <Button variant="secondary" className="flex-1 py-4" onClick={closeBlockFlow}>
                    Cancel Request
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1 py-4 text-lg"
                    onClick={handleSubmitExplanation}
                    disabled={blockFlow.explanation.length < 10}
                  >
                    Submit for Analysis
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: Analyzing */}
            {blockFlow.step === 2 && (
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-6">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900 mb-2">Analyzing Your Request</h2>
                  <p className="text-neutral-500">Running security verification checks...</p>
                </div>

                {/* Progress */}
                <div className="mb-8">
                  <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-primary transition-all duration-500 ease-out"
                      style={{ width: `${(blockFlow.checkResults.length / CHECKS.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Check Results */}
                <div className="space-y-4">
                  {CHECKS.map((check, idx) => {
                    const result = blockFlow.checkResults.find(r => r.id === check.id);
                    const isRevealed = !!result;

                    return (
                      <div
                        key={check.id}
                        className={`p-4 rounded-xl border-2 transition-all duration-500 ${
                          !isRevealed ? 'border-neutral-200 bg-neutral-50 opacity-40' :
                          result.status === 'pass' ? 'border-green-300 bg-green-50' :
                          result.status === 'warning' ? 'border-yellow-300 bg-yellow-50' :
                          'border-red-300 bg-red-50'
                        }`}
                        style={{
                          transform: isRevealed ? 'translateX(0)' : 'translateX(-20px)',
                          opacity: isRevealed ? 1 : 0.4
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {!isRevealed ? '⏳' :
                               result.status === 'pass' ? '✅' :
                               result.status === 'warning' ? '⚠️' : '❌'}
                            </span>
                            <div>
                              <p className="font-bold text-neutral-900">{check.name}</p>
                              {isRevealed && (
                                <p className={`text-sm mt-1 ${
                                  result.status === 'pass' ? 'text-green-700' :
                                  result.status === 'warning' ? 'text-yellow-700' : 'text-red-700'
                                }`}>
                                  {result.detail}
                                </p>
                              )}
                            </div>
                          </div>
                          {isRevealed && result.score !== undefined && (
                            <div className="text-right">
                              <span className={`text-2xl font-bold ${
                                result.status === 'pass' ? 'text-green-600' :
                                result.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {result.score}/{result.maxScore}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: Verdict */}
            {blockFlow.step === 3 && (
              <div className="p-8">
                {/* Animated Score */}
                <div className="text-center mb-8">
                  <p className="text-sm text-neutral-400 uppercase tracking-wider mb-4">Composite Risk Assessment</p>
                  <div className={`w-40 h-40 mx-auto rounded-full flex items-center justify-center mb-6 transition-colors duration-500 ${
                    blockFlow.animatingScore >= 70 ? 'bg-green-100' :
                    blockFlow.animatingScore >= 40 ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    <span className={`text-6xl font-bold transition-colors duration-300 ${
                      blockFlow.animatingScore >= 70 ? 'text-green-600' :
                      blockFlow.animatingScore >= 40 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {blockFlow.animatingScore}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900">Analysis Complete</h2>
                </div>

                {/* Routing Decision Banner */}
                {blockFlow.routing && (
                  <div className={`p-6 rounded-2xl text-center mb-8 animate-slideUp ${
                    blockFlow.routing.color === 'green' ? 'bg-green-600' :
                    blockFlow.routing.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-600'
                  }`}>
                    <span className="text-4xl block mb-3">
                      {blockFlow.routing.color === 'green' ? '✓' :
                       blockFlow.routing.color === 'yellow' ? '👤' : '🚨'}
                    </span>
                    <p className="text-xl font-bold text-white leading-relaxed">
                      {blockFlow.routing.label}
                    </p>
                  </div>
                )}

                {/* Summary */}
                <div className="grid grid-cols-5 gap-2 mb-8">
                  {blockFlow.checkResults.map((check) => (
                    <div key={check.id} className={`text-center p-3 rounded-lg ${
                      check.status === 'pass' ? 'bg-green-50' :
                      check.status === 'warning' ? 'bg-yellow-50' : 'bg-red-50'
                    }`}>
                      <p className="text-lg">
                        {check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : '❌'}
                      </p>
                      <p className="text-xs text-neutral-600 mt-1">{check.name.split(' ')[0]}</p>
                    </div>
                  ))}
                </div>

                {blockFlow.routing && (
                  <Button variant="primary" className="w-full py-4 text-lg" onClick={closeBlockFlow}>
                    Return to Dashboard
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Animations CSS */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slideIn { animation: slideIn 0.4s ease-out; }
        .animate-slideUp { animation: slideUp 0.4s ease-out; }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}
