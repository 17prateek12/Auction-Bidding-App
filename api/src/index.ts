import dotenv from 'dotenv';
import { initPostgresDb } from './connection/postgresConfig';
import { errorHandler, notFound } from './middleware/errorMiddleware';
import app from './app/app';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { eventSockethandler } from './sockets/eventSocket';
import { bidSocketHandler } from './sockets/bidSocket';
import { initBidWorker } from './workers/bidWorker';
import { initFinalizationWorker } from './workers/finalizationWorker';

dotenv.config();
initPostgresDb();
initBidWorker();
initFinalizationWorker();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  eventSockethandler(socket);
  bidSocketHandler(io, socket);
});

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 8080);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
