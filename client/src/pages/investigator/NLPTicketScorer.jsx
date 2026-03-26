import { useState, useEffect, useCallback, useRef } from 'react';
import Card from '../../components/common/Card';

// Example reasons with expected RISK scores (0-100, higher = worse)
const EXAMPLES = [
  {
    riskScore: 90,
    responseTime: 14,
    label: 'CVU Escalation',
    routing: 'red',
    text: 'urgent work'
  },
  {
    riskScore: 55,
    responseTime: 45,
    label: 'Manager Review',
    routing: 'amber',
    text: 'need customer data for report'
  },
  {
    riskScore: 40,
    responseTime: 90,
    label: 'Manager Review',
    routing: 'amber',
    text: 'quarterly audit preparation for RBI inspection next week'
  },
  {
    riskScore: 18,
    responseTime: 240,
    label: 'Auto Approved',
    routing: 'green',
    text: 'Need loan closure data for ref LN-2024-887 for RBI submission deadline tomorrow authorized by RM Sharma'
  }
];

const DEFAULT_STATE = {
  nlp: {
    overall_score: 0,
    specificity: 0,
    urgency_validity: 0,
    role_relevance: 0,
    completeness: 0,
    red_flag_language: 10,
    verdict: 'Enter a reason to analyze',
    explanation: '',
    suspicious_signals: [],
    positive_signals: []
  },
  risk: {
    composite: 0,
    breakdown: {
      nlp_risk: 0,
      time_risk: 0,
      role_penalty: 0,
      calendar_penalty: 0,
      volume_penalty: 0
    }
  },
  routing: {
    decision: 'pending',
    label: 'Waiting for input...',
    color: 'gray'
  },
  metadata: {
    response_time_seconds: 120,
    reason_length: 0,
    reason_words: 0
  }
};

// Risk level colors - exact hex codes as specified
const RISK_COLORS = {
  green: { bg: '#EAF3DE', text: '#1D9E75', border: '#1D9E75' },
  amber: { bg: '#FAEEDA', text: '#BA7517', border: '#BA7517' },
  red: { bg: '#FCEBEB', text: '#E24B4A', border: '#E24B4A' },
  gray: { bg: '#F3F4F6', text: '#6B7280', border: '#9CA3AF' }
};

