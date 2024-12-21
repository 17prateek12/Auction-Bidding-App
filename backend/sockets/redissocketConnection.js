const Redis = require('ioredis');
const socket = require('socket.io');
const redis = new Redis({
  host: 'redis-14362.c277.us-east-1-3.ec2.redns.redis-cloud.com',
  port: 14362,
  password: 'zLxE0tpUU4v7TnuwNoRbUDzytDW4teaq',
});
redis.on('connect', () => {
  console.log('....Connected to Redis');
});
const setupSocketIO = (server) => {
  const io = socket(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  io.on('connection', (socket) => {
    console.log('A user connected.');
    socket.on('getLeaderboard', (itemId) => {
      // Dynamic Redis key based on itemId
      const userBidsKey = `item:${itemId}:userBids`;
      const bidsKey = `item:${itemId}:bids`;
      redis.zrevrange(bidsKey, 0, -1, 'WITHSCORES').then((leaderboard) => {
        const rankedData = [];
        let rank = 1;
        let previousScore = null;
        leaderboard.forEach((entry, index) => {
          if (index % 2 === 0) {
            if (leaderboard[index + 1] !== previousScore) {
              rank = rankedData.length + 1;
            }
            rankedData.push({ userId: entry, bid: leaderboard[index + 1], rank });
            previousScore = leaderboard[index + 1];
          }
        });
        socket.emit('updateLeaderboard', rankedData);
      });
    });
    socket.on('disconnect', () => {
      console.log('User disconnected.');
    });
  });
  return io;
};
module.exports = { redis, setupSocketIO };