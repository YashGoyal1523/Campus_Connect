// db.js
// ─────────────────────────────────────────────────────────────────────────────
// This module is responsible for establishing a connection to the MongoDB
// database using Mongoose (an ODM — Object Document Mapper — for MongoDB).
//
// It exports a single async function `connectDB` that is called once at
// server startup (in server.js / index.js) before the Express app starts
// listening for requests.
//
// Design decisions:
//   - The MongoDB connection URI is read from an environment variable (MONGO_URI)
//     rather than being hardcoded. This follows the 12-factor app principle:
//     configuration lives in the environment, not in the code.
//   - The database name "CampusConnect" is appended directly to the URI string.
//     Mongoose will create the database automatically if it doesn't exist.
//   - If the connection fails at startup, we call process.exit(1) to crash the
//     server intentionally. There is no point running an Express server without
//     a database — all requests would fail anyway, and a hard crash makes the
//     problem immediately obvious in logs/monitoring tools.
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from "mongoose";

// connectDB — async function that opens the Mongoose connection to MongoDB Atlas
// (or a local MongoDB instance, depending on the value of MONGO_URI in .env).
//
// Called once at server boot. Mongoose then manages the connection pool
// internally, so individual controllers don't need to connect/disconnect.
const connectDB = async () => {
  try {
    // mongoose.connect returns a connection object; we use it to log the host
    // so we can confirm which cluster/instance the server connected to
    const conn = await mongoose.connect(`${process.env.MONGO_URI}/CampusConnect`);

    // Log the host (e.g. cluster0.mongodb.net) for easy debugging in server logs
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // Print the error so we know why the connection failed
    console.error(`Error: ${error.message}`);

    // Exit the process with code 1 (non-zero = failure).
    // This stops the server from running in a broken state without a DB connection.
    process.exit(1);
  }
};

export default connectDB;
