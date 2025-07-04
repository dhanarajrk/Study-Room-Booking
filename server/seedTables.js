//admin/dev file to create tables in mongoDB 

import mongoose from 'mongoose';
import Table from './models/Table.js';
import dotenv from 'dotenv';

dotenv.config();

const seedTables = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const tables = Array.from({ length: 30 }, (_, i) => ({
    tableNumber: i + 1,
    hourlyRate: 30, // Rs. 30 per hour
    isAvailable: true
  }));

  await Table.deleteMany({});
  await Table.insertMany(tables);
  console.log('30 tables seeded successfully!');
  process.exit();
};

seedTables().catch(console.error);