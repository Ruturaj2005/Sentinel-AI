export const ROLES = {
  EMPLOYEE: 'employee',
  MANAGER: 'manager',
  INVESTIGATOR: 'investigator'
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

export const TICKET_ROUTING = {
  AUTO_RESOLVE: 'auto_resolve',
  MANAGER_REVIEW: 'manager_review',
  CVU_ESCALATION: 'cvu_escalation'
};

export const PATTERN_TYPES = {
  RECONNAISSANCE: 'reconnaissance',
  DATA_HOARDING: 'data_hoarding',
  OFF_HOURS: 'off_hours',
  UNUSUAL_SYSTEM: 'unusual_system'
};

export const PATTERN_STATUS = {
  ACTIVE: 'active',
  INVESTIGATING: 'investigating',
  RESOLVED: 'resolved',
  FALSE_POSITIVE: 'false_positive'
};

export const SYSTEMS = {
  CORE_BANKING: 'CoreBanking',
  CRM: 'CRM',
  DOCUMENT_MANAGEMENT: 'DocumentManagement',
  EMAIL: 'Email',
  TREASURY: 'Treasury',
  LOANS: 'Loans',
  CREDIT: 'Credit'
};

export const ACTIONS = {
  LOGIN: 'login',
  VIEW: 'view',
  DOWNLOAD: 'download',
  MODIFY: 'modify',
  DELETE: 'delete',
  EXPORT: 'export'
};

export const RESOURCE_TYPES = {
  ACCOUNT: 'account',
  CUSTOMER_DATA: 'customer_data',
  TRANSACTION: 'transaction',
  DOCUMENT: 'document',
  LOAN_APPLICATION: 'loan_application',
  CREDIT_REPORT: 'credit_report'
};

export const DEPARTMENTS = {
  LOANS: 'Loans',
  CREDIT: 'Credit',
  CUSTOMER_SERVICE: 'Customer Service',
  IT_OPERATIONS: 'IT Operations',
  TREASURY: 'Treasury',
  COMPLIANCE: 'Compliance',
  RISK_MANAGEMENT: 'Risk Management',
  BRANCH_OPERATIONS: 'Branch Operations'
};

export const BRANCHES = {
  MUMBAI_CENTRAL: 'Mumbai Central',
  DELHI_SOUTH: 'Delhi South',
  BANGALORE_TECH_PARK: 'Bangalore Tech Park',
  PUNE_CAMP: 'Pune Camp',
  CHENNAI_ANNA_NAGAR: 'Chennai Anna Nagar',
  KOLKATA_SALT_LAKE: 'Kolkata Salt Lake',
  HYDERABAD_GACHIBOWLI: 'Hyderabad Gachibowli',
  AHMEDABAD_SATELLITE: 'Ahmedabad Satellite'
};
