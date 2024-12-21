const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Redis = require('ioredis');
const cors = require('cors');
const app = express();
const server = http.createServer(app);
const router=express.Router()
const {setupSocketIO,redis}=require('./redissocketConnection')

setupSocketIO(server)
app.use(cors({
  origin: 'http://localhost:5173' 
}));


app.use(express.json());

// router.post('/bid', async (req, res) => {
//   const { userId, amount } = req.body;

//   if (!userId || !amount || amount <= 0) {
//     return res.status(400).json({ error: 'Invalid bid data.' });
//   }
//   try {
//     const existingBids = await redis.hget('userBids', userId);

//     if (existingBids) {
//       const bidAmounts = JSON.parse(existingBids);
//       bidAmounts.push(amount);

//       await redis.hset('userBids', userId, JSON.stringify(bidAmounts));
//     } else {
//       await redis.hset('userBids', userId, JSON.stringify([amount]));
//     }

//     await redis.zadd('bids', amount, userId);

//     const leaderboard = await redis.zrevrange('bids', 0, -1, 'WITHSCORES');
//     const rankedData = [];
//     let rank = 1;
//     let previousScore = null;

//     leaderboard.forEach((entry, index) => {
//       if (index % 2 === 0) {
//         if (leaderboard[index + 1] !== previousScore) {
//           rank = rankedData.length + 1; 
//         }
//         rankedData.push({ userId: entry, bid: leaderboard[index + 1], rank });
//         previousScore = leaderboard[index + 1];
//       }
//     });

//     io.emit('updateLeaderboard', rankedData);
//     console.log("Data sent to client ", rankedData);

//     return res.status(200).json({ message: 'Bid placed successfully.' });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ error: 'Internal server error.' });
//   }
// });


// module.exports=router


