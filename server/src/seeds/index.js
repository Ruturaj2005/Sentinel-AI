import mongoose from 'mongoose';
import connectDatabase from '../config/database.js';
import Employee from '../models/Employee.js';
import AccessEvent from '../models/AccessEvent.js';
import Ticket from '../models/Ticket.js';
import Pattern from '../models/Pattern.js';
import Alert from '../models/Alert.js';

import seedEmployees from './employeeSeeder.js';
import seedAccessEvents from './accessEventSeeder.js';
import seedPatterns from './patternSeeder.js';
import seedTickets from './ticketSeeder.js';
import seedAlerts from './alertSeeder.js';

const clearDatabase = async () => {
  console.log('\n🗑️  Clearing existing data...');
  await Employee.deleteMany({});
  await AccessEvent.deleteMany({});
  await Ticket.deleteMany({});
  await Pattern.deleteMany({});
  await Alert.deleteMany({});
  console.log('✓ Database cleared\n');
};

const createIndexes = async () => {
  console.log('\n📇 Creating database indexes...');

  await Employee.createIndexes();
  await AccessEvent.createIndexes();
  await Ticket.createIndexes();
  await Pattern.createIndexes();
  await Alert.createIndexes();

  console.log('✓ Indexes created\n');
};

const seedDatabase = async () => {
  try {
    console.log('\n🌱 Starting Sentinel Database Seeding...\n');
    console.log('═'.repeat(50));

    const startTime = Date.now();

    // Connect to database
    await connectDatabase();

    // Clear existing data
    await clearDatabase();

    // Seed in sequence (order matters due to relationships)
    console.log('Phase 1: Creating Employees');
    console.log('─'.repeat(50));
    const employees = await seedEmployees();

    console.log('\nPhase 2: Generating Access Events (90 days)');
    console.log('─'.repeat(50));
    await seedAccessEvents(employees);

    console.log('\nPhase 3: Detecting Patterns');
    console.log('─'.repeat(50));
    await seedPatterns(employees);

    console.log('\nPhase 4: Generating Tickets');
    console.log('─'.repeat(50));
    await seedTickets(employees);

    console.log('\nPhase 5: Generating Alerts');
    console.log('─'.repeat(50));
    await seedAlerts(employees);

    // Create indexes for performance
    await createIndexes();

    // Summary statistics
    console.log('📊 Database Summary:');
    console.log('═'.repeat(50));
    const stats = {
      employees: await Employee.countDocuments(),
      accessEvents: await AccessEvent.countDocuments(),
      tickets: await Ticket.countDocuments(),
      patterns: await Pattern.countDocuments(),
      alerts: await Alert.countDocuments()
    };

    console.log(`Employees:     ${stats.employees.toLocaleString()}`);
    console.log(`Access Events: ${stats.accessEvents.toLocaleString()}`);
    console.log(`Tickets:       ${stats.tickets.toLocaleString()}`);
    console.log(`Patterns:      ${stats.patterns.toLocaleString()}`);
    console.log(`Alerts:        ${stats.alerts.toLocaleString()}`);

    // High-risk employees
    console.log('\n🚨 High-Risk Employees:');
    console.log('═'.repeat(50));
    const highRiskEmployees = await Employee.find({ currentRiskScore: { $gte: 70 } })
      .select('name employeeId department currentRiskScore')
      .sort({ currentRiskScore: -1 });

    for (const emp of highRiskEmployees) {
      const alertCount = await Alert.countDocuments({ employeeId: emp._id });
      console.log(`${emp.name} (${emp.employeeId})`);
      console.log(`  Risk Score: ${emp.currentRiskScore} | Alerts: ${alertCount} | Dept: ${emp.department}`);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n═'.repeat(50));
    console.log(`✅ Database seeding completed in ${elapsed}s\n`);
    console.log('🎯 You can now start the server and access the application\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run seeding
seedDatabase();
