require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/user.model');

async function seedGovernmentUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const govUsers = [
      {
        email: 'state.admin@jharkhand.gov.in',
        full_name: 'State Nodal Officer',
        role: 'government',
        organization: 'Government of Jharkhand',
        password: 'mock-login-not-a-secret'
      },
      {
        email: 'dc.ranchi@jharkhand.gov.in',
        full_name: 'District Collector / Magistrate',
        role: 'government',
        organization: 'District Administration',
        district: 'Ranchi',
        password: 'mock-login-not-a-secret'
      },
      {
        email: 'dept.health@jharkhand.gov.in',
        full_name: 'Department Secretary',
        role: 'government',
        organization: 'Department of Health',
        password: 'mock-login-not-a-secret'
      }
    ];

    for (const u of govUsers) {
      const existing = await User.findOne({ email: u.email });
      if (existing) {
        console.log(`User ${u.email} already exists.`);
        continue;
      }

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(u.password, salt);

      await User.create({
        full_name: u.full_name,
        email: u.email,
        role: u.role,
        organization: u.organization,
        district: u.district || null,
        password_hash
      });
      console.log(`Successfully seeded ${u.email}`);
    }

  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seedGovernmentUsers();
