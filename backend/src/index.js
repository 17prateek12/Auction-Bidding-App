const express = require('express');
const http = require('http');
const { setupSocketIO, redis } = require("../sockets/redissocketConnection");
require('dotenv').config();
const app = express()
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDB = require('../config/mongoConfig');
const server = http.createServer(app);
const router = express.Router();
const mongoose = require("mongoose");
const Bid = require('../models/bidSchema');
const Event = require('../models/Event');

app.use(cors());


const io = setupSocketIO(server);

const allowedOrigins = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}))

app.get('/', (req, res) => {
  res.json({
    "ok": "okk"
  })
})



//app.post("/bid", async (req, res) => {
//  const { userId, amount, itemId, eventId } = req.body;
//  if (!userId || !amount || amount <= 0 || !itemId || !eventId) {
//    return res.status(400).json({ error: "Invalid bid data." });
//  }
//
//  // Log the incoming bid data for debugging
//  console.log('Received bid data:', { userId, amount, itemId, eventId });
//
//  const eventKey = `event:${eventId}`;
//  const userBidsKey = `event:${eventId}:item:${itemId}:userBids`;
//  const bidsKey = `event:${eventId}:item:${itemId}:bids`;
//
//  try {
//    const eventExists = await redis.exists(eventKey);
//    if (!eventExists) {
//      await redis.set(eventKey, JSON.stringify({ eventId, name: `Event ${eventId}` }));
//      // console.log(`New event created: ${eventId}`);
//    }
//
//    // Retrieve existing bids for the user and update
//    const existingBids = await redis.hget(userBidsKey, userId);
//    if (existingBids) {
//      const bidAmounts = JSON.parse(existingBids);
//      bidAmounts.push(amount);
//      await redis.hset(userBidsKey, userId, JSON.stringify(bidAmounts));
//      // console.log(`Existing bid found for user ${userId}, updated bid amounts: ${bidAmounts}`);
//    } else {
//      await redis.hset(userBidsKey, userId, JSON.stringify([amount]));
//      //console.log(`New bid for user ${userId}: ${amount}`);
//    }
//
//    // Add the new bid amount to the Redis sorted set
//    await redis.zadd(bidsKey, amount, userId);
//
//    // Get the leaderboard (ranked list of bids)
//    const leaderboard = await redis.zrevrange(bidsKey, 0, -1, "WITHSCORES");
//
//    // Log leaderboard data
//    console.log('Leaderboard:', leaderboard);
//
//    // Process leaderboard and assign ranks
//    const rankedData = [];
//    let rank = 1;
//    let previousBid = null;
//    for (let i = 0; i < leaderboard.length; i += 2) {
//      const userId = leaderboard[i];
//      const currentBid = parseInt(leaderboard[i + 1], 10);
//      if (previousBid === currentBid) {
//        rankedData.push({ userId, bid: currentBid, rank });
//      } else {
//        rankedData.push({ userId, bid: currentBid, rank });
//        rank++;
//      }
//      previousBid = currentBid;
//    }
//
//
//    // Log the ranked data
//    console.log('Ranked leaderboard data:', rankedData);
//
//    // Emit the updated leaderboard to the clients
//    io.emit("updateLeaderboard", rankedData);
//    console.log("Data sent to client", rankedData);
//
//    // Update Bid Document in MongoDB
//    let bidDocument = await Bid.findOne({ event: eventId, user: userId });
//    if (!bidDocument) {
//      bidDocument = new Bid({
//        event: eventId,
//        user: userId,
//        bids: [],
//      });
//    }
//
//    // Find or create the itemBid for this itemId
//    let itemBid = bidDocument.bids.find((bid) => bid.rowId === itemId);
//    if (!itemBid) {
//      itemBid = {
//        rowId: itemId, // Use itemId as rowId
//        amounts: [],
//        rank: null,
//      };
//      bidDocument.bids.push(itemBid);
//    }
//
//    // Push the new bid amount into the itemBid amounts array
//    itemBid.amounts.push({ value: amount });
//
//    // Save the document
//    await bidDocument.save();
//    //console.log('Bid document saved:', bidDocument);
//
//    return res.status(200).json({ message: "Bid placed successfully." });
//  } catch (err) {
//    console.error('Error placing bid:', err);
//    return res.status(500).json({ error: "Internal server error." });
//  }
//});

