import AccessEvent from '../models/AccessEvent.js';
import { SYSTEMS, ACTIONS, RESOURCE_TYPES } from '../config/constants.js';

const getEmployeeProfile = (employee) => {
  if (employee.name === 'Ramesh Kumar') return 'reconnaissance';
  if (employee.name === 'Vikram Singh') return 'data_exfiltration';
  return 'normal';
};

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const randomElement = (array) => array[Math.floor(Math.random() * array.length)];

const generateIpAddress = () => {
  return `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`;
};

const generateDeviceId = (employeeName) => {
  const prefix = employeeName.split(' ')[0].toLowerCase();
  return `${prefix}-laptop-${randomInt(1000, 9999)}`;
};

const generateTimestamp = (dayOffset, profile, hour = null) => {
  const date = new Date();
  date.setDate(date.getDate() - dayOffset);

  if (hour !== null) {
    date.setHours(hour, randomInt(0, 59), randomInt(0, 59));
  } else {
    // Normal employees: 9 AM to 6 PM
    if (profile === 'normal') {
      date.setHours(randomInt(9, 18), randomInt(0, 59), randomInt(0, 59));
    }
    // Suspicious employees: include off-hours
    else {
      const offHours = Math.random() < 0.3; // 30% off-hours
      if (offHours) {
        const hour = Math.random() < 0.5 ? randomInt(20, 23) : randomInt(0, 6);
        date.setHours(hour, randomInt(0, 59), randomInt(0, 59));
      } else {
        date.setHours(randomInt(9, 18), randomInt(0, 59), randomInt(0, 59));
      }
    }
  }

  return date;
};

const selectSystem = (department, profile) => {
  const systemsByDept = {
    'Loans': [SYSTEMS.LOANS, SYSTEMS.CORE_BANKING, SYSTEMS.DOCUMENT_MANAGEMENT],
    'Credit': [SYSTEMS.CREDIT, SYSTEMS.CORE_BANKING, SYSTEMS.CRM],
    'Customer Service': [SYSTEMS.CRM, SYSTEMS.CORE_BANKING],
    'IT Operations': [SYSTEMS.CORE_BANKING, SYSTEMS.TREASURY, SYSTEMS.DOCUMENT_MANAGEMENT],
    'Treasury': [SYSTEMS.TREASURY, SYSTEMS.CORE_BANKING],
    'Compliance': [SYSTEMS.DOCUMENT_MANAGEMENT, SYSTEMS.CORE_BANKING, SYSTEMS.CRM],
    'Risk Management': [SYSTEMS.CORE_BANKING, SYSTEMS.TREASURY, SYSTEMS.CREDIT],
    'Branch Operations': [SYSTEMS.CORE_BANKING, SYSTEMS.CRM, SYSTEMS.DOCUMENT_MANAGEMENT]
  };

  const primarySystems = systemsByDept[department] || [SYSTEMS.CORE_BANKING];

  // Suspicious employees access cross-department systems
  if (profile !== 'normal' && Math.random() < 0.2) {
    return randomElement(Object.values(SYSTEMS));
  }

  return randomElement(primarySystems);
};

const selectAction = (profile) => {
  if (profile === 'data_exfiltration' && Math.random() < 0.3) {
    return randomElement([ACTIONS.DOWNLOAD, ACTIONS.EXPORT]);
  }

  if (profile === 'reconnaissance' && Math.random() < 0.2) {
    return ACTIONS.VIEW;
  }

  return randomElement([ACTIONS.LOGIN, ACTIONS.VIEW, ACTIONS.DOWNLOAD, ACTIONS.MODIFY]);
};

const selectResourceType = (system) => {
  const resourcesBySystem = {
    [SYSTEMS.CORE_BANKING]: [RESOURCE_TYPES.ACCOUNT, RESOURCE_TYPES.TRANSACTION],
    [SYSTEMS.CRM]: [RESOURCE_TYPES.CUSTOMER_DATA],
    [SYSTEMS.DOCUMENT_MANAGEMENT]: [RESOURCE_TYPES.DOCUMENT],
    [SYSTEMS.LOANS]: [RESOURCE_TYPES.LOAN_APPLICATION, RESOURCE_TYPES.DOCUMENT],
    [SYSTEMS.CREDIT]: [RESOURCE_TYPES.CREDIT_REPORT, RESOURCE_TYPES.CUSTOMER_DATA],
    [SYSTEMS.TREASURY]: [RESOURCE_TYPES.TRANSACTION, RESOURCE_TYPES.ACCOUNT]
  };

  const resources = resourcesBySystem[system] || [RESOURCE_TYPES.DOCUMENT];
  return randomElement(resources);
};

