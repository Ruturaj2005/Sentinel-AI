import Pattern from '../models/Pattern.js';
import AccessEvent from '../models/AccessEvent.js';
import { PATTERN_TYPES, PATTERN_STATUS, ALERT_SEVERITY, ACTIONS } from '../config/constants.js';

const detectPatterns = async (employee, employeeEvents) => {
  const patterns = [];
  const profile = employee.name === 'Ramesh Kumar' ? 'reconnaissance' :
                  employee.name === 'Vikram Singh' ? 'data_exfiltration' : 'normal';

  // Skip pattern detection for normal low-risk employees
  if (profile === 'normal' && employee.currentRiskScore < 40) {
    return patterns;
  }

  // Reconnaissance Pattern Detection
  const recentEvents = employeeEvents.slice(-500); // Last 500 events
  const failedLogins = recentEvents.filter(e => e.action === ACTIONS.LOGIN && e.anomalyScore > 60);
  const crossDeptAccess = recentEvents.filter(e =>
    !['CoreBanking', 'CRM', 'Email'].includes(e.system) &&
    e.system !== getSystemForDepartment(employee.department)
  );
  const offHoursAccess = recentEvents.filter(e => {
    const hour = e.timestamp.getHours();
    return hour < 7 || hour > 19;
  });

  const rapidSystemSwitches = detectRapidSystemSwitching(recentEvents);

  if (profile === 'reconnaissance' || (failedLogins.length > 3 && crossDeptAccess.length > 10)) {
    patterns.push({
      employeeId: employee._id,
      patternType: PATTERN_TYPES.RECONNAISSANCE,
      flags: {
        multipleFailedLogins: failedLogins.length > 3,
        unusualTimeAccess: offHoursAccess.length > 20,
        crossDepartmentAccess: crossDeptAccess.length > 10,
        bulkDownloads: false,
        sensitiveDataAccess: true,
        rapidSystemSwitching: rapidSystemSwitches > 15
      },
      detectedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Within last week
      evidence: [
        ...failedLogins.slice(0, 3).map(e => ({
          accessEventId: e._id,
          reason: 'Multiple failed login attempts'
        })),
        ...crossDeptAccess.slice(0, 3).map(e => ({
          accessEventId: e._id,
          reason: 'Cross-department system access'
        }))
      ],
      severity: ALERT_SEVERITY.HIGH,
      status: PATTERN_STATUS.ACTIVE
    });
  }

  // Data Hoarding/Exfiltration Pattern Detection
  const bulkDownloads = recentEvents.filter(e =>
    (e.action === ACTIONS.DOWNLOAD || e.action === ACTIONS.EXPORT) &&
    e.volumeAccessed > 50
  );
  const sensitiveData = recentEvents.filter(e =>
    ['customer_data', 'credit_report', 'transaction'].includes(e.resourceType)
  );

  if (profile === 'data_exfiltration' || (bulkDownloads.length > 15 && sensitiveData.length > 50)) {
    patterns.push({
      employeeId: employee._id,
      patternType: PATTERN_TYPES.DATA_HOARDING,
      flags: {
        multipleFailedLogins: false,
        unusualTimeAccess: offHoursAccess.length > 30,
        crossDepartmentAccess: false,
        bulkDownloads: bulkDownloads.length > 15,
        sensitiveDataAccess: sensitiveData.length > 50,
        rapidSystemSwitching: false
      },
      detectedAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000), // Within last 5 days
      evidence: bulkDownloads.slice(0, 5).map(e => ({
        accessEventId: e._id,
        reason: 'Bulk data download or export'
      })),
      severity: ALERT_SEVERITY.CRITICAL,
      status: PATTERN_STATUS.ACTIVE
    });
  }

  // Off-Hours Pattern Detection
  if (offHoursAccess.length > 40) {
    patterns.push({
      employeeId: employee._id,
      patternType: PATTERN_TYPES.OFF_HOURS,
      flags: {
        multipleFailedLogins: false,
        unusualTimeAccess: true,
        crossDepartmentAccess: false,
        bulkDownloads: false,
        sensitiveDataAccess: offHoursAccess.some(e =>
          ['customer_data', 'credit_report'].includes(e.resourceType)
        ),
        rapidSystemSwitching: false
      },
      detectedAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
      evidence: offHoursAccess.slice(0, 5).map(e => ({
        accessEventId: e._id,
        reason: `Access at ${e.timestamp.getHours()}:00 (off-hours)`
      })),
      severity: offHoursAccess.length > 70 ? ALERT_SEVERITY.HIGH : ALERT_SEVERITY.MEDIUM,
      status: PATTERN_STATUS.ACTIVE
    });
  }

  return patterns;
};

const getSystemForDepartment = (department) => {
  const map = {
    'Loans': 'Loans',
    'Credit': 'Credit',
    'Treasury': 'Treasury',
    'IT Operations': 'CoreBanking'
  };
  return map[department] || 'CoreBanking';
};

const detectRapidSystemSwitching = (events) => {
  let switches = 0;
  for (let i = 1; i < events.length; i++) {
    const timeDiff = events[i].timestamp - events[i - 1].timestamp;
    if (events[i].system !== events[i - 1].system && timeDiff < 60000) { // Less than 1 minute
      switches++;
    }
  }
  return switches;
};

const seedPatterns = async (employees) => {
  try {
    console.log('  Detecting patterns...');

    const allPatterns = [];

    for (const employee of employees) {
      // Get all events for this employee
      const employeeEvents = await AccessEvent.find({ employeeId: employee._id })
        .sort({ timestamp: 1 })
        .lean();

      if (employeeEvents.length > 0) {
        const patterns = await detectPatterns(employee, employeeEvents);
        allPatterns.push(...patterns);
      }
    }

    if (allPatterns.length > 0) {
      await Pattern.insertMany(allPatterns);
      console.log(`  ✓ Created ${allPatterns.length} pattern detections`);
    } else {
      console.log('  ✓ No patterns detected (expected for low-risk employees)');
    }

    return allPatterns;
  } catch (error) {
    console.error('  ✗ Error detecting patterns:', error.message);
    throw error;
  }
};

export default seedPatterns;