//app.post("/bid", async (req, res) => {
//  const { userId, amount, itemId, eventId } = req.body;
//  if (!userId || !amount || amount <= 0 || !itemId || !eventId) {
//    return res.status(400).json({ error: "Invalid bid data." });
//  }
//
//  // Log the incoming bid data for debugging
//  console.log('Received bid data:', { userId, amount, itemId, eventId });
//
//  const eventKey = `event:${eventId}`;
//  const userBidsKey = `event:${eventId}:item:${itemId}:userBids`;
//  const bidsKey = `event:${eventId}:item:${itemId}:bids`;
//
//  try {
//    const eventExists = await redis.exists(eventKey);
//    if (!eventExists) {
//      await redis.set(eventKey, JSON.stringify({ eventId, name: `Event ${eventId}` }));
//    }
//
//    // Retrieve existing bids for the user and update
//    const existingBids = await redis.hget(userBidsKey, userId);
//    if (existingBids) {
//      const bidAmounts = JSON.parse(existingBids);
//      bidAmounts.push(amount);
//      await redis.hset(userBidsKey, userId, JSON.stringify(bidAmounts));
//    } else {
//      await redis.hset(userBidsKey, userId, JSON.stringify([amount]));
//    }
//
//    // Add the new bid amount to the Redis sorted set
//    await redis.zadd(bidsKey, amount, userId);
//
//    // Get the leaderboard (ranked list of bids)
//    const leaderboard = await redis.zrevrange(bidsKey, 0, -1, "WITHSCORES");
//
//    // Process leaderboard and assign ranks
//    const rankedData = [];
//    let rank = 1;
//    let previousBid = null;
//    for (let i = 0; i < leaderboard.length; i += 2) {
//      const userId = leaderboard[i];
//      const currentBid = parseInt(leaderboard[i + 1], 10);
//      if (previousBid === currentBid) {
//        rankedData.push({ userId, bid: currentBid, rank });
//      } else {
//        rankedData.push({ userId, bid: currentBid, rank });
//        rank++;
//      }
//      previousBid = currentBid;
//    }
//
//    // Store the list of users who bid on the item with their details
//    await redis.hset(`event:${eventId}:item:${itemId}:bidders`, userId, JSON.stringify({ amount, rank }));
//
//    // Emit the updated leaderboard to the clients
//    io.emit("updateLeaderboard", rankedData);
//
//    // Update the bid document in MongoDB as before (optional)
//    let bidDocument = await Bid.findOne({ event: eventId, user: userId });
//    if (!bidDocument) {
//      bidDocument = new Bid({
//        event: eventId,
//        user: userId,
//        bids: [],
//      });
//    }
//
//    let itemBid = bidDocument.bids.find((bid) => bid.rowId === itemId);
//    if (!itemBid) {
//      itemBid = {
//        rowId: itemId,
//        amounts: [],
//        rank: null,
//      };
//      bidDocument.bids.push(itemBid);
//    }
//
//    itemBid.amounts.push({ value: amount });
//    await bidDocument.save();
//
//    return res.status(200).json({ message: "Bid placed successfully." });
//  } catch (err) {
//    console.error('Error placing bid:', err);
//    return res.status(500).json({ error: "Internal server error." });
//  }
//});


