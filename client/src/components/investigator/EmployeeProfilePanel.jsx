import { useState, useEffect } from 'react';
import { accessEventService, ticketService, patternService } from '../../services';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Loader from '../common/Loader';
import { formatDateTime, formatRelativeTime, formatDate } from '../../utils/formatters';
import { getRiskBadge } from '../../utils/constants';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine
} from 'recharts';
import clsx from 'clsx';

export default function EmployeeProfilePanel({ employee, onClose }) {
  const [activeTab, setActiveTab] = useState('timeline');
  const [loading, setLoading] = useState(true);
  const [accessEvents, setAccessEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [showActionModal, setShowActionModal] = useState(null);
  const [actionJustification, setActionJustification] = useState('');

  useEffect(() => {
    if (employee) {
      loadEmployeeData();
    }
  }, [employee]);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      const [eventsData, ticketsData, patternsData] = await Promise.all([
        accessEventService.getByEmployee(employee._id, { limit: 100 }),
        ticketService.getAll({ employeeId: employee._id }),
        patternService.getByEmployee(employee._id)
      ]);

      setAccessEvents(eventsData || []);
      setTickets(ticketsData.tickets || []);
      setPatterns(patternsData || []);
    } catch (err) {
      console.error('Error loading employee data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate tenure
  const calculateTenure = () => {
    const joinDate = new Date(employee.joinDate);
    const now = new Date();
    const years = now.getFullYear() - joinDate.getFullYear();
    const months = now.getMonth() - joinDate.getMonth();
    const totalMonths = years * 12 + months;
    if (totalMonths < 12) return `${totalMonths} months`;
    return `${Math.floor(totalMonths / 12)}y ${totalMonths % 12}m`;
  };

  // Calculate score trend
  const calculateTrend = () => {
    const history = employee.riskScoreHistory || [];
    if (history.length < 2) return { change: 0, days: 0, status: 'stable' };

    const recent = history[history.length - 1];
    const weekAgo = history.find((h, idx) => {
      const daysDiff = Math.floor((new Date(recent.timestamp) - new Date(h.timestamp)) / (1000 * 60 * 60 * 24));
      return daysDiff >= 7;
    });

    if (!weekAgo) return { change: 0, days: 7, status: 'stable' };

    const change = recent.score - weekAgo.score;
    return {
      change: Math.abs(Math.round(change)),
      days: 7,
      status: change > 10 ? 'increasing' : change < -10 ? 'decreasing' : 'stable'
    };
  };

  const trend = calculateTrend();

  // Risk gauge angle calculation
  const getRiskGaugeAngle = (score) => {
    return (score / 100) * 180 - 90;
  };

  // Prepare timeline data
  const timelineEvents = accessEvents
    .filter(e => e.anomalyScore > 50)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 20);

  // Calculate ticket statistics
  const avgNLPScore = tickets.length > 0
    ? tickets.reduce((sum, t) => sum + (t.overallScore || 0), 0) / tickets.length
    : 0;

  const avgResponseTime = tickets.length > 0
    ? tickets.reduce((sum, t) => sum + (t.responseTime || 0), 0) / tickets.length
    : 0;

  // Prepare baseline comparison data
  const accessTimeData = accessEvents.slice(0, 90).map(e => ({
    date: formatDate(e.timestamp),
    hour: new Date(e.timestamp).getHours(),
    anomaly: e.anomalyScore > 70
  }));

  const volumeData = [];
  const eventsByDay = {};
  accessEvents.forEach(e => {
    const day = formatDate(e.timestamp);
    if (!eventsByDay[day]) {
      eventsByDay[day] = { day, volume: 0, anomalous: false };
    }
    eventsByDay[day].volume += e.volumeAccessed || 0;
    if (e.anomalyScore > 70) eventsByDay[day].anomalous = true;
  });
  Object.values(eventsByDay).forEach(data => volumeData.push(data));

  // Pattern analysis
  const hasFrequencyAnomaly = timelineEvents.filter(e => {
    const hour = new Date(e.timestamp).getHours();
    return hour < 7 || hour > 19;
  }).length >= 3;

  const hasSpecificityDecay = avgNLPScore < 40;

  const multiSystemAccess = new Set(accessEvents.slice(0, 50).map(e => e.system)).size;
  const hasTriangulation = multiSystemAccess >= 4;

  const reconConfirmed = hasFrequencyAnomaly && hasSpecificityDecay && hasTriangulation;

  // System access timeline
  const systemTimeline = {};
  accessEvents.slice(0, 30).forEach(e => {
    const day = formatDate(e.timestamp);
    if (!systemTimeline[day]) systemTimeline[day] = new Set();
    systemTimeline[day].add(e.system);
  });

  const handleAction = (action) => {
    if (!actionJustification.trim()) {
      alert('Please provide a justification');
      return;
    }
    console.log(`Action: ${action}`, actionJustification);
    setShowActionModal(null);
    setActionJustification('');
    alert(`${action} action recorded with justification`);
  };

  const tabs = [
    { id: 'timeline', label: 'Timeline' },
    { id: 'tickets', label: 'Ticket History' },
    { id: 'baseline', label: 'Baseline Comparison' },
    { id: 'patterns', label: 'Pattern Analysis' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-60 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute inset-y-0 right-0 max-w-4xl w-full bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-700 text-white p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              {/* Photo Placeholder */}
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-3xl font-bold">
                {employee.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{employee.name}</h2>
                <p className="text-white text-opacity-90">{employee.position}</p>
                <p className="text-sm text-white text-opacity-75">
                  {employee.department} • {employee.branch}
                </p>
                <p className="text-xs text-white text-opacity-75 font-mono mt-1">
                  {employee.employeeId} • Tenure: {calculateTenure()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Risk Score Gauge */}
          <div className="flex items-center gap-8">
            <div className="relative">
              <svg width="200" height="120" viewBox="0 0 200 120">
                {/* Background Arc */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="20"
                  strokeLinecap="round"
                />
                {/* Colored Arcs */}
                <path d="M 20 100 A 80 80 0 0 1 80 30" fill="none" stroke="#1D9E75" strokeWidth="20" strokeLinecap="round" />
                <path d="M 80 30 A 80 80 0 0 1 120 30" fill="none" stroke="#BA7517" strokeWidth="20" strokeLinecap="round" />
                <path d="M 120 30 A 80 80 0 0 1 180 100" fill="none" stroke="#E24B4A" strokeWidth="20" strokeLinecap="round" />
                {/* Needle */}
                <line
                  x1="100"
                  y1="100"
                  x2="100"
                  y2="30"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  transform={`rotate(${getRiskGaugeAngle(employee.currentRiskScore)} 100 100)`}
                />
                {/* Center Circle */}
                <circle cx="100" cy="100" r="8" fill="white" />
                {/* Score Text */}
                <text x="100" y="115" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">
                  {employee.currentRiskScore}
                </text>
              </svg>
              <p className="text-center text-xs text-white text-opacity-75 -mt-2">Risk Score</p>
            </div>

            {/* Trend Indicator */}
            <div>
              <p className="text-sm text-white text-opacity-75 mb-2">7-Day Trend</p>
              {trend.status === 'increasing' ? (
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-danger" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3l7 7h-4v7H7v-7H3l7-7z" />
                  </svg>
                  <span className="text-2xl font-bold text-danger">↑ {trend.change} points</span>
                </div>
              ) : trend.status === 'decreasing' ? (
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 17l-7-7h4V3h6v7h4l-7 7z" />
                  </svg>
                  <span className="text-2xl font-bold text-success">↓ {trend.change} points</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-success">Stable</span>
                </div>
              )}
              <p className="text-xs text-white text-opacity-75 mt-1">in {trend.days} days</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-neutral-200 bg-neutral-50 px-6">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'px-6 py-3 font-medium text-sm transition-colors border-b-2',
                  activeTab === tab.id
                    ? 'border-primary text-primary bg-white'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <Loader text="Loading employee profile..." />
          ) : (
            <>
              {/* Tab 1: Timeline */}
              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-neutral-900">Friction Event Timeline</h3>
                  <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-neutral-300" />

                    {timelineEvents.map((event, idx) => (
                      <div key={event._id} className="relative flex gap-4 mb-4">
                        {/* Timeline Dot */}
                        <div className={clsx(
                          'w-16 h-16 rounded-full border-4 border-white flex items-center justify-center z-10',
                          event.anomalyScore >= 70 ? 'bg-danger' : event.anomalyScore >= 50 ? 'bg-warning' : 'bg-success'
                        )}>
                          <span className="text-white text-xs font-bold">{event.anomalyScore}</span>
                        </div>

                        {/* Event Card */}
                        <div className="flex-1 bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm font-medium text-neutral-900">
                                {event.action.toUpperCase()} - {event.system}
                              </p>
                              <p className="text-xs text-neutral-600">{event.resourceType}</p>
                            </div>
                            <Badge variant={event.anomalyScore >= 70 ? 'danger' : event.anomalyScore >= 50 ? 'warning' : 'success'}>
                              {event.anomalyScore >= 70 ? 'CVU Escalation' : event.anomalyScore >= 50 ? 'Manager Review' : 'Auto Approved'}
                            </Badge>
                          </div>
                          <p className="text-xs text-neutral-500 mb-2">
                            {formatDateTime(event.timestamp)} • Volume: {event.volumeAccessed}
                          </p>
                          {event.anomalyReasons?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {event.anomalyReasons.map((reason, i) => (
                                <span key={i} className="text-xs bg-warning-100 text-warning-800 px-2 py-1 rounded">
                                  {reason}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Ticket History */}
              {activeTab === 'tickets' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-neutral-900">Ticket History</h3>

                  {tickets.length === 0 ? (
                    <p className="text-neutral-500 text-center py-8">No tickets found</p>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-neutral-100">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-neutral-700">Date</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-neutral-700">Reason</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-neutral-700">Relevance</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-neutral-700">Coherence</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-neutral-700">Specificity</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-neutral-700">Timeliness</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-neutral-700">Consistency</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-neural-700">Final</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-neutral-700">Routing</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200">
                            {tickets.map(ticket => (
                              <tr key={ticket._id} className="hover:bg-neutral-50">
                                <td className="px-3 py-2 text-xs text-neutral-600">{formatDate(ticket.createdAt)}</td>
                                <td className="px-3 py-2 text-xs text-neutral-900 max-w-xs truncate">
                                  {ticket.text}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <Badge variant={ticket.checkScores.relevanceScore >= 70 ? 'success' : ticket.checkScores.relevanceScore >= 50 ? 'warning' : 'danger'}>
                                    {ticket.checkScores.relevanceScore}
                                  </Badge>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <Badge variant={ticket.checkScores.coherenceScore >= 70 ? 'success' : ticket.checkScores.coherenceScore >= 50 ? 'warning' : 'danger'}>
                                    {ticket.checkScores.coherenceScore}
                                  </Badge>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <Badge variant={ticket.checkScores.specificityScore >= 70 ? 'success' : ticket.checkScores.specificityScore >= 50 ? 'warning' : 'danger'}>
                                    {ticket.checkScores.specificityScore}
                                  </Badge>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <Badge variant={ticket.checkScores.timelinessScore >= 70 ? 'success' : ticket.checkScores.timelinessScore >= 50 ? 'warning' : 'danger'}>
                                    {ticket.checkScores.timelinessScore}
                                  </Badge>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <Badge variant={ticket.checkScores.consistencyScore >= 70 ? 'success' : ticket.checkScores.consistencyScore >= 50 ? 'warning' : 'danger'}>
                                    {ticket.checkScores.consistencyScore}
                                  </Badge>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <Badge variant={ticket.overallScore >= 70 ? 'success' : ticket.overallScore >= 50 ? 'warning' : 'danger'}>
                                    {Math.round(ticket.overallScore)}
                                  </Badge>
                                </td>
                                <td className="px-3 py-2 text-xs">
                                  <Badge variant={ticket.routingDecision === 'auto_resolve' ? 'success' : ticket.routingDecision === 'manager_review' ? 'warning' : 'danger'}>
                                    {ticket.routingDecision.replace('_', ' ')}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Summary */}
                      <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-neutral-600">Average NLP Score</p>
                            <p className="text-2xl font-bold text-neutral-900">{avgNLPScore.toFixed(1)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-600">Average Response Time</p>
                            <p className="text-2xl font-bold text-neutral-900">{Math.round(avgResponseTime)} min</p>
                          </div>
                        </div>

                        {avgNLPScore < 40 && (
                          <div className="mt-4 bg-danger-100 border border-danger-300 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5 text-danger" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm font-medium text-danger-800">
                                Consistently vague reasons — specificity decay detected
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Tab 3: Baseline Comparison */}
              {activeTab === 'baseline' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-neutral-900">Baseline Comparison</h3>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Access Time Pattern */}
                    <div>
                      <h4 className="text-sm font-medium text-neutral-900 mb-3">Access Time Pattern (90 days)</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={accessTimeData.slice(0, 30)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                          <YAxis domain={[0, 24]} ticks={[0, 6, 12, 18, 24]} label={{ value: 'Hour of Day', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <ReferenceLine y={7} stroke="#1D9E75" strokeDasharray="3 3" label="Work Start" />
                          <ReferenceLine y={19} stroke="#1D9E75" strokeDasharray="3 3" label="Work End" />
                          <Line type="monotone" dataKey="hour" stroke="#0C2D62" dot={(props) => {
                            const { cx, cy, payload } = props;
                            return (
                              <circle
                                cx={cx}
                                cy={cy}
                                r={payload.anomaly ? 6 : 3}
                                fill={payload.anomaly ? '#E24B4A' : '#0C2D62'}
                                stroke={payload.anomaly ? '#E24B4A' : '#0C2D62'}
                              />
                            );
                          }} />
                        </LineChart>
                      </ResponsiveContainer>
                      <p className="text-xs text-neutral-600 mt-2">
                        Red dots = Off-hours access attempts • Normal range: 7 AM - 7 PM
                      </p>
                    </div>

                    {/* Download Volume Pattern */}
                    <div>
                      <h4 className="text-sm font-medium text-neutral-900 mb-3">Data Download Volume (Daily)</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={volumeData.slice(0, 30)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                          <YAxis label={{ value: 'Records', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Bar dataKey="volume" fill="#0C2D62">
                            {volumeData.slice(0, 30).map((entry, index) => (
                              <Bar key={`cell-${index}`} fill={entry.anomalous ? '#E24B4A' : '#0C2D62'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <p className="text-xs text-neutral-600 mt-2">
                        Red bars = Anomalous download attempts exceeding normal volume
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Pattern Analysis */}
              {activeTab === 'patterns' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-neutral-900">Reconnaissance Pattern Detection</h3>

                  {reconConfirmed && (
                    <div className="bg-danger text-white rounded-lg p-6 text-center">
                      <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <h4 className="text-2xl font-bold mb-2">RECONNAISSANCE PATTERN CONFIRMED</h4>
                      <p className="text-white text-opacity-90">All three signature indicators detected</p>
                    </div>
                  )}

                  {/* Three Signatures */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className={clsx(
                      'border-2 rounded-lg p-4 text-center',
                      hasFrequencyAnomaly ? 'border-danger bg-danger-50' : 'border-success bg-success-50'
                    )}>
                      <div className={clsx('w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center', {
                        'bg-danger text-white': hasFrequencyAnomaly,
                        'bg-success text-white': !hasFrequencyAnomaly
                      })}>
                        {hasFrequencyAnomaly ? '✗' : '✓'}
                      </div>
                      <h4 className="font-semibold text-sm text-neutral-900 mb-1">Frequency Anomaly</h4>
                      <p className="text-xs text-neutral-600">3+ off-hours accesses in 60 days</p>
                      <p className={clsx('text-sm font-bold mt-2', hasFrequencyAnomaly ? 'text-danger' : 'text-success')}>
                        {hasFrequencyAnomaly ? 'DETECTED' : 'Not Detected'}
                      </p>
                    </div>

                    <div className={clsx(
                      'border-2 rounded-lg p-4 text-center',
                      hasSpecificityDecay ? 'border-danger bg-danger-50' : 'border-success bg-success-50'
                    )}>
                      <div className={clsx('w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center', {
                        'bg-danger text-white': hasSpecificityDecay,
                        'bg-success text-white': !hasSpecificityDecay
                      })}>
                        {hasSpecificityDecay ? '✗' : '✓'}
                      </div>
                      <h4 className="font-semibold text-sm text-neutral-900 mb-1">Specificity Decay</h4>
                      <p className="text-xs text-neutral-600">Avg NLP score below 40</p>
                      <p className={clsx('text-sm font-bold mt-2', hasSpecificityDecay ? 'text-danger' : 'text-success')}>
                        {hasSpecificityDecay ? 'DETECTED' : 'Not Detected'}
                      </p>
                    </div>

                    <div className={clsx(
                      'border-2 rounded-lg p-4 text-center',
                      hasTriangulation ? 'border-danger bg-danger-50' : 'border-success bg-success-50'
                    )}>
                      <div className={clsx('w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center', {
                        'bg-danger text-white': hasTriangulation,
                        'bg-success text-white': !hasTriangulation
                      })}>
                        {hasTriangulation ? '✗' : '✓'}
                      </div>
                      <h4 className="font-semibold text-sm text-neutral-900 mb-1">Triangulation</h4>
                      <p className="text-xs text-neutral-600">Multi-system access in one week</p>
                      <p className={clsx('text-sm font-bold mt-2', hasTriangulation ? 'text-danger' : 'text-success')}>
                        {hasTriangulation ? `${multiSystemAccess} Systems` : 'Not Detected'}
                      </p>
                    </div>
                  </div>

                  {/* System Access Timeline */}
                  <div>
                    <h4 className="text-sm font-medium text-neutral-900 mb-3">System Access Timeline</h4>
                    <div className="space-y-2">
                      {Object.entries(systemTimeline).slice(0, 10).map(([day, systems]) => (
                        <div key={day} className="flex items-center gap-3">
                          <span className="text-xs text-neutral-600 w-24">{day}</span>
                          <div className="flex-1 flex gap-2">
                            {Array.from(systems).map(system => (
                              <Badge key={system} variant="info">{system}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="border-t border-neutral-200 bg-neutral-50 p-4">
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Dismiss
            </Button>
            <Button variant="warning" className="flex-1" onClick={() => setShowActionModal('escalate')}>
              Escalate to Legal
            </Button>
            <Button variant="danger" className="flex-1" onClick={() => setShowActionModal('str')}>
              File STR
            </Button>
          </div>
        </div>
      </div>

      {/* Action Confirmation Modal */}
      {showActionModal && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowActionModal(null)} />
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-neutral-900 mb-4">
              {showActionModal === 'escalate' ? 'Escalate to Legal' : 'File Suspicious Transaction Report'}
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              Please provide a justification for this action:
            </p>
            <textarea
              value={actionJustification}
              onChange={(e) => setActionJustification(e.target.value)}
              className="w-full h-32 input resize-none"
              placeholder="Enter your justification..."
            />
            <div className="flex gap-3 mt-4">
              <Button variant="secondary" className="flex-1" onClick={() => setShowActionModal(null)}>
                Cancel
              </Button>
              <Button
                variant={showActionModal === 'str' ? 'danger' : 'warning'}
                className="flex-1"
                onClick={() => handleAction(showActionModal)}
                disabled={!actionJustification.trim()}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
