import dotenv from 'dotenv';
import { connectionDb } from './connection/dbConfig';
import { errorHandler, notFound } from './middleware/errorMiddleware';
import app from './app/app';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { eventSockethandler } from './sockets/eventSocket';


dotenv.config()
connectionDb();
const httpServer = createServer(app);

const io = new Server(httpServer,{
    cors:{
        origin:'*',
        methods:['GET','POST']
    }
});

io.on('connection',(socket)=>{
    console.log('Socket connected',socket.id);
    eventSockethandler(socket);
})

const PORT = process.env.PORT || 5000;
app.use(notFound);
app.use(errorHandler);

httpServer.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

