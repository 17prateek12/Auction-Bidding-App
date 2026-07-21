import { redis } from '../connection/redisConfig';

/**
 * Reverse Auction Atomic Lua Script
 * Enforces Reverse Auction Rules:
 * - Lower bid amount = Higher/Better Rank (Rank 1 is the lowest bid).
 * - "Always Improve" Rule: If user has an existing bid, new bid MUST be strictly lower.
 * - ZADD updates the bidder's score in the Redis Sorted Set.
 * - ZRANK returns 0-indexed ascending rank (lowest score = Rank #1).
 */
export const PLACE_BID_LUA = `
local bidsKey = KEYS[1]
local userId = ARGV[1]
local bidAmount = tonumber(ARGV[2])

if not bidAmount or bidAmount <= 0 then
    return {0, "Bid amount must be a positive number"}
end

-- Check user's existing bid score
local currentScore = redis.call('zscore', bidsKey, userId)

if currentScore then
    local currentBid = tonumber(currentScore)
    if bidAmount >= currentBid then
        return {0, "Bid must be lower than your current bid"}
    end
end

-- Add or update the user's bid in Redis ZSET (Score = bidAmount)
redis.call('zadd', bidsKey, bidAmount, userId)

-- Get the reverse auction rank using ZRANK (ascending order: lowest score = rank 0)
local rank = redis.call('zrank', bidsKey, userId)

if rank ~= nil then
    return {1, tostring(rank + 1)}
else
    return {1, "1"}
end
`;

// Register the custom command on redis instance
redis.defineCommand('placeBid', {
  numberOfKeys: 1,
  lua: PLACE_BID_LUA,
});

export interface LuaBidResponse {
  success: boolean;
  rankOrMessage: string;
}

/**
 * Places a bid atomically using a Redis Lua script.
 * Enforces reverse auction "Always Improve" rule and calculates ZRANK.
 */
export const placeBidAtomically = async (
  bidsKey: string,
  userId: string,
  amount: number
): Promise<LuaBidResponse> => {
  try {
    const result = await (redis as any).placeBid(bidsKey, userId, amount);
    const success = result[0] === 1;
    return {
      success,
      rankOrMessage: result[1],
    };
  } catch (error) {
    console.error('Error executing placeBid Lua script:', error);
    throw error;
  }
};
