import dotenv from 'dotenv';

dotenv.config();

export default {
  port: process.env.PORT || 5001,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sentinel',
  jwtSecret: process.env.JWT_SECRET || 'sentinel-secret-key',
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
};
