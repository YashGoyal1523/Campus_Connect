import mongoose from "mongoose";

// Database connection function using event-based approach (Imagify pattern)
const connectDB = async () => {
  // Event listener: Log when database connection is established
  mongoose.connection.on('connected', () => {
    console.log('Database Connected');
  });

  // Connect to MongoDB database
  await mongoose.connect(`${process.env.MONGO_URI}/CampusConnect`);
};

export default connectDB;