const generateVolume = (action, profile) => {
  if (action === ACTIONS.LOGIN) return 1;

  if (profile === 'data_exfiltration') {
    if (action === ACTIONS.DOWNLOAD || action === ACTIONS.EXPORT) {
      return randomInt(50, 500); // Bulk downloads
    }
  }

  if (action === ACTIONS.VIEW && profile === 'reconnaissance') {
    return randomInt(20, 100); // High volume views
  }

  return randomInt(1, 20); // Normal
};

const calculateAnomalyScore = (event, dayOffset, profile) => {
  let score = 0;

  // Off-hours access
  const hour = event.timestamp.getHours();
  if (hour < 7 || hour > 19) {
    score += 25;
  }

  // High volume
  if (event.volumeAccessed > 50) {
    score += 30;
  } else if (event.volumeAccessed > 20) {
    score += 15;
  }

  // Bulk downloads/exports
  if (event.action === ACTIONS.DOWNLOAD || event.action === ACTIONS.EXPORT) {
    if (event.volumeAccessed > 100) {
      score += 25;
    }
  }

  // Profile-specific scoring
  if (profile === 'reconnaissance') {
    // Gradually increase over 90 days
    const progression = (90 - dayOffset) / 90;
    score += Math.floor(progression * 30);
  } else if (profile === 'data_exfiltration') {
    // Spike in last 30 days
    if (dayOffset <= 30) {
      const progression = (30 - dayOffset) / 30;
      score += Math.floor(progression * 40);
    }
  } else {
    // Normal employees: low anomaly
    score = Math.min(score, 30);
  }

  return Math.min(100, Math.max(0, score + randomInt(-5, 5)));
};

const generateAnomalyReasons = (event, anomalyScore) => {
  const reasons = [];

  const hour = event.timestamp.getHours();
  if (hour < 7 || hour > 19) {
    reasons.push('Off-hours access detected');
  }

  if (event.volumeAccessed > 100) {
    reasons.push('Unusually high volume accessed');
  }

  if (event.action === ACTIONS.DOWNLOAD && event.volumeAccessed > 50) {
    reasons.push('Bulk download detected');
  }

  if (event.action === ACTIONS.EXPORT) {
    reasons.push('Data export operation');
  }

  if (anomalyScore > 70) {
    reasons.push('Critical risk threshold exceeded');
  }

  return reasons;
};

const seedAccessEvents = async (employees) => {
  try {
    console.log('  Seeding access events...');

    const events = [];
    const DAYS = 90;

    for (const employee of employees) {
      const profile = getEmployeeProfile(employee);
      const eventsPerDay = profile === 'normal' ? randomInt(30, 80) : randomInt(80, 150);

      for (let day = 0; day < DAYS; day++) {
        const dailyEvents = randomInt(eventsPerDay - 20, eventsPerDay + 20);

        for (let i = 0; i < dailyEvents; i++) {
          const system = selectSystem(employee.department, profile);
          const action = selectAction(profile);
          const resourceType = selectResourceType(system);
          const volumeAccessed = generateVolume(action, profile);

          const event = {
            employeeId: employee._id,
            timestamp: generateTimestamp(day, profile),
            system,
            action,
            resourceType,
            resourceId: `RES-${randomInt(10000, 99999)}`,
            volumeAccessed,
            location: employee.branch,
            ipAddress: generateIpAddress(),
            deviceId: generateDeviceId(employee.name),
            anomalyScore: 0 // Will calculate after
          };

          event.anomalyScore = calculateAnomalyScore(event, day, profile);
          event.anomalyReasons = generateAnomalyReasons(event, event.anomalyScore);

          events.push(event);
        }
      }
    }

    // Sort events by timestamp
    events.sort((a, b) => a.timestamp - b.timestamp);

    // Batch insert for performance
    const BATCH_SIZE = 1000;
    let inserted = 0;

    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      const batch = events.slice(i, i + BATCH_SIZE);
      await AccessEvent.insertMany(batch);
      inserted += batch.length;
      console.log(`    - Inserted ${inserted}/${events.length} events...`);
    }

    console.log(`  ✓ Created ${events.length} access events`);

    return events;
  } catch (error) {
    console.error('  ✗ Error seeding access events:', error.message);
    throw error;
  }
};

export default seedAccessEvents;
