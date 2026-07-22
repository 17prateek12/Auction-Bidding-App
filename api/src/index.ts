import dotenv from 'dotenv';
import { initPostgresDb } from './connection/postgresConfig';
import { errorHandler, notFound } from './middleware/errorMiddleware';
import app from './app/app';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { eventSockethandler } from './sockets/eventSocket';
import { bidSocketHandler } from './sockets/bidSocket';
import { initBidWorker } from './workers/bidWorker';

dotenv.config();
initPostgresDb();
initBidWorker();

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

const PORT = process.env.PORT;
app.use(notFound);
app.use(errorHandler);

httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
