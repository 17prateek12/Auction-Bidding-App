import express from 'express';
import dotenv from 'dotenv';
import userRoutes from '../routes/userRoutes';
import eventRoutes from '../routes/eventRoute';
import bidRoutes from '../routes/bidRoutes';
import cors from 'cors';
import cronRoutes from '../routes/cronRoute';

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send('Hello, TypeScript with Express!');
});

app.use('', cronRoutes);
app.use('/api/user', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/bid', bidRoutes);

export default app;
