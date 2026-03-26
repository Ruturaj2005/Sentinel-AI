import Ticket from '../models/Ticket.js';
import AccessEvent from '../models/AccessEvent.js';
import Employee from '../models/Employee.js';
import { TICKET_STATUS, TICKET_ROUTING } from '../config/constants.js';

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateTicketText = (event, employee) => {
  const templates = {
    off_hours: [
      `I was working late to complete urgent ${employee.department} tasks. The ${event.system} system needed updates for client deliverables.`,
      `Evening access was necessary due to project deadlines in ${employee.department}. I needed to access ${event.resourceType} data.`,
      `Working remotely after hours to finish pending work. Required ${event.system} access for completing reports.`
    ],
    bulk_download: [
      `Downloading multiple files for quarterly audit preparation in ${employee.department}.`,
      `Required batch export of ${event.resourceType} records for management reporting.`,
      `Legitimate business need to download data for analysis and presentation to senior management.`
    ],
    cross_system: [
      `Accessing ${event.system} as part of cross-functional project collaboration.`,
      `Required access to verify data consistency across systems for compliance check.`,
      `Working with team from other department, needed to reference their system data.`
    ],
    generic: [
      `Normal work activity. Accessing required system for daily tasks.`,
      `Standard operations within my role as ${employee.position}.`,
      `Routine work in ${employee.department}. All access is work-related.`
    ]
  };

  let category = 'generic';
  const hour = event.timestamp.getHours();

  if (hour < 7 || hour > 19) {
    category = 'off_hours';
  } else if (event.volumeAccessed > 50) {
    category = 'bulk_download';
  } else if (Math.random() < 0.3) {
    category = 'cross_system';
  }

  const options = templates[category];
  return options[randomInt(0, options.length - 1)];
};

const calculateCheckScores = (anomalyScore, employee) => {
  // Base scores - lower anomaly = higher scores
  const baseFactor = (100 - anomalyScore) / 100;

  // Suspicious employees get lower scores
  const suspiciousPenalty = employee.currentRiskScore > 70 ? 0.8 : 1.0;

  const relevanceScore = Math.floor((randomInt(50, 95) * baseFactor) * suspiciousPenalty);
  const coherenceScore = Math.floor((randomInt(55, 90) * baseFactor) * suspiciousPenalty);
  const specificityScore = Math.floor((randomInt(40, 85) * baseFactor) * suspiciousPenalty);
  const timelinessScore = Math.floor(randomInt(60, 95) * suspiciousPenalty);
  const consistencyScore = Math.floor((randomInt(45, 90) * baseFactor) * suspiciousPenalty);

  return {
    relevanceScore: Math.max(20, Math.min(100, relevanceScore)),
    coherenceScore: Math.max(20, Math.min(100, coherenceScore)),
    specificityScore: Math.max(20, Math.min(100, specificityScore)),
    timelinessScore: Math.max(20, Math.min(100, timelinessScore)),
    consistencyScore: Math.max(20, Math.min(100, consistencyScore))
  };
};

const calculateOverallScore = (checkScores) => {
  const sum = Object.values(checkScores).reduce((a, b) => a + b, 0);
  return Math.floor(sum / 5);
};

const determineRouting = (overallScore, anomalyScore) => {
  if (overallScore > 75 && anomalyScore < 50) {
    return TICKET_ROUTING.AUTO_RESOLVE;
  } else if (overallScore > 45 && anomalyScore < 75) {
    return TICKET_ROUTING.MANAGER_REVIEW;
  } else {
    return TICKET_ROUTING.CVU_ESCALATION;
  }
};

const determineStatus = (routing) => {
  if (routing === TICKET_ROUTING.AUTO_RESOLVE) {
    return Math.random() < 0.9 ? TICKET_STATUS.RESOLVED : TICKET_STATUS.APPROVED;
  } else if (routing === TICKET_ROUTING.MANAGER_REVIEW) {
    const rand = Math.random();
    if (rand < 0.5) return TICKET_STATUS.APPROVED;
    if (rand < 0.7) return TICKET_STATUS.PENDING;
    return TICKET_STATUS.REJECTED;
  } else {
    const rand = Math.random();
    if (rand < 0.3) return TICKET_STATUS.ESCALATED;
    if (rand < 0.6) return TICKET_STATUS.PENDING;
    return TICKET_STATUS.INVESTIGATING;
  }
};

const seedTickets = async (employees) => {
  try {
    console.log('  Generating tickets...');

    const tickets = [];
    let ticketCounter = 1000;

    for (const employee of employees) {
      // Get high anomaly events for this employee
      const anomalousEvents = await AccessEvent.find({
        employeeId: employee._id,
        anomalyScore: { $gte: 50 }
      }).sort({ anomalyScore: -1 }).limit(20).lean();

      // Generate tickets for subset of anomalous events
      const eventsToTicket = anomalousEvents.slice(0, randomInt(3, Math.min(10, anomalousEvents.length)));

      for (const event of eventsToTicket) {
        const checkScores = calculateCheckScores(event.anomalyScore, employee);
        const overallScore = calculateOverallScore(checkScores);
        const routingDecision = determineRouting(overallScore, event.anomalyScore);
        const status = determineStatus(routingDecision);

        // Response time: suspicious employees take longer
        const minResponse = employee.currentRiskScore > 70 ? 60 : 10;
        const maxResponse = employee.currentRiskScore > 70 ? 720 : 360;
        const responseTime = randomInt(minResponse, maxResponse);

        const ticketId = `TKT-${new Date().getFullYear()}-${String(ticketCounter++).padStart(6, '0')}`;

        tickets.push({
          ticketId,
          employeeId: employee._id,
          accessEventId: event._id,
          text: generateTicketText(event, employee),
          checkScores,
          overallScore,
          responseTime,
          routingDecision,
          status,
          reviewedBy: null, // Could link to manager in future
          reviewNotes: status === TICKET_STATUS.REJECTED ? 'Insufficient explanation provided' :
                       status === TICKET_STATUS.APPROVED ? 'Explanation accepted' : ''
        });
      }
    }

    if (tickets.length > 0) {
      await Ticket.insertMany(tickets);
      console.log(`  ✓ Created ${tickets.length} tickets`);
    } else {
      console.log('  ✓ No tickets generated');
    }

    return tickets;
  } catch (error) {
    console.error('  ✗ Error generating tickets:', error.message);
    throw error;
  }
};

export default seedTickets;