//app.post("/bid", async (req, res) => {
//  const { userId, amount, itemId, eventId } = req.body;
//
//  if (!userId || !amount || amount <= 0 || !itemId || !eventId) {
//    return res.status(400).json({ error: "Invalid bid data." });
//  }
//
//  const bidsKey = `event:${eventId}:item:${itemId}:bids`;
//  const biddersKey = `event:${eventId}:item:${itemId}:bidders`;
// 
//  try {
//    // Add the new bid amount to the Redis sorted set
//    await redis.zadd(bidsKey, amount, userId);
//
//    // Get the leaderboard (ranked list of bids)
//    const leaderboard = await redis.zrange(bidsKey, 0, -1, "WITHSCORES");
//
//    // Process leaderboard and update ranks
//    const rankedData = [];
//    for (let i = 0; i < leaderboard.length; i += 2) {
//      const userId = leaderboard[i];
//      const currentBid = parseFloat(leaderboard[i + 1]);
//      const rank = Math.floor(i / 2) + 1; // Rank based on sorted order
//
//      // Store rank and bid in the hash
//      await redis.hset(
//        biddersKey,
//        userId,
//        JSON.stringify({ amount: currentBid, rank })
//      );
//
//      rankedData.push({ userId, amount: currentBid, rank });
//    }
//    
//
//    // Emit the updated leaderboard to the clients
//    io.emit("updateLeaderboard", {
//      eventId,
//      itemId,
//      rankedData,
//    });
//    console.log("rank data",rankedData)
//    return res.status(200).json({ message: "Bid placed successfully.", rankedData });
//    
//  } catch (err) {
//    console.error("Error placing bid:", err);
//    return res.status(500).json({ error: "Internal server error." });
//  }
//});

//app.post("/bid", async (req, res) => {
//  const { userId, amount, itemId, eventId } = req.body;
//
//  if (!userId || !amount || amount <= 0 || !itemId || !eventId) {
//    return res.status(400).json({ error: "Invalid bid data." });
//  }
//
//  const bidsKey = `event:${eventId}:item:${itemId}:bids`;
//  const biddersKey = `event:${eventId}:item:${itemId}:bidders`;
//
//  try {
//    // Add the new bid amount to the Redis sorted set
//    await redis.zadd(bidsKey, amount, userId);
//
//    // Get the leaderboard (ranked list of bids)
//    const leaderboard = await redis.zrange(bidsKey, 0, -1, "WITHSCORES");
//
//    // Process leaderboard and update ranks
//    const rankedData = [];
//    for (let i = 0; i < leaderboard.length; i += 2) {
//      const userId = leaderboard[i];
//      const currentBid = parseFloat(leaderboard[i + 1]);
//      const rank = Math.floor(i / 2) + 1; // Rank based on sorted order
//
//      // Store rank and bid in the hash
//      await redis.hset(
//        biddersKey,
//        userId,
//        JSON.stringify({ amount: currentBid, rank })
//      );
//
//      rankedData.push({ userId, amount: currentBid, rank });
//    }
//
//    // Fetch the rank of the specific user
//    const userRank = rankedData.find((bid) => bid.userId === userId) || null;
//
//    // Emit the updated leaderboard to the clients
//    io.emit("updateLeaderboard", {
//      eventId,
//      itemId,
//      rankedData,
//    });
//    console.log("Ranked data", rankedData);
//    return res.status(200).json({
//      message: "Bid placed successfully.",
//      rankedData,
//      userRank,
//    });
//  } catch (err) {
//    console.error("Error placing bid:", err);
//    return res.status(500).json({ error: "Internal server error." });
//  }
//});



