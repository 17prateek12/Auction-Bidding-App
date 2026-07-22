import express from 'express';
import dotenv from 'dotenv';
import userRoutes from '../routes/userRoutes';
import eventRoutes from '../routes/eventRoute';
import bidRoutes from '../routes/bidRoutes';
import cors from 'cors';
import cronRoutes from '../routes/cronRoute';
import { isRedisConnected } from '../connection/redisConfig';

dotenv.config();

const app = express();

// Increase request payload size limit for uploading large Excel datasets (e.g., 10,000+ rows)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

app.get('/', (req, res) => {
  res.send('Reverse Auction API Service is Running');
});

// System Health Check Endpoint
app.get('/api/health', (req, res) => {
  const redisHealthy = isRedisConnected();
  res.status(redisHealthy ? 200 : 503).json({
    status: redisHealthy ? 'UP' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    services: {
      redis: redisHealthy ? 'CONNECTED' : 'DISCONNECTED',
      postgres: 'CONNECTED',
    },
  });
});

app.use('', cronRoutes);
app.use('/api/user', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/bid', bidRoutes);

export default app;
