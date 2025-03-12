// src/utils/requestCounter.ts
import mongoose from 'mongoose';
import  User  from '../models/User';
import { connectToDatabase2 } from '../config/database';

export const incrementRequestCount = async (userId: string) => {
  // Connect to MongoDB and update announcementCount
  const userDBConnection = await connectToDatabase2();
  const UserModel = userDBConnection.model('User', User.schema);

  await UserModel.findByIdAndUpdate(userId, {
    $inc: { announcementCount: 1 },
  });

  console.log(`User ${userId} announcementCount incremented`);
};