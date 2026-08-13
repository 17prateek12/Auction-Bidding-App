'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { getSocket, joinEventRoom, placeBidSocket } from '@/lib/socketService';
import { API_BASE_URL } from '@/lib/env';
import { SourcingEvent, SourcingItem, BidderEntry, UserBidState } from '@/interface/interface';

const API_URL = API_BASE_URL;

interface UserRankResponse {
  userBids?: Array<{
    itemId: string;
    amount: number | null;
    rank: number | null;
  }>;
}

interface LeaderboardResponse {
  leaderboards?: Record<string, BidderEntry[]>;
}

interface SocketUpdateAllPayload {
  leaderboards?: Record<string, BidderEntry[]>;
}

interface SocketUpdateSinglePayload {
  itemId: string;
  rankedData: BidderEntry[];
}

interface SocketBidSuccessPayload {
  itemId: string;
  amount: number;
  rank: number;
}

export const useLiveBiddingRoom = (eventId: string) => {
  const [eventDetails, setEventDetails] = useState<SourcingEvent | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [items, setItems] = useState<SourcingItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [isEventEnded, setIsEventEnded] = useState<boolean>(false);

  // Leaderboards state: { itemId: BidderEntry[] }
  const [leaderboards, setLeaderboards] = useState<Record<string, BidderEntry[]>>({});

  // Current User's Bids & Ranks state: { itemId: { amount, rank } }
  const [userBids, setUserBids] = useState<Record<string, UserBidState>>({});

  const [submittingItemId, setSubmittingItemId] = useState<string | null>(null);

  // Extract User ID from Cookie or decode JWT token
  const currentUserId = useMemo(() => {
    const cookieUserId = Cookies.get('userId');
    if (cookieUserId) return cookieUserId;

    const token = Cookies.get('token') || Cookies.get('accessToken');
    if (token) {
      try {
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
          const decoded = JSON.parse(atob(payloadBase64));
          return decoded.userId || decoded.id;
        }
      } catch {}
    }
    return undefined;
  }, []);

  // Fetch Event Details & Items
  const fetchEventItems = useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    try {
      const token = Cookies.get('token') || Cookies.get('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(`${API_URL}/api/event/user-event/${eventId}`, {
        headers,
      });

      const data = response.data;
      const event: SourcingEvent = data.event || data;
      const itemList: SourcingItem[] = data.items || [];

      setEventDetails(event);
      setItems(itemList);

      // Check if event end time has passed
      if (event.end_time) {
        const now = new Date();
        const endTime = new Date(event.end_time);
        if (now >= endTime || event.event_status === 'ended') {
          setIsEventEnded(true);
        }
      }

      let parsedCols: string[] = [];
      if (Array.isArray(event.columns)) {
        parsedCols = event.columns;
      } else if (typeof event.columns === 'string') {
        try {
          parsedCols = JSON.parse(event.columns);
        } catch {
          parsedCols = [];
        }
      }
      setColumns(parsedCols);
      setIsError(false);
    } catch {
      setIsError(true);
      toast.error('Failed to load event data.');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEventItems();
  }, [fetchEventItems]);

  // Helper to extract user's own bid and rank from BidderEntry array
  const extractUserBid = useCallback((rankedData: BidderEntry[], userId?: string): UserBidState | null => {
    if (!Array.isArray(rankedData)) return null;
    const myBid = rankedData.find(
      (b: BidderEntry) =>
        (userId && (b.userId === userId)) ||
        (b.userId && b.userId !== 'masked')
    );

    if (myBid && myBid.amount !== null && myBid.rank !== null) {
      return {
        amount: myBid.amount,
        rank: myBid.rank,
      };
    }
    return null;
  }, []);

  // HTTP Polling Fallback (fetches latest user ranks & item leaderboards in bulk)
  const pollLeaderboardsAndRanks = useCallback(async () => {
    if (!eventId) return;
    try {
      const token = Cookies.get('token') || Cookies.get('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Poll User Rank Fallback (Single fast indexed query)
      if (token) {
        const userRankRes = await axios.get<UserRankResponse>(`${API_URL}/api/bid/user-rank?eventId=${eventId}`, { headers });
        if (userRankRes.data?.userBids && Array.isArray(userRankRes.data.userBids)) {
          const newUserBids: Record<string, UserBidState> = {};
          userRankRes.data.userBids.forEach((b) => {
            if (b.itemId && b.amount !== null && b.rank !== null) {
              newUserBids[b.itemId] = {
                amount: b.amount,
                rank: b.rank,
              };
            }
          });
          setUserBids((prev) => ({ ...prev, ...newUserBids }));
        }
      }

      // 2. Poll Leaderboard in Bulk (Single fast query instead of 10,000 separate HTTP calls!)
      const lbRes = await axios.get<LeaderboardResponse>(`${API_URL}/api/bid/leaderboard?eventId=${eventId}`, { headers });
      if (lbRes.data?.leaderboards) {
        setLeaderboards(lbRes.data.leaderboards);
      }
    } catch {
      // Silent catch for HTTP polling fallback
    }
  }, [eventId]);

  // Trigger initial rankings fetch immediately once items are loaded
  useEffect(() => {
    if (items.length > 0) {
      pollLeaderboardsAndRanks();
    }
  }, [items.length, pollLeaderboardsAndRanks]);

  // Periodic HTTP Polling Fallback (every 3 seconds)
  useEffect(() => {
    if (!eventId || items.length === 0) return;
    const interval = setInterval(() => {
      pollLeaderboardsAndRanks();
    }, 3000);
    return () => clearInterval(interval);
  }, [eventId, items.length, pollLeaderboardsAndRanks]);

  // Real-Time Socket Connection & Broadcast Listeners
  useEffect(() => {
    if (!eventId) return;

    const socket = getSocket();
    joinEventRoom(eventId);

    const handleUpdateLeaderboardAll = (data: SocketUpdateAllPayload) => {
      if (data && data.leaderboards) {
        setLeaderboards(data.leaderboards);

        const newUserBids: Record<string, UserBidState> = {};
        Object.entries(data.leaderboards).forEach(([itemId, rankedData]) => {
          const userBid = extractUserBid(rankedData, currentUserId);
          if (userBid) {
            newUserBids[itemId] = userBid;
          }
        });
        if (Object.keys(newUserBids).length > 0) {
          setUserBids((prev) => ({ ...prev, ...newUserBids }));
        }
      }
    };

    const handleUpdateLeaderboard = (data: SocketUpdateSinglePayload) => {
      if (data && data.itemId && Array.isArray(data.rankedData)) {
        const { itemId, rankedData } = data;

        setLeaderboards((prev) => ({
          ...prev,
          [itemId]: rankedData,
        }));

        const userBid = extractUserBid(rankedData, currentUserId);
        if (userBid) {
          setUserBids((prev) => ({
            ...prev,
            [itemId]: userBid,
          }));
        }
      }
    };

    const handleBidSuccess = (data: SocketBidSuccessPayload) => {
      toast.success(`🎉 Bid of $${data.amount} placed! (Rank #${data.rank})`);
      setSubmittingItemId(null);
      if (data.itemId && data.rank && data.amount) {
        setUserBids((prev) => ({
          ...prev,
          [data.itemId]: {
            amount: data.amount,
            rank: data.rank,
          },
        }));
      }
    };

    const handleEventEnded = () => {
      setIsEventEnded(true);
      toast.info('🔒 Event has ended. Bidding closed!');
    };

    const handleEventExtended = (data: { eventId: string; endTime: string }) => {
      setEventDetails((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          end_time: data.endTime,
        };
      });
      setIsEventEnded(false);
      toast.info('⏱️ Event duration extended due to a late bid (anti-sniping)!');
    };

    socket.on('updateLeaderboardAll', handleUpdateLeaderboardAll);
    socket.on('updateLeaderboard', handleUpdateLeaderboard);
    socket.on('bid:success', handleBidSuccess);
    socket.on('event:ended', handleEventEnded);
    socket.on('event:extended', handleEventExtended);

    return () => {
      socket.off('updateLeaderboardAll', handleUpdateLeaderboardAll);
      socket.off('updateLeaderboard', handleUpdateLeaderboard);
      socket.off('bid:success', handleBidSuccess);
      socket.off('event:ended', handleEventEnded);
      socket.off('event:extended', handleEventExtended);
    };
  }, [eventId, currentUserId, extractUserBid]);

  // Action: Place Bid via WebSocket
  const placeBid = useCallback(
    (itemId: string, amount: number) => {
      if (isEventEnded) {
        toast.error('Bidding is closed for this event.');
        return;
      }
      setSubmittingItemId(itemId);
      placeBidSocket(eventId, itemId, amount);
    },
    [eventId, isEventEnded]
  );

  return {
    eventData: eventDetails,
    columns,
    items,
    isLoading,
    isError,
    isEventEnded,
    leaderboards,
    userBids,
    placeBid,
    submittingItemId,
  };
};