export default function NLPTicketScorer() {
  const [reason, setReason] = useState('');
  const [responseTime, setResponseTime] = useState(120); // Default 2 minutes
  const [result, setResult] = useState(DEFAULT_STATE);
  const [loading, setLoading] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);
  const startTimeRef = useRef(null);

  // Start timer when user starts typing
  useEffect(() => {
    if (reason.length === 1 && !startTimeRef.current) {
      startTimeRef.current = Date.now();
    }
    if (reason.length === 0) {
      startTimeRef.current = null;
    }
  }, [reason]);

  // Debounced scoring
  useEffect(() => {
    if (!reason.trim()) {
      setResult(DEFAULT_STATE);
      setAnimatedScore(0);
      return;
    }

    const timer = setTimeout(() => {
      // Calculate actual response time from when typing started
      const actualTime = startTimeRef.current
        ? Math.round((Date.now() - startTimeRef.current) / 1000)
        : responseTime;

      // Only analyze if we have meaningful text
      if (reason.trim().length > 0) {
        analyzeReason(reason, actualTime);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [reason, responseTime]); // eslint-disable-line react-hooks/exhaustive-deps

  // Animate score changes
  useEffect(() => {
    const target = result.risk.composite;

    if (animatedScore === target) {
      return;
    }

    const diff = target - animatedScore;
    const step = Math.sign(diff) * Math.min(Math.abs(diff), 5);

    if (Math.abs(diff) < 2) {
      setAnimatedScore(target);
      return;
    }

    const timer = setTimeout(() => {
      setAnimatedScore(prev => {
        const newVal = prev + step;
        // Prevent overshooting
        return Math.sign(diff) > 0
          ? Math.min(newVal, target)
          : Math.max(newVal, target);
      });
    }, 30);

    return () => clearTimeout(timer);
  }, [result.risk.composite, animatedScore]);

  const analyzeReason = async (text, time) => {
    setLoading(true);
    try {
      const response = await fetch('/api/tools/analyze-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason: text, responseTime: time })
      });

      if (!response.ok) {
        console.warn('API analysis failed, using local scoring');
        setResult(calculateLocalScore(text, time));
        setLoading(false);
        return;
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Analysis error:', error);
      // Fallback to local scoring if API fails
      setResult(calculateLocalScore(text, time));
    } finally {
      setLoading(false);
    }
  };

  // Fallback local scoring algorithm (matches backend logic)
  const calculateLocalScore = useCallback((text, responseTimeSeconds) => {
    const words = text.toLowerCase().split(/\s+/);
    const length = text.length;
    const wordCount = words.length;

    // Very short or vague
    if (wordCount < 3 || length < 15) {
      const nlp = {
        overall_score: 1,
        specificity: 1,
        urgency_validity: 1,
        role_relevance: 1,
        completeness: 1,
        red_flag_language: 1,
        verdict: 'High suspicion — extremely vague, no verifiable details',
        explanation: 'Reason is too short and lacks any specific details or context',
        suspicious_signals: ['extremely short text', 'no verifiable details', 'vague language'],
        positive_signals: []
      };
      return buildResult(nlp, responseTimeSeconds, text);
    }

    // Specificity
    const hasReference = /\b(ref|reference|id|number|#|ln-|aud-|txn-|acc-)\d+/i.test(text);
    const hasSpecificDate = /\b(tomorrow|monday|tuesday|wednesday|thursday|friday|\d{1,2}\/\d{1,2})/i.test(text);
    const hasSpecificName = /\b(mr\.|mrs\.|ms\.|sharma|kumar|singh|authorized by)\s+\w+/i.test(text);
    let specificity = 0;
    if (hasReference) specificity += 4;
    if (hasSpecificDate) specificity += 3;
    if (hasSpecificName) specificity += 2;
    specificity = Math.min(10, specificity);

    // Urgency validity
    const hasUrgentKeyword = /\b(urgent|asap|immediately|emergency)\b/i.test(text);
    const hasJustification = /\b(rbi|audit|compliance|regulatory|deadline)\b/i.test(text);
    const urgency_validity = hasUrgentKeyword && !hasJustification ? 2 : hasJustification ? 7 : 5;

    // Role relevance
    const bankingTerms = ['loan', 'account', 'customer', 'transaction', 'audit', 'rbi', 'treasury', 'credit', 'compliance'];
    const matchCount = bankingTerms.filter(term => new RegExp(`\\b${term}\\b`, 'i').test(text)).length;
    const role_relevance = Math.min(10, matchCount * 2.5);

    // Completeness
    const hasWho = hasSpecificName || /\b(i|we|my|team|department)\b/i.test(text);
    const hasWhat = /\b(data|file|record|report|information)\b/i.test(text);
    const hasWhy = /\b(for|to|because|due|need)\b/i.test(text);
    const hasWhen = hasSpecificDate || /\b(today|tomorrow|deadline)\b/i.test(text);
    const completeness = (hasWho ? 2.5 : 0) + (hasWhat ? 2.5 : 0) + (hasWhy ? 2.5 : 0) + (hasWhen ? 2.5 : 0);

    // Red flags
    const redFlags = ['just', 'only', 'quick', 'simple', 'usual', 'routine', 'urgent', 'asap'];
    const flagCount = redFlags.filter(flag => text.toLowerCase().includes(flag)).length;
    const red_flag_language = Math.max(1, 10 - (flagCount * 2));

    // Overall
    const overall = (specificity * 0.3 + urgency_validity * 0.15 + role_relevance * 0.25 + completeness * 0.2 + red_flag_language * 0.1);
    const overall_score = Math.round(Math.min(10, Math.max(0, overall)) * 10) / 10;

    let verdict;
    if (overall_score <= 3) verdict = 'High suspicion — extremely vague, no verifiable details';
    else if (overall_score <= 6) verdict = 'Moderate — some detail but insufficient for high-risk access';
    else verdict = 'Legitimate — specific, verifiable, contextually appropriate';

    // Generate explanation and signals
    const suspicious_signals = [];
    const positive_signals = [];

    if (specificity < 4) suspicious_signals.push('lacks specific references');
    if (specificity >= 7) positive_signals.push('includes specific references');

    if (hasUrgentKeyword && !hasJustification) suspicious_signals.push('urgent claim without justification');
    if (hasJustification) positive_signals.push('includes verifiable justification');

    if (role_relevance < 3) suspicious_signals.push('weak role relevance');
    if (role_relevance >= 7) positive_signals.push('strong banking context');

    if (completeness < 4) suspicious_signals.push('incomplete information (missing who/what/why/when)');
    if (completeness >= 8) positive_signals.push('comprehensive details provided');

    if (flagCount > 2) suspicious_signals.push(`high red flag language count (${flagCount} terms)`);
    if (flagCount === 0) positive_signals.push('no suspicious language patterns');

    let explanation;
    if (overall_score <= 3) {
      explanation = 'Reason lacks verifiable details and contains vague language that cannot be independently validated';
    } else if (overall_score <= 6) {
      explanation = 'Reason provides some context but missing critical details needed for verification';
    } else {
      explanation = 'Reason contains sufficient specific, verifiable information appropriate for the access request';
    }

    const nlp = {
      overall_score,
      specificity: Math.round(specificity * 10) / 10,
      urgency_validity: Math.round(urgency_validity * 10) / 10,
      role_relevance: Math.round(role_relevance * 10) / 10,
      completeness: Math.round(completeness * 10) / 10,
      red_flag_language: Math.round(red_flag_language * 10) / 10,
      verdict,
      explanation,
      suspicious_signals,
      positive_signals
    };

    return buildResult(nlp, responseTimeSeconds, text);
  }, []);

  // Build full result object from NLP scores
  const buildResult = (nlp, responseTimeSeconds, reason) => {
    const nlp_risk = (10 - nlp.overall_score) * 10;

    let time_risk;
    if (responseTimeSeconds < 30) time_risk = 95;
    else if (responseTimeSeconds < 60) time_risk = 80;
    else if (responseTimeSeconds < 120) time_risk = 60;
    else if (responseTimeSeconds < 300) time_risk = 30;
    else time_risk = 10;

    const role_penalty = (nlp.specificity < 4 && nlp.role_relevance < 5) ? 20 : 0;
    const calendar_penalty = nlp.urgency_validity < 4 ? 15 : 0;
    const volume_penalty = nlp.completeness < 4 ? 20 : 0;

    const composite = Math.min(100, Math.max(0, Math.round(
      (nlp_risk * 0.40) + (time_risk * 0.30) + role_penalty + calendar_penalty + volume_penalty
    )));

    let routing;
    if (composite <= 30) {
      routing = { decision: 'auto_approved', label: 'Auto Approved — Access Granted', color: 'green' };
    } else if (composite <= 65) {
      routing = { decision: 'manager_review', label: 'Sent to Manager for Review', color: 'amber' };
    } else {
      routing = { decision: 'cvu_escalation', label: 'Escalated to Central Vigilance Unit', color: 'red' };
    }

    return {
      nlp,
      risk: {
        composite,
        breakdown: {
          nlp_risk: Math.round(nlp_risk),
          time_risk,
          role_penalty,
          calendar_penalty,
          volume_penalty
        }
      },
      routing,
      metadata: {
        response_time_seconds: responseTimeSeconds,
        reason_length: reason.length,
        reason_words: reason.split(/\s+/).length
      }
    };
  };

  const handleExampleClick = (example) => {
    setReason(example.text);
    setResponseTime(example.responseTime);
    startTimeRef.current = Date.now() - (example.responseTime * 1000);
  };

  const getRiskColors = () => {
    return RISK_COLORS[result.routing.color] || RISK_COLORS.gray;
  };

  const getCheckStatus = (score, passingThreshold) => {
    return score >= passingThreshold;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary">NLP Ticket Scorer</h1>
        <p className="text-neutral-500 mt-1">AI-powered ticket reason analysis with risk scoring</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT SIDE - Input and Scoring */}
        <div className="space-y-6">
          <Card>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">Ticket Reason Analyzer</h2>
            <p className="text-neutral-500 mb-6">
              Type any ticket reason to see how Sentinel calculates risk score in real time
            </p>

            {/* Textarea */}
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Type the employee's reason for access here..."
              className="w-full h-40 p-4 border-2 border-neutral-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none text-lg transition-all"
            />
            <div className="flex justify-between text-sm text-neutral-400 mt-2">
              <span>{reason.length} characters</span>
              <span>Response time: {result.metadata.response_time_seconds}s</span>
            </div>

            {/* Manual Response Time Override */}
            <div className="mt-4">
              <label className="text-sm font-medium text-neutral-600">Simulate Response Time (seconds)</label>
              <input
                type="range"
                min="5"
                max="600"
                value={responseTime}
                onChange={(e) => setResponseTime(parseInt(e.target.value))}
                className="w-full mt-2"
              />
              <div className="flex justify-between text-xs text-neutral-400">
                <span>5s (suspicious)</span>
                <span className="font-medium">{responseTime}s</span>
                <span>10min (normal)</span>
              </div>
            </div>
          </Card>

          {/* Main Risk Score Display */}
          <Card>
            <div className="text-center mb-6">
              <p className="text-sm text-neutral-400 uppercase tracking-wider mb-2">Composite Risk Score</p>
              <div className="relative inline-block">
                {/* Large Circle with Risk Score */}
                <div
                  className="w-48 h-48 rounded-full flex items-center justify-center mx-auto transition-all duration-500"
                  style={{
                    backgroundColor: getRiskColors().bg,
                    border: `4px solid ${getRiskColors().border}`
                  }}
                >
                  <div className="text-center">
                    <span
                      className="text-7xl font-bold transition-colors duration-300"
                      style={{ color: getRiskColors().text }}
                    >
                      {animatedScore}
                    </span>
                    <span className="text-2xl" style={{ color: getRiskColors().text }}>/100</span>
                  </div>
                </div>
                {loading && (
                  <div className="absolute -right-4 top-1/2 -translate-y-1/2">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <p className="text-sm text-neutral-500 mt-4">
                Higher score = More suspicious
              </p>
            </div>

            {/* Routing Decision Banner */}
            <div
              className="rounded-xl p-4 text-center mb-6 transition-all duration-500"
              style={{
                backgroundColor: getRiskColors().bg,
                border: `2px solid ${getRiskColors().border}`
              }}
            >
              <p
                className="text-lg font-bold"
                style={{ color: getRiskColors().text }}
              >
                {result.routing.label}
              </p>
            </div>

            {/* AI Analysis Explanation */}
            {result.nlp.explanation && (
              <div className="mb-6 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                <h3 className="font-bold text-neutral-700 text-sm uppercase tracking-wide mb-2">AI Analysis</h3>
                <p className="text-sm text-neutral-600 mb-3">{result.nlp.explanation}</p>

                {(result.nlp.suspicious_signals.length > 0 || result.nlp.positive_signals.length > 0) && (
                  <div className="grid grid-cols-1 gap-2">
                    {result.nlp.suspicious_signals.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-xs font-bold text-red-700 mb-1">⚠ Suspicious Signals</p>
                        <ul className="space-y-1">
                          {result.nlp.suspicious_signals.map((signal, idx) => (
                            <li key={idx} className="text-xs text-red-600 flex items-start gap-1">
                              <span className="mt-0.5">•</span>
                              <span>{signal}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.nlp.positive_signals.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-xs font-bold text-green-700 mb-1">✓ Positive Signals</p>
                        <ul className="space-y-1">
                          {result.nlp.positive_signals.map((signal, idx) => (
                            <li key={idx} className="text-xs text-green-600 flex items-start gap-1">
                              <span className="mt-0.5">•</span>
                              <span>{signal}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Risk Breakdown */}
            <div className="space-y-3 mb-6">
              <h3 className="font-bold text-neutral-700 text-sm uppercase tracking-wide">Risk Breakdown</h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-neutral-100 rounded-lg p-3">
                  <p className="text-xs text-neutral-500">NLP Risk (40%)</p>
                  <p className="text-xl font-bold text-neutral-800">{result.risk.breakdown.nlp_risk}</p>
                </div>
                <div className="bg-neutral-100 rounded-lg p-3">
                  <p className="text-xs text-neutral-500">Time Risk (30%)</p>
                  <p className="text-xl font-bold text-neutral-800">{result.risk.breakdown.time_risk}</p>
                </div>
              </div>

              {/* Penalties */}
              <div className="flex gap-2 flex-wrap">
                {result.risk.breakdown.role_penalty > 0 && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    +{result.risk.breakdown.role_penalty} Role Mismatch
                  </span>
                )}
                {result.risk.breakdown.calendar_penalty > 0 && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    +{result.risk.breakdown.calendar_penalty} Calendar Fail
                  </span>
                )}
                {result.risk.breakdown.volume_penalty > 0 && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    +{result.risk.breakdown.volume_penalty} Volume Fail
                  </span>
                )}
                {result.risk.breakdown.role_penalty === 0 &&
                 result.risk.breakdown.calendar_penalty === 0 &&
                 result.risk.breakdown.volume_penalty === 0 && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    No Penalties Applied
                  </span>
                )}
              </div>
            </div>

            {/* Check Results */}
            <div className="border-t border-neutral-200 pt-4">
              <h3 className="font-bold text-neutral-700 text-sm uppercase tracking-wide mb-3">Security Checks</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: 'Role Match',
                    passed: !(result.nlp.specificity < 4 && result.nlp.role_relevance < 5)
                  },
                  {
                    label: 'Calendar',
                    passed: result.nlp.urgency_validity >= 4
                  },
                  {
                    label: 'Volume',
                    passed: result.nlp.completeness >= 4
                  }
                ].map((check, idx) => (
                  <div
                    key={idx}
                    className="text-center p-3 rounded-lg"
                    style={{
                      backgroundColor: check.passed ? '#EAF3DE' : '#FCEBEB'
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2"
                      style={{
                        backgroundColor: check.passed ? '#1D9E75' : '#E24B4A'
                      }}
                    >
                      {check.passed ? (
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <p
                      className="text-xs font-medium"
                      style={{ color: check.passed ? '#1D9E75' : '#E24B4A' }}
                    >
                      {check.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* NLP Sub-scores (collapsed by default) */}
          <Card>
            <details>
              <summary className="cursor-pointer font-bold text-neutral-700 mb-4">
                NLP Detail Scores (click to expand)
              </summary>
              <div className="space-y-3 mt-4">
                {[
                  { key: 'specificity', label: 'Specificity', desc: 'Names files, references, deadlines' },
                  { key: 'urgency_validity', label: 'Urgency Validity', desc: 'Claimed urgency is verifiable' },
                  { key: 'role_relevance', label: 'Role Relevance', desc: 'Matches banking work context' },
                  { key: 'completeness', label: 'Completeness', desc: 'Answers who, what, why, when' },
                  { key: 'red_flag_language', label: 'Red Flag Check', desc: 'Absence of suspicious terms' }
                ].map((item) => {
                  const score = result.nlp[item.key];
                  const color = score <= 3 ? '#E24B4A' : score <= 6 ? '#BA7517' : '#1D9E75';
                  return (
                    <div key={item.key}>
                      <div className="flex justify-between items-center mb-1">
                        <div>
                          <span className="font-medium text-neutral-700">{item.label}</span>
                          <span className="text-xs text-neutral-400 ml-2">{item.desc}</span>
                        </div>
                        <span className="font-bold" style={{ color }}>
                          {score}/10
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden bg-neutral-200">
                        <div
                          className="h-full transition-all duration-500 ease-out rounded-full"
                          style={{
                            width: `${(score / 10) * 100}%`,
                            backgroundColor: color
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
          </Card>
        </div>

        {/* RIGHT SIDE - Examples and Guide */}
        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Test Cases</h2>
            <p className="text-neutral-500 mb-6">
              Click any example to see risk calculation
            </p>

            <div className="space-y-4">
              {EXAMPLES.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => handleExampleClick(example)}
                  className="w-full text-left p-5 rounded-xl border-2 transition-all hover:scale-[1.02] hover:shadow-lg"
                  style={{
                    backgroundColor: RISK_COLORS[example.routing].bg,
                    borderColor: RISK_COLORS[example.routing].border
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-bold text-white"
                          style={{ backgroundColor: RISK_COLORS[example.routing].text }}
                        >
                          Risk: {example.riskScore}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {example.responseTime}s response
                        </span>
                        <span
                          className="text-sm font-medium"
                          style={{ color: RISK_COLORS[example.routing].text }}
                        >
                          {example.label}
                        </span>
                      </div>
                      <p className="text-neutral-700 italic">"{example.text}"</p>
                    </div>
                    <span className="text-2xl opacity-50">→</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Routing Thresholds */}
          <Card>
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Routing Thresholds</h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: RISK_COLORS.green.text }}
                >
                  0-30
                </div>
                <div>
                  <p className="font-medium" style={{ color: RISK_COLORS.green.text }}>Auto Approved</p>
                  <p className="text-sm text-neutral-500">Access granted automatically, no review needed</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: RISK_COLORS.amber.text }}
                >
                  31-65
                </div>
                <div>
                  <p className="font-medium" style={{ color: RISK_COLORS.amber.text }}>Manager Review</p>
                  <p className="text-sm text-neutral-500">Sent to manager for approval before granting</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: RISK_COLORS.red.text }}
                >
                  66-100
                </div>
                <div>
                  <p className="font-medium" style={{ color: RISK_COLORS.red.text }}>CVU Escalation</p>
                  <p className="text-sm text-neutral-500">Escalated to Central Vigilance Unit for investigation</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Risk Factors */}
          <Card>
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Risk Calculation Formula</h2>

            <div className="space-y-4 text-sm">
              <div className="bg-neutral-100 rounded-lg p-4 font-mono text-xs">
                composite = (nlp_risk × 0.40) + (time_risk × 0.30) + penalties
              </div>

              <div>
                <h3 className="font-bold text-neutral-700 mb-2">NLP Risk (40%)</h3>
                <p className="text-neutral-500">
                  Converts NLP legitimacy score (0-10) to risk (0-100):
                  <br />
                  <code className="bg-neutral-100 px-1 rounded">nlp_risk = (10 - nlp_score) × 10</code>
                </p>
              </div>

              <div>
                <h3 className="font-bold text-neutral-700 mb-2">Response Time Risk (30%)</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-red-600">&lt;30s → 95 risk</span>
                  <span className="text-red-500">&lt;60s → 80 risk</span>
                  <span className="text-amber-600">&lt;2min → 60 risk</span>
                  <span className="text-amber-500">&lt;5min → 30 risk</span>
                  <span className="text-green-600">≥5min → 10 risk</span>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-neutral-700 mb-2">Penalties</h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Role Mismatch</span>
                    <span className="font-bold text-red-600">+20</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Calendar Check Fail</span>
                    <span className="font-bold text-red-600">+15</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Volume Check Fail</span>
                    <span className="font-bold text-red-600">+20</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* What We Look For */}
          <Card>
            <h2 className="text-xl font-bold text-neutral-900 mb-4">What Increases/Decreases Risk</h2>

            <div className="space-y-3 text-sm">
              <h3 className="font-bold text-green-600">Decreases Risk (Good)</h3>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Specific reference numbers (LN-xxxx, AUD-xxxx)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Concrete dates and deadlines</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Named authorizers or managers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Longer response time (thoughtful request)</span>
                </div>
              </div>

              <div className="border-t border-neutral-200 my-3" />

              <h3 className="font-bold text-red-600">Increases Risk (Suspicious)</h3>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  <span>Vague terms like "urgent", "quick", "routine"</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  <span>Very short explanations (&lt;10 words)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  <span>Fast response time (&lt;30 seconds)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  <span>Role mismatch with requested system</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
