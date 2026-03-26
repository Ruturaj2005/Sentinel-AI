import Employee from '../models/Employee.js';
import { ROLES, DEPARTMENTS, BRANCHES } from '../config/constants.js';

const suspiciousEmployees = [
  {
    name: 'Ramesh Kumar',
    employeeId: 'UBI-2021-0147',
    email: 'ramesh.kumar@unionbank.in',
    role: ROLES.EMPLOYEE,
    branch: BRANCHES.MUMBAI_CENTRAL,
    department: DEPARTMENTS.LOANS,
    position: 'Loans Officer',
    currentRiskScore: 87,
    profile: 'reconnaissance'
  },
  {
    name: 'Priya Sharma',
    employeeId: 'UBI-2022-0089',
    email: 'priya.sharma@unionbank.in',
    role: ROLES.EMPLOYEE,
    branch: BRANCHES.DELHI_SOUTH,
    department: DEPARTMENTS.CREDIT,
    position: 'Credit Manager',
    currentRiskScore: 12,
    profile: 'normal'
  },
  {
    name: 'Vikram Singh',
    employeeId: 'UBI-2020-0203',
    email: 'vikram.singh@unionbank.in',
    role: ROLES.EMPLOYEE,
    branch: BRANCHES.BANGALORE_TECH_PARK,
    department: DEPARTMENTS.IT_OPERATIONS,
    position: 'Treasury Officer',
    currentRiskScore: 94,
    profile: 'data_exfiltration'
  }
];

const normalEmployees = [
  { name: 'Anjali Desai', department: DEPARTMENTS.CUSTOMER_SERVICE, position: 'Customer Service Executive', branch: BRANCHES.MUMBAI_CENTRAL, role: ROLES.EMPLOYEE },
  { name: 'Rajesh Patel', department: DEPARTMENTS.BRANCH_OPERATIONS, position: 'Branch Manager', branch: BRANCHES.AHMEDABAD_SATELLITE, role: ROLES.MANAGER },
  { name: 'Sunita Iyer', department: DEPARTMENTS.COMPLIANCE, position: 'Compliance Officer', branch: BRANCHES.CHENNAI_ANNA_NAGAR, role: ROLES.EMPLOYEE },
  { name: 'Amit Verma', department: DEPARTMENTS.RISK_MANAGEMENT, position: 'Risk Analyst', branch: BRANCHES.DELHI_SOUTH, role: ROLES.MANAGER },
  { name: 'Kavita Reddy', department: DEPARTMENTS.LOANS, position: 'Loan Processing Officer', branch: BRANCHES.HYDERABAD_GACHIBOWLI, role: ROLES.EMPLOYEE },
  { name: 'Sanjay Mehta', department: DEPARTMENTS.TREASURY, position: 'Treasury Manager', branch: BRANCHES.MUMBAI_CENTRAL, role: ROLES.MANAGER },
  { name: 'Meera Nair', department: DEPARTMENTS.CREDIT, position: 'Credit Analyst', branch: BRANCHES.BANGALORE_TECH_PARK, role: ROLES.EMPLOYEE },
  { name: 'Deepak Joshi', department: DEPARTMENTS.IT_OPERATIONS, position: 'IT Support Specialist', branch: BRANCHES.PUNE_CAMP, role: ROLES.EMPLOYEE },
  { name: 'Pooja Kapoor', department: DEPARTMENTS.CUSTOMER_SERVICE, position: 'Customer Relations Manager', branch: BRANCHES.DELHI_SOUTH, role: ROLES.MANAGER },
  { name: 'Arjun Bose', department: DEPARTMENTS.COMPLIANCE, position: 'CVU Investigator', branch: BRANCHES.MUMBAI_CENTRAL, role: ROLES.INVESTIGATOR },
  { name: 'Neha Gupta', department: DEPARTMENTS.BRANCH_OPERATIONS, position: 'Operations Officer', branch: BRANCHES.KOLKATA_SALT_LAKE, role: ROLES.EMPLOYEE },
  { name: 'Rahul Tripathi', department: DEPARTMENTS.LOANS, position: 'Senior Loan Officer', branch: BRANCHES.PUNE_CAMP, role: ROLES.EMPLOYEE },
  { name: 'Lakshmi Krishnan', department: DEPARTMENTS.CREDIT, position: 'Credit Manager', branch: BRANCHES.CHENNAI_ANNA_NAGAR, role: ROLES.MANAGER },
  { name: 'Manish Agarwal', department: DEPARTMENTS.TREASURY, position: 'Treasury Analyst', branch: BRANCHES.MUMBAI_CENTRAL, role: ROLES.EMPLOYEE },
  { name: 'Divya Menon', department: DEPARTMENTS.RISK_MANAGEMENT, position: 'Risk Manager', branch: BRANCHES.BANGALORE_TECH_PARK, role: ROLES.EMPLOYEE },
  { name: 'Karthik Subramanian', department: DEPARTMENTS.IT_OPERATIONS, position: 'IT Manager', branch: BRANCHES.CHENNAI_ANNA_NAGAR, role: ROLES.EMPLOYEE },
  { name: 'Simran Kaur', department: DEPARTMENTS.CUSTOMER_SERVICE, position: 'Customer Service Officer', branch: BRANCHES.DELHI_SOUTH, role: ROLES.EMPLOYEE }
];

