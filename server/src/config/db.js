const mongoose = require('mongoose');

async function connectDB() {
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    dbName: 'fc_scm',
  });

  // Verify replica set / transactions support (required for Atlas)
  try {
    const session = await conn.connection.startSession();
    session.endSession();
  } catch (err) {
    console.error(
      '\n==========================================================\n' +
      'ERROR: MongoDB transactions are not available.\n' +
      'This application requires a MongoDB Atlas cluster (replica set).\n' +
      'Standalone MongoDB instances do not support transactions.\n' +
      'Please use a MongoDB Atlas connection string in MONGO_URI.\n' +
      '==========================================================\n'
    );
    process.exit(1);
  }

  console.log(`MongoDB connected: ${conn.connection.host}`);
  return conn;
}

module.exports = connectDB;
