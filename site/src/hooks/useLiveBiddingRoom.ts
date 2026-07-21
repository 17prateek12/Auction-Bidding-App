'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { getSocket, joinEventRoom, placeBidSocket } from '@/lib/socketService';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export const useLiveBiddingRoom = (eventId: string) => {
  const [eventData, setEventData] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [leaderboards, setLeaderboards] = useState<Record<string, any[]>>({});
  const [userBids, setUserBids] = useState<Record<string, { amount: number; rank: number }>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [submittingItemId, setSubmittingItemId] = useState<string | null>(null);

  const currentUserId = Cookies.get('userId');

  // Compute if event has ended based on status or end_time
  const isEventEnded = Boolean(
    eventData?.event_status === 'ended' ||
    (eventData?.end_time && new Date() >= new Date(eventData.end_time))
  );

  // Helper to extract own user rank & amount from a leaderboard array
  const extractUserBid = useCallback((rankedData: any[], userId?: string) => {
    if (!userId || !Array.isArray(rankedData)) return null;
    const myBid = rankedData.find(
      (b: any) => b.userId === userId || b.user_id === userId
    );
    if (myBid) {
      return {
        amount: parseFloat(myBid.amount),
        rank: myBid.rank,
      };
    }
    return null;
  }, []);

  // Fetch Event Data & Items from /api/event/user-event/:id
  const fetchEventItems = useCallback(async () => {
    if (!eventId) return;
    try {
      setIsLoading(true);
      const token = Cookies.get('token') || Cookies.get('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.get(`${API_URL}/api/event/user-event/${eventId}`, { headers });
      const event = res.data.event || {};
      const itemsList = res.data.item || res.data.items || [];

      setEventData(event);
      setItems(itemsList);

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
    } catch (err) {
      setIsError(true);
      toast.error('Failed to load event data.');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEventItems();
  }, [fetchEventItems]);

  // HTTP Polling Fallback (fetches latest user ranks & item leaderboards every 3s)
  const pollLeaderboardsAndRanks = useCallback(async () => {
    if (!eventId || items.length === 0) return;
    try {
      const token = Cookies.get('token') || Cookies.get('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Poll User Rank Fallback
      if (token) {
        const userRankRes = await axios.get(`${API_URL}/api/bid/user-rank?eventId=${eventId}`, { headers });
        if (userRankRes.data?.userBids && Array.isArray(userRankRes.data.userBids)) {
          const newUserBids: Record<string, { amount: number; rank: number }> = {};
          userRankRes.data.userBids.forEach((b: any) => {
            if (b.itemId && b.amount !== null && b.rank !== null) {
              newUserBids[b.itemId] = {
                amount: parseFloat(b.amount),
                rank: b.rank,
              };
            }
          });
          setUserBids((prev) => ({ ...prev, ...newUserBids }));
        }
      }

      // 2. Poll Leaderboard Fallback for items
      const newLeaderboards: Record<string, any[]> = {};
      for (const item of items) {
        const itemId = item.id || item._id;
        const lbRes = await axios.get(`${API_URL}/api/bid/leaderboard?eventId=${eventId}&itemId=${itemId}`);
        if (lbRes.data?.rankedData && Array.isArray(lbRes.data.rankedData)) {
          newLeaderboards[itemId] = lbRes.data.rankedData;
        }
      }
      if (Object.keys(newLeaderboards).length > 0) {
        setLeaderboards((prev) => ({ ...prev, ...newLeaderboards }));
      }
    } catch (err) {
      // Silent catch for HTTP polling fallback
    }
  }, [eventId, items]);

  // Periodic HTTP Polling Fallback (every 3 seconds)
  useEffect(() => {
    if (!eventId || items.length === 0) return;
    const interval = setInterval(() => {
      pollLeaderboardsAndRanks();
    }, 3000);
    return () => clearInterval(interval);
  }, [eventId, items, pollLeaderboardsAndRanks]);

  // Real-Time Socket Connection & Broadcast Listeners
  useEffect(() => {
    if (!eventId) return;

    const socket = getSocket();
    joinEventRoom(eventId);

    const handleUpdateLeaderboardAll = (data: any) => {
      if (data && data.leaderboards) {
        setLeaderboards(data.leaderboards);

        if (currentUserId) {
          const newUserBids: Record<string, { amount: number; rank: number }> = {};
          Object.entries(data.leaderboards).forEach(([itemId, rankedData]: [string, any]) => {
            const userBid = extractUserBid(rankedData, currentUserId);
            if (userBid) {
              newUserBids[itemId] = userBid;
            }
          });
          setUserBids((prev) => ({ ...prev, ...newUserBids }));
        }
      }
    };

    const handleUpdateLeaderboard = (data: any) => {
      if (data && data.itemId && Array.isArray(data.rankedData)) {
        const { itemId, rankedData } = data;

        setLeaderboards((prev) => ({
          ...prev,
          [itemId]: rankedData,
        }));

        if (currentUserId) {
          const userBid = extractUserBid(rankedData, currentUserId);
          if (userBid) {
            setUserBids((prev) => ({
              ...prev,
              [itemId]: userBid,
            }));
          }
        }
      }
    };

    const handleBidSuccess = (data: any) => {
      toast.success(`🎉 Bid of $${data.amount} placed! (Rank #${data.rank})`);
      setSubmittingItemId(null);
    };

    const handleBidError = (data: any) => {
      toast.error(data.message || 'Failed to place bid.');
      setSubmittingItemId(null);
    };

    socket.on('updateLeaderboardAll', handleUpdateLeaderboardAll);
    socket.on('updateLeaderboard', handleUpdateLeaderboard);
    socket.on('bid:success', handleBidSuccess);
    socket.on('bid:error', handleBidError);

    return () => {
      socket.off('updateLeaderboardAll', handleUpdateLeaderboardAll);
      socket.off('updateLeaderboard', handleUpdateLeaderboard);
      socket.off('bid:success', handleBidSuccess);
      socket.off('bid:error', handleBidError);
    };
  }, [eventId, currentUserId, extractUserBid]);

  // Direct Bid Placement Call
  const placeBid = useCallback(
    async (itemId: string, amount: number) => {
      if (isEventEnded) {
        toast.error('Bidding is closed because the event has ended.');
        return;
      }
      if (!eventId || !itemId || isNaN(amount) || amount <= 0) {
        return;
      }

      setSubmittingItemId(itemId);

      try {
        const socket = getSocket();
        if (socket && socket.connected) {
          placeBidSocket(eventId, itemId, amount);
        } else {
          // REST Fallback if socket is disconnected
          const token = Cookies.get('token') || Cookies.get('accessToken');
          const res = await axios.post(
            `${API_URL}/api/bid/place`,
            { eventId, itemId, amount },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (res.data?.rank) {
            setUserBids((prev) => ({
              ...prev,
              [itemId]: { amount, rank: res.data.rank },
            }));
          }
          toast.success(`🎉 Bid of $${amount} placed!`);
          setSubmittingItemId(null);
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to place bid.');
        setSubmittingItemId(null);
      }
    },
    [eventId, isEventEnded]
  );

  return {
    eventData,
    items,
    columns,
    leaderboards,
    userBids,
    isLoading,
    isError,
    isEventEnded,
    submittingItemId,
    placeBid,
    refetch: fetchEventItems,
  };
};