const generateRiskScoreHistory = (currentScore, profile) => {
  const history = [];
  const days = 90;

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    let score;
    if (profile === 'normal') {
      // Normal employees: fluctuate between 5-25
      score = Math.floor(Math.random() * 20) + 5;
    } else if (profile === 'reconnaissance') {
      // Ramesh: gradual increase from 20 to 87
      const progress = (days - i) / days;
      score = Math.floor(20 + (67 * progress) + (Math.random() * 10 - 5));
    } else if (profile === 'data_exfiltration') {
      // Vikram: steep increase in last 30 days
      if (i > 30) {
        score = Math.floor(Math.random() * 20) + 15;
      } else {
        const progress = (30 - i) / 30;
        score = Math.floor(35 + (59 * progress) + (Math.random() * 10 - 5));
      }
    } else {
      score = currentScore;
    }

    score = Math.min(100, Math.max(0, score));

    history.push({
      score,
      timestamp: date,
      reason: score > 70 ? 'Pattern detected' : score > 40 ? 'Anomalous activity' : 'Normal activity'
    });
  }

  return history;
};

const seedEmployees = async () => {
  try {
    console.log('  Seeding employees...');

    const employees = [];
    let employeeCounter = 300;

    // Add suspicious employees first
    for (const emp of suspiciousEmployees) {
      const joinDate = new Date();
      joinDate.setFullYear(joinDate.getFullYear() - Math.floor(Math.random() * 3) - 1);

      employees.push({
        ...emp,
        joinDate,
        riskScoreHistory: generateRiskScoreHistory(emp.currentRiskScore, emp.profile)
      });
    }

    // Add normal employees
    for (const emp of normalEmployees) {
      const joinDate = new Date();
      joinDate.setFullYear(joinDate.getFullYear() - Math.floor(Math.random() * 5) - 1);

      const currentRiskScore = Math.floor(Math.random() * 35) + 5; // 5-40

      employees.push({
        employeeId: `UBI-${2019 + Math.floor(Math.random() * 5)}-${String(employeeCounter++).padStart(4, '0')}`,
        email: `${emp.name.toLowerCase().replace(' ', '.')}@unionbank.in`,
        name: emp.name,
        role: emp.role,
        branch: emp.branch,
        department: emp.department,
        position: emp.position,
        joinDate,
        currentRiskScore,
        riskScoreHistory: generateRiskScoreHistory(currentRiskScore, 'normal')
      });
    }

    // Assign supervisors (managers supervise employees in same department)
    const insertedEmployees = await Employee.insertMany(employees);

    const managers = insertedEmployees.filter(e => e.role === ROLES.MANAGER);
    const employeesToUpdate = insertedEmployees.filter(e => e.role === ROLES.EMPLOYEE);

    for (const employee of employeesToUpdate) {
      const suitableManager = managers.find(m => m.department === employee.department);
      if (suitableManager) {
        await Employee.findByIdAndUpdate(employee._id, { supervisor: suitableManager._id });
      }
    }

    console.log(`  ✓ Created ${insertedEmployees.length} employees`);
    console.log(`    - Ramesh Kumar (Risk: 87)`);
    console.log(`    - Priya Sharma (Risk: 12)`);
    console.log(`    - Vikram Singh (Risk: 94)`);

    return insertedEmployees;
  } catch (error) {
    console.error('  ✗ Error seeding employees:', error.message);
    throw error;
  }
};

export default seedEmployees;
