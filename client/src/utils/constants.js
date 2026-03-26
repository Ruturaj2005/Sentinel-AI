export const ROLES = {
  EMPLOYEE: 'employee',
  MANAGER: 'manager',
  INVESTIGATOR: 'investigator'
};

export const ROLE_LABELS = {
  [ROLES.EMPLOYEE]: 'Employee',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.INVESTIGATOR]: 'CVU Investigator'
};

export const ROLE_NAVIGATION = {
  [ROLES.EMPLOYEE]: [
    { label: 'Dashboard', path: '/employee/dashboard', icon: 'home' },
    { label: 'My Access History', path: '/employee/access-history', icon: 'clock' },
    { label: 'My Tickets', path: '/employee/tickets', icon: 'ticket' }
  ],
  [ROLES.MANAGER]: [
    { label: 'Dashboard', path: '/manager/dashboard', icon: 'home' },
    { label: 'Team Alerts', path: '/manager/alerts', icon: 'alert' },
    { label: 'Pending Approvals', path: '/manager/approvals', icon: 'check' },
    { label: 'Team Overview', path: '/manager/team', icon: 'users' }
  ],
  [ROLES.INVESTIGATOR]: [
    { label: 'Dashboard', path: '/investigator/dashboard', icon: 'home' },
    { label: 'Employee Risk Monitor', path: '/investigator/employees', icon: 'users' },
    { label: 'Active Alerts', path: '/investigator/alerts', icon: 'alert' },
    { label: 'Ticket Queue', path: '/investigator/tickets', icon: 'ticket' },
    { label: 'Reconnaissance Patterns', path: '/investigator/patterns', icon: 'chart' },
    { label: 'Reports', path: '/investigator/reports', icon: 'document' },
    { type: 'divider', label: 'Tools' },
    { label: 'NLP Ticket Scorer', path: '/investigator/tools/nlp-scorer', icon: 'tool' },
    { label: 'Baseline Comparison', path: '/investigator/tools/baseline-comparison', icon: 'chart' }
  ]
};

export const ALERT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

export const ALERT_STATUS = {
  ACTIVE: 'active',
  ACKNOWLEDGED: 'acknowledged',
  INVESTIGATING: 'investigating',
  RESOLVED: 'resolved'
};

export const TICKET_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ESCALATED: 'escalated',
  RESOLVED: 'resolved'
};

export const SEVERITY_COLORS = {
  [ALERT_SEVERITY.CRITICAL]: {
    bg: 'bg-danger-100',
    text: 'text-danger-700',
    border: 'border-danger-300',
    badge: 'badge-danger'
  },
  [ALERT_SEVERITY.HIGH]: {
    bg: 'bg-warning-100',
    text: 'text-warning-700',
    border: 'border-warning-300',
    badge: 'badge-warning'
  },
  [ALERT_SEVERITY.MEDIUM]: {
    bg: 'bg-accent-100',
    text: 'text-accent-700',
    border: 'border-accent-300',
    badge: 'badge-info'
  },
  [ALERT_SEVERITY.LOW]: {
    bg: 'bg-neutral-100',
    text: 'text-neutral-700',
    border: 'border-neutral-300',
    badge: 'badge-neutral'
  }
};

export const STATUS_COLORS = {
  [ALERT_STATUS.ACTIVE]: 'badge-danger',
  [ALERT_STATUS.ACKNOWLEDGED]: 'badge-warning',
  [ALERT_STATUS.INVESTIGATING]: 'badge-info',
  [ALERT_STATUS.RESOLVED]: 'badge-success',
  [TICKET_STATUS.PENDING]: 'badge-warning',
  [TICKET_STATUS.APPROVED]: 'badge-success',
  [TICKET_STATUS.REJECTED]: 'badge-danger',
  [TICKET_STATUS.ESCALATED]: 'badge-danger',
  [TICKET_STATUS.RESOLVED]: 'badge-success'
};

export const RISK_SCORE_THRESHOLDS = {
  CRITICAL: 85,
  HIGH: 70,
  MEDIUM: 50,
  LOW: 30
};

export const getRiskLevel = (score) => {
  if (score >= RISK_SCORE_THRESHOLDS.CRITICAL) return 'critical';
  if (score >= RISK_SCORE_THRESHOLDS.HIGH) return 'high';
  if (score >= RISK_SCORE_THRESHOLDS.MEDIUM) return 'medium';
  if (score >= RISK_SCORE_THRESHOLDS.LOW) return 'low';
  return 'minimal';
};

export const getRiskColor = (score) => {
  const level = getRiskLevel(score);
  const colors = {
    critical: 'text-danger-600',
    high: 'text-warning-600',
    medium: 'text-accent-600',
    low: 'text-success-600',
    minimal: 'text-neutral-500'
  };
  return colors[level];
};

export const getRiskBadge = (score) => {
  const level = getRiskLevel(score);
  const badges = {
    critical: 'badge-danger',
    high: 'badge-warning',
    medium: 'badge-info',
    low: 'badge-success',
    minimal: 'badge-neutral'
  };
  return badges[level];
};
