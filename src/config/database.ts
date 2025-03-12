import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000, // 30 segundos
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
};
const connectToDatabase2 = async () => {
  try {
    const connection = mongoose.createConnection(process.env.MONGO_URI_USER_BD);


    connection.once('open', () => {
      console.log('Connected to MongoDB (Database 2)');
    });

    connection.on('error', (err) => {
      console.error('Error connecting to MongoDB (Database 2):', err);
    });

    return connection;
  } catch (error) {
    console.error('Error initializing connection to MongoDB (Database 2):', error);
  }
};
export { connectToDatabase, connectToDatabase2 };