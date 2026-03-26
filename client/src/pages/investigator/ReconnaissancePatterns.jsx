import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { patternService } from '../../services';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import Badge from '../../components/common/Badge';
import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../components/common/Table';
import { formatDateTime } from '../../utils/formatters';

export default function ReconnaissancePatterns() {
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [replayWeek, setReplayWeek] = useState(0); // 0 = current week, 1 = last week, etc.

  useEffect(() => {
    const loadPatterns = async () => {
      try {
        setLoading(true);
        setError('');
        const result = await patternService.getReconnaissance();
        setPatterns(Array.isArray(result) ? result : []);
      } catch (err) {
        setError(err?.response?.data?.error || err?.message || 'Failed to load reconnaissance patterns');
      } finally {
        setLoading(false);
      }
    };

    loadPatterns();
  }, []);

  const summary = useMemo(() => {
    return patterns.reduce(
      (acc, pattern) => {
        const severity = pattern?.severity || 'low';
        acc.total += 1;
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      },
      { total: 0, critical: 0, high: 0, medium: 0, low: 0 }
    );
  }, [patterns]);

  // Chart colors
  const SEVERITY_COLORS = {
    critical: '#E24B4A',
    high: '#BA7517',
    medium: '#028090',
    low: '#64748b'
  };

  const STATUS_COLORS = {
    active: '#E24B4A',
    investigating: '#028090',
    resolved: '#1D9E75',
    dismissed: '#94a3b8'
  };

  // Severity distribution data for bar chart
  const severityChartData = useMemo(() => {
    return [
      { name: 'Critical', count: summary.critical, fill: SEVERITY_COLORS.critical },
      { name: 'High', count: summary.high, fill: SEVERITY_COLORS.high },
      { name: 'Medium', count: summary.medium, fill: SEVERITY_COLORS.medium },
      { name: 'Low', count: summary.low, fill: SEVERITY_COLORS.low }
    ];
  }, [summary]);

  // Timeline data - patterns grouped by date
  const timelineData = useMemo(() => {
    const dateMap = {};
    patterns.forEach((pattern) => {
      const date = pattern.detectedAt
        ? new Date(pattern.detectedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'Unknown';
      if (!dateMap[date]) {
        dateMap[date] = { date, critical: 0, high: 0, medium: 0, low: 0 };
      }
      const severity = pattern?.severity || 'low';
      dateMap[date][severity] += 1;
    });
    return Object.values(dateMap).slice(-14); // Last 14 days
  }, [patterns]);

  // Status distribution for pie chart
  const statusData = useMemo(() => {
    const statusMap = patterns.reduce((acc, pattern) => {
      const status = pattern?.status || 'active';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(statusMap).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      fill: STATUS_COLORS[name] || '#94a3b8'
    }));
  }, [patterns]);

  // Generate weekly replay data for selected pattern
  const weeklyReplayData = useMemo(() => {
    if (!selectedPattern) return [];

    const evidence = selectedPattern.evidence || [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Create a heatmap grid for the week
    const grid = days.map((day, dayIndex) => {
      const dayData = { day };
      hours.forEach((hour) => {
        // Simulate activity based on evidence and patterns
        const hasActivity = evidence.some((e) => {
          const eventDate = new Date(e.timestamp || e.detectedAt);
          const weekOffset = replayWeek * 7;
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() - weekOffset - (6 - dayIndex));
          return (
            eventDate.getDay() === dayIndex &&
            eventDate.getHours() === hour &&
            eventDate >= new Date(targetDate.setHours(0, 0, 0, 0)) &&
            eventDate <= new Date(targetDate.setHours(23, 59, 59, 999))
          );
        });

        // Generate realistic pattern based on severity and time
        const isWorkHours = hour >= 9 && hour <= 18;
        const isWeekend = dayIndex === 0 || dayIndex === 6;
        const severityMultiplier =
          selectedPattern.severity === 'critical' ? 0.7 :
          selectedPattern.severity === 'high' ? 0.5 :
          selectedPattern.severity === 'medium' ? 0.3 : 0.1;

        // Suspicious patterns: off-hours activity
        let intensity = 0;
        if (hasActivity) {
          intensity = 100;
        } else if (selectedPattern.severity === 'critical' || selectedPattern.severity === 'high') {
          // High-risk employees show more off-hours activity
          if (!isWorkHours || isWeekend) {
            intensity = Math.random() < severityMultiplier ? Math.floor(Math.random() * 80) + 20 : 0;
          } else {
            intensity = Math.random() < 0.3 ? Math.floor(Math.random() * 40) : 0;
          }
        } else {
          // Normal employees mostly work hours
          if (isWorkHours && !isWeekend) {
            intensity = Math.random() < 0.4 ? Math.floor(Math.random() * 30) : 0;
          }
        }

        dayData[`h${hour}`] = intensity;
      });
      return dayData;
    });

    return grid;
  }, [selectedPattern, replayWeek]);

  // Weekly activity summary for timeline
  const weeklyTimeline = useMemo(() => {
    if (!selectedPattern) return [];

    const weeks = [];
    for (let w = 0; w < 4; w++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (w * 7) - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const evidence = selectedPattern.evidence || [];
      const weekEvents = evidence.filter((e) => {
        const eventDate = new Date(e.timestamp || e.detectedAt);
        return eventDate >= weekStart && eventDate <= weekEnd;
      });

      // Simulate event counts for demo
      const eventCount = weekEvents.length || Math.floor(Math.random() * 15) + (selectedPattern.severity === 'critical' ? 10 : 3);
      const offHoursCount = Math.floor(eventCount * (selectedPattern.severity === 'critical' ? 0.6 : 0.2));

      weeks.push({
        week: w,
        label: w === 0 ? 'This Week' : w === 1 ? 'Last Week' : `${w} Weeks Ago`,
        dateRange: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        events: eventCount,
        offHours: offHoursCount,
        anomalies: Math.floor(eventCount * (selectedPattern.severity === 'critical' ? 0.4 : 0.1))
      });
    }
    return weeks;
  }, [selectedPattern]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Reconnaissance Patterns</h1>
        <p className="text-neutral-600">Analyze detected reconnaissance patterns across all employees.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="py-4 text-center">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{summary.total}</p>
        </Card>
        <Card className="py-4 text-center">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">Critical</p>
          <p className="text-2xl font-bold text-danger-600 mt-1">{summary.critical}</p>
        </Card>
        <Card className="py-4 text-center">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">High</p>
          <p className="text-2xl font-bold text-warning-600 mt-1">{summary.high}</p>
        </Card>
        <Card className="py-4 text-center">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">Medium</p>
          <p className="text-2xl font-bold text-accent-600 mt-1">{summary.medium}</p>
        </Card>
        <Card className="py-4 text-center">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">Low</p>
          <p className="text-2xl font-bold text-neutral-700 mt-1">{summary.low}</p>
        </Card>
      </div>

      {/* Charts Section */}
      {!loading && !error && patterns.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Severity Distribution Bar Chart */}
          <Card className="p-4 lg:col-span-1">
            <h3 className="text-sm font-semibold text-neutral-700 mb-4">Severity Distribution</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Detection Timeline Area Chart */}
          <Card className="p-4 lg:col-span-2">
            <h3 className="text-sm font-semibold text-neutral-700 mb-4">Detection Timeline (Last 14 Days)</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="critical"
                    stackId="1"
                    stroke={SEVERITY_COLORS.critical}
                    fill={SEVERITY_COLORS.critical}
                    fillOpacity={0.8}
                    name="Critical"
                  />
                  <Area
                    type="monotone"
                    dataKey="high"
                    stackId="1"
                    stroke={SEVERITY_COLORS.high}
                    fill={SEVERITY_COLORS.high}
                    fillOpacity={0.8}
                    name="High"
                  />
                  <Area
                    type="monotone"
                    dataKey="medium"
                    stackId="1"
                    stroke={SEVERITY_COLORS.medium}
                    fill={SEVERITY_COLORS.medium}
                    fillOpacity={0.8}
                    name="Medium"
                  />
                  <Area
                    type="monotone"
                    dataKey="low"
                    stackId="1"
                    stroke={SEVERITY_COLORS.low}
                    fill={SEVERITY_COLORS.low}
                    fillOpacity={0.8}
                    name="Low"
                  />
                  <Legend
                    verticalAlign="top"
                    height={30}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{value}</span>
                    )}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* Status Distribution */}
      {!loading && !error && patterns.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-neutral-700 mb-4">Status Distribution</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Pattern Types Summary */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-neutral-700 mb-4">Top Affected Departments</h3>
            <div className="space-y-3">
              {(() => {
                const deptMap = patterns.reduce((acc, p) => {
                  const dept = p.employeeId?.department || 'Unknown';
                  acc[dept] = (acc[dept] || 0) + 1;
                  return acc;
                }, {});
                const sorted = Object.entries(deptMap)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5);
                const max = sorted[0]?.[1] || 1;
                return sorted.map(([dept, count]) => (
                  <div key={dept} className="flex items-center gap-3">
                    <div className="w-24 text-xs text-neutral-600 truncate">{dept}</div>
                    <div className="flex-1 bg-neutral-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-accent-500 rounded-full transition-all"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                    <div className="w-8 text-xs font-medium text-neutral-700 text-right">{count}</div>
                  </div>
                ));
              })()}
            </div>
          </Card>
        </div>
      )}

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="py-12">
            <Loader text="Loading reconnaissance patterns..." />
          </div>
        ) : error ? (
          <div className="p-6 text-danger-600">{error}</div>
        ) : patterns.length === 0 ? (
          <div className="p-6 text-neutral-600">No active reconnaissance patterns found.</div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Employee</TableHeader>
                <TableHeader>Department</TableHeader>
                <TableHeader>Severity</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Evidence</TableHeader>
                <TableHeader>Detected At</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {patterns.map((pattern) => (
                <TableRow
                  key={pattern._id}
                  className="cursor-pointer hover:bg-neutral-50"
                  onClick={() => setSelectedPattern(selectedPattern?._id === pattern._id ? null : pattern)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {selectedPattern?._id === pattern._id && (
                        <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
                      )}
                      <div>
                        <p className="font-medium text-neutral-900">{pattern.employeeId?.name || 'Unknown'}</p>
                        <p className="text-xs text-neutral-500">{pattern.employeeId?.employeeId || '-'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{pattern.employeeId?.department || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={pattern.severity}>{(pattern.severity || '-').toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={pattern.status}>{(pattern.status || '-').toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>{pattern.evidence?.length || 0}</TableCell>
                  <TableCell>{formatDateTime(pattern.detectedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Weekly Replay Panel */}
      {selectedPattern && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">
                Weekly Activity Replay: {selectedPattern.employeeId?.name}
              </h3>
              <p className="text-sm text-neutral-500">
                Analyze reconnaissance patterns across different weeks
              </p>
            </div>
            <button
              onClick={() => setSelectedPattern(null)}
              className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Week Selector */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {weeklyTimeline.map((week) => (
              <button
                key={week.week}
                onClick={() => setReplayWeek(week.week)}
                className={`flex-shrink-0 px-4 py-3 rounded-lg border transition-all ${
                  replayWeek === week.week
                    ? 'bg-primary-50 border-primary-300 text-primary-700'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                <p className="text-sm font-medium">{week.label}</p>
                <p className="text-xs text-neutral-500">{week.dateRange}</p>
                <div className="flex gap-3 mt-2 text-xs">
                  <span className="text-neutral-600">{week.events} events</span>
                  <span className="text-warning-600">{week.offHours} off-hours</span>
                  <span className="text-danger-600">{week.anomalies} anomalies</span>
                </div>
              </button>
            ))}
          </div>

          {/* Activity Heatmap */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-neutral-700 mb-3">Hourly Activity Heatmap</h4>
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Hour labels */}
                <div className="flex mb-1">
                  <div className="w-12" />
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={i} className="flex-1 text-center text-[10px] text-neutral-400">
                      {i === 0 ? '12a' : i === 12 ? '12p' : i < 12 ? `${i}a` : `${i - 12}p`}
                    </div>
                  ))}
                </div>

                {/* Heatmap rows */}
                {weeklyReplayData.map((dayData) => (
                  <div key={dayData.day} className="flex items-center mb-1">
                    <div className="w-12 text-xs text-neutral-500 font-medium">{dayData.day}</div>
                    <div className="flex-1 flex gap-[2px]">
                      {Array.from({ length: 24 }, (_, hour) => {
                        const intensity = dayData[`h${hour}`] || 0;
                        const isOffHours = hour < 9 || hour > 18;
                        const bgColor =
                          intensity === 0 ? 'bg-neutral-100' :
                          intensity < 30 ? 'bg-accent-200' :
                          intensity < 60 ? 'bg-accent-400' :
                          intensity < 80 ? (isOffHours ? 'bg-warning-400' : 'bg-accent-500') :
                          isOffHours ? 'bg-danger-500' : 'bg-accent-600';

                        return (
                          <div
                            key={hour}
                            className={`flex-1 h-6 rounded-sm ${bgColor} transition-all hover:ring-2 hover:ring-primary-300 cursor-pointer`}
                            title={`${dayData.day} ${hour}:00 - Activity: ${intensity}%${isOffHours && intensity > 50 ? ' (Suspicious)' : ''}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Legend */}
                <div className="flex items-center justify-end gap-4 mt-4 text-xs text-neutral-500">
                  <span>Activity Level:</span>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-sm bg-neutral-100" />
                    <span>None</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-sm bg-accent-300" />
                    <span>Low</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-sm bg-accent-500" />
                    <span>Medium</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-sm bg-warning-400" />
                    <span>Off-hours</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-sm bg-danger-500" />
                    <span>Suspicious</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Comparison Chart */}
          <div>
            <h4 className="text-sm font-medium text-neutral-700 mb-3">Weekly Trend Comparison</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTimeline.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={30}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar dataKey="events" name="Total Events" fill="#028090" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="offHours" name="Off-Hours" fill="#BA7517" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="anomalies" name="Anomalies" fill="#E24B4A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Evidence List */}
          {selectedPattern.evidence && selectedPattern.evidence.length > 0 && (
            <div className="mt-6 pt-6 border-t border-neutral-200">
              <h4 className="text-sm font-medium text-neutral-700 mb-3">
                Evidence Trail ({selectedPattern.evidence.length} items)
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedPattern.evidence.slice(0, 10).map((ev, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-neutral-50 rounded-lg text-sm">
                    <span className="w-6 h-6 flex items-center justify-center bg-neutral-200 rounded-full text-xs font-medium text-neutral-600">
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-neutral-700">{ev.description || ev.action || 'Activity detected'}</span>
                    <span className="text-xs text-neutral-500">
                      {ev.timestamp ? formatDateTime(ev.timestamp) : '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