app.post("/bid", async (req, res) => {
  const { userId, amount, itemId, eventId } = req.body;

  if (!userId || !amount || amount <= 0 || !itemId || !eventId) {
    return res.status(400).json({ error: "Invalid bid data." });
  }

  const bidsKey = `event:${eventId}:item:${itemId}:bids`;
  const biddersKey = `event:${eventId}:item:${itemId}:bidders`;

  try {
    // Add the new bid amount to the Redis sorted set
    await redis.zadd(bidsKey, amount, userId);

    // Get the leaderboard (ranked list of bids)
    const leaderboard = await redis.zrange(bidsKey, 0, -1, "WITHSCORES");

    // Process leaderboard and update ranks
    const rankedData = [];
    for (let i = 0; i < leaderboard.length; i += 2) {
      const userId = leaderboard[i];
      const currentBid = parseFloat(leaderboard[i + 1]);
      const rank = Math.floor(i / 2) + 1; // Rank based on sorted order

      // Store rank and bid in the hash
      await redis.hset(
        biddersKey,
        userId,
        JSON.stringify({ amount: currentBid, rank })
      );

      rankedData.push({ userId, amount: currentBid, rank });
    }

    // Fetch the rank of the specific user
    const userRank = rankedData.find((bid) => bid.userId === userId) || null;

    // Create or update the bid entry in the database
    let bid = await Bid.findOne({
      user: new mongoose.Types.ObjectId(userId), // Fix: Use `new mongoose.Types.ObjectId(userId)`
      event: new mongoose.Types.ObjectId(eventId), // Fix: Use `new mongoose.Types.ObjectId(eventId)`
    });

    if (!bid) {
      // Create a new bid if it doesn't exist
      bid = new Bid({
        user: new mongoose.Types.ObjectId(userId), // Fix: Use `new mongoose.Types.ObjectId(userId)`
        event: new mongoose.Types.ObjectId(eventId), // Fix: Use `new mongoose.Types.ObjectId(eventId)`
        bids: [
          {
            rowId: itemId, // Associate the bid with the specific item
            amounts: [
              {
                value: amount,
                timestamp: new Date(), // Timestamp for the bid
              },
            ],
            rank: userRank ? userRank.rank : null, // Set the rank of the user
          },
        ],
      });
    } else {
      // If a bid already exists, update it
      const existingBidRow = bid.bids.find((bidRow) => bidRow.rowId === itemId);
      if (existingBidRow) {
        // Update the existing row with new bid amount and rank
        existingBidRow.amounts.push({
          value: amount,
          timestamp: new Date(),
        });
        existingBidRow.rank = userRank ? userRank.rank : existingBidRow.rank;
      } else {
        // If no bid row exists for the item, create a new one
        bid.bids.push({
          rowId: itemId,
          amounts: [
            {
              value: amount,
              timestamp: new Date(),
            },
          ],
          rank: userRank ? userRank.rank : null,
        });
      }
    }

    // Save the bid to the database
    await bid.save();

    // Emit the updated leaderboard to the clients
    io.emit("updateLeaderboard", {
      eventId,
      itemId,
      rankedData,
    });

    console.log("Ranked data", rankedData);
    return res.status(200).json({
      message: "Bid placed successfully.",
    });
  } catch (err) {
    console.error("Error placing bid:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});


app.get("/leaderboard", async (req, res) => {
  const { eventId, itemId } = req.query;

  if (!eventId || !itemId) {
    return res.status(400).json({ error: "Missing eventId or itemId in query." });
  }

  const bidsKey = `event:${eventId}:item:${itemId}:bids`;

  try {
    // Attempt to fetch leaderboard data from Redis
    let leaderboard = [];
    try {
      leaderboard = await redis.zrange(bidsKey, 0, -1, "WITHSCORES");
      console.log("Leaderboard fetched from Redis:", leaderboard);
    } catch (err) {
      console.error("Error fetching data from Redis:", err);
    }

    // If Redis data is missing or empty, fall back to MongoDB
    if (!leaderboard || leaderboard.length === 0) {
      console.log("Falling back to MongoDB for leaderboard data.");

      // Fetch all bids for the specific event and item
      const allBids = await Bid.find({
        event: eventId,
        "bids.rowId": itemId,
      });

      if (!allBids || allBids.length === 0) {
        return res.status(404).json({ message: "No leaderboard data found." });
      }

      // Process bids to create leaderboard data
      const bidAmounts = [];
      allBids.forEach((bid) => {
        const bidRow = bid.bids.find((row) => row.rowId === itemId);
        if (bidRow) {
          const latestAmount = bidRow.amounts[bidRow.amounts.length - 1]?.value || 0;
          bidAmounts.push({ userId: bid.user.toString(), amount: latestAmount });
        }
      });

      // Sort by bid amounts and assign ranks
      bidAmounts.sort((a, b) => b.amount - a.amount);
      leaderboard = bidAmounts.map((bid, index) => ({
        userId: bid.userId,
        amount: bid.amount,
        rank: index + 1,
      }));
    } else {
      // Process leaderboard data from Redis
      const rankedData = [];
      for (let i = 0; i < leaderboard.length; i += 2) {
        const userId = leaderboard[i];
        const currentBid = parseFloat(leaderboard[i + 1]);
        const rank = Math.floor(i / 2) + 1;

        rankedData.push({ userId, amount: currentBid, rank });
      }
      leaderboard = rankedData;
    }

    return res.status(200).json({ rankedData: leaderboard });
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});



//app.get("/user-rank", async (req, res) => {
//  const { userId, eventId } = req.query;
//
//  if (!userId || !eventId) {
//    return res.status(400).json({ error: "Missing userId or eventId in query." });
//  }
//
//  try {
//    const itemsKey = `event:${eventId}:items`;
//    let items = await redis.smembers(itemsKey); // Fetch items from Redis
//
//    console.log("Items fetched from Redis:", items);
//
//    // Fallback to database if Redis doesn't have items
//    if (!items || items.length === 0) {
//      const event = await Event.findById(eventId).populate("items");
//      if (!event || !event.items || event.items.length === 0) {
//        console.log("No items found in database for event:", eventId);
//        return res.status(404).json({ message: "No items found for the event." });
//      }
//      items = event.items.map((item) => item._id.toString());
//    }
//
//    const userBids = [];
//    let redisAvailable = true;
//
//    for (const itemId of items) {
//      const biddersKey = `event:${eventId}:item:${itemId}:bidders`;
//
//      // Fetch rank and bid amount from Redis
//      let rankData = null;
//      if (redisAvailable) {
//        try {
//          rankData = await redis.hget(biddersKey, userId);
//          console.log(`Rank data for user ${userId} on item ${itemId}:`, rankData);
//        } catch (err) {
//          console.error("Redis error:", err);
//          redisAvailable = false; // Switch to database fallback
//        }
//      }
//
//      if (rankData) {
//        const rankInfo = JSON.parse(rankData);
//        userBids.push({
//          itemId,
//          amount: rankInfo.amount,
//          rank: rankInfo.rank,
//        });
//      } else {
//        // Fallback to database if Redis doesn't have data
//        const bid = await Bid.findOne({
//          event: eventId,
//          user: userId,
//          "bids.rowId": itemId,
//        });
//
//        if (bid) {
//          // Find the bid row for this item
//          const bidRow = bid.bids.find((row) => row.rowId === itemId);
//          if (bidRow) {
//            const latestAmount = bidRow.amounts[bidRow.amounts.length - 1]?.value || null;
//
//            // Calculate rank based on other bidders
//            const allBids = await Bid.find({
//              event: eventId,
//              "bids.rowId": itemId,
//            });
//
//            const sortedBids = allBids
//              .map((b) => {
//                const row = b.bids.find((r) => r.rowId === itemId);
//                return row?.amounts[row.amounts.length - 1]?.value || 0;
//              })
//              .sort((a, b) => b - a);
//
//            const rank = sortedBids.indexOf(latestAmount) + 1;
//
//            userBids.push({
//              itemId,
//              amount: latestAmount,
//              rank: rank || null,
//            });
//          }
//        } else {
//          userBids.push({
//            itemId,
//            amount: null,
//            rank: null,
//          });
//        }
//      }
//    }
//
//    console.log("User bids data:", userBids);
//
//    return res.status(200).json({ userId, eventId, userBids });
//  } catch (err) {
//    console.error("Error fetching user rank and bids:", err);
//    return res.status(500).json({ error: "Internal server error." });
//  }
//});
//




app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

connectDB();

app.use(express.static(path.join(__dirname, 'public')));


const indexRoutes = require('../routes/index');


app.use('/api', indexRoutes);


server.listen(3000, () => {
  console.log("..on 3000")
})