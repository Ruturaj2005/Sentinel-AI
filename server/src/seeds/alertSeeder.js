import Alert from '../models/Alert.js';
import Pattern from '../models/Pattern.js';
import AccessEvent from '../models/AccessEvent.js';
import Ticket from '../models/Ticket.js';
import { ALERT_SEVERITY, ALERT_STATUS, TICKET_ROUTING } from '../config/constants.js';

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateAlertForRiskThreshold = (employee, patterns, recentEvents) => {
  const riskScore = employee.currentRiskScore;

  if (riskScore < 60) return null;

  const severity = riskScore >= 90 ? ALERT_SEVERITY.CRITICAL :
                   riskScore >= 75 ? ALERT_SEVERITY.HIGH :
                   riskScore >= 60 ? ALERT_SEVERITY.MEDIUM :
                   ALERT_SEVERITY.LOW;

  const alertId = `ALT-${new Date().getFullYear()}-${String(randomInt(10000, 99999)).padStart(5, '0')}`;

  const patternIds = patterns.filter(p => p.employeeId.equals(employee._id)).map(p => p._id);
  const highAnomalyEvents = recentEvents.filter(e => e.anomalyScore > 70).map(e => e._id);

  return {
    alertId,
    employeeId: employee._id,
    severity,
    triggerReason: `Risk score ${riskScore} exceeds threshold`,
    triggerType: 'threshold_breach',
    metadata: {
      riskScore,
      patternIds,
      accessEventIds: highAnomalyEvents.slice(0, 10),
      ticketIds: []
    },
    status: riskScore >= 85 ? ALERT_STATUS.INVESTIGATING : ALERT_STATUS.ACTIVE,
    assignedTo: null,
    notes: ''
  };
};

const generateAlertForPattern = (pattern, employee) => {
  const alertId = `ALT-${new Date().getFullYear()}-${String(randomInt(10000, 99999)).padStart(5, '0')}`;

  let triggerReason = '';
  if (pattern.patternType === 'reconnaissance') {
    triggerReason = 'Reconnaissance pattern detected - multiple failed access attempts and cross-department activity';
  } else if (pattern.patternType === 'data_hoarding') {
    triggerReason = 'Data exfiltration pattern detected - bulk downloads and sensitive data access';
  } else if (pattern.patternType === 'off_hours') {
    triggerReason = 'Unusual access pattern - frequent off-hours activity';
  } else {
    triggerReason = 'Unusual system access pattern detected';
  }

  return {
    alertId,
    employeeId: employee._id,
    severity: pattern.severity,
    triggerReason,
    triggerType: 'pattern_detected',
    metadata: {
      riskScore: employee.currentRiskScore,
      patternIds: [pattern._id],
      accessEventIds: pattern.evidence.map(e => e.accessEventId),
      ticketIds: []
    },
    status: pattern.severity === ALERT_SEVERITY.CRITICAL ? ALERT_STATUS.INVESTIGATING : ALERT_STATUS.ACTIVE,
    assignedTo: null,
    notes: ''
  };
};

const generateAlertForTicketFailure = (ticket, employee, accessEvent) => {
  const alertId = `ALT-${new Date().getFullYear()}-${String(randomInt(10000, 99999)).padStart(5, '0')}`;

  const severity = ticket.routingDecision === TICKET_ROUTING.CVU_ESCALATION ? ALERT_SEVERITY.HIGH :
                   ticket.overallScore < 40 ? ALERT_SEVERITY.MEDIUM :
                   ALERT_SEVERITY.LOW;

  return {
    alertId,
    employeeId: employee._id,
    severity,
    triggerReason: `Ticket ${ticket.ticketId} failed validation checks (score: ${ticket.overallScore})`,
    triggerType: 'ticket_failure',
    metadata: {
      riskScore: employee.currentRiskScore,
      patternIds: [],
      accessEventIds: [ticket.accessEventId],
      ticketIds: [ticket._id]
    },
    status: ALERT_STATUS.ACTIVE,
    assignedTo: null,
    notes: ''
  };
};

const seedAlerts = async (employees) => {
  try {
    console.log('  Generating alerts...');

    const alerts = [];

    // Get all patterns and tickets
    const allPatterns = await Pattern.find().lean();
    const allTickets = await Ticket.find().lean();

    for (const employee of employees) {
      const employeePatterns = allPatterns.filter(p => p.employeeId.equals(employee._id));
      const employeeTickets = allTickets.filter(t => t.employeeId.equals(employee._id));

      // Get recent high-anomaly events
      const recentEvents = await AccessEvent.find({
        employeeId: employee._id,
        anomalyScore: { $gte: 70 }
      }).sort({ timestamp: -1 }).limit(20).lean();

      // 1. Risk threshold alerts
      const riskAlert = generateAlertForRiskThreshold(employee, employeePatterns, recentEvents);
      if (riskAlert) {
        alerts.push(riskAlert);
      }

      // 2. Pattern-based alerts
      for (const pattern of employeePatterns) {
        if (pattern.severity === ALERT_SEVERITY.HIGH || pattern.severity === ALERT_SEVERITY.CRITICAL) {
          alerts.push(generateAlertForPattern(pattern, employee));
        }
      }

      // 3. Ticket failure alerts
      const failedTickets = employeeTickets.filter(t =>
        t.routingDecision === TICKET_ROUTING.CVU_ESCALATION ||
        (t.status === 'rejected' && t.overallScore < 50)
      );

      for (const ticket of failedTickets.slice(0, 2)) { // Max 2 per employee
        const accessEvent = await AccessEvent.findById(ticket.accessEventId).lean();
        if (accessEvent) {
          alerts.push(generateAlertForTicketFailure(ticket, employee, accessEvent));
        }
      }
    }

    if (alerts.length > 0) {
      await Alert.insertMany(alerts);
      console.log(`  ✓ Created ${alerts.length} alerts`);

      // Count by severity
      const criticalCount = alerts.filter(a => a.severity === ALERT_SEVERITY.CRITICAL).length;
      const highCount = alerts.filter(a => a.severity === ALERT_SEVERITY.HIGH).length;
      const mediumCount = alerts.filter(a => a.severity === ALERT_SEVERITY.MEDIUM).length;

      console.log(`    - Critical: ${criticalCount}, High: ${highCount}, Medium: ${mediumCount}`);
    } else {
      console.log('  ✓ No alerts generated');
    }

    return alerts;
  } catch (error) {
    console.error('  ✗ Error generating alerts:', error.message);
    throw error;
  }
};

export default seedAlerts;
