'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { getSocket, joinEventRoom, placeBidSocket } from '@/lib/socketService';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export const useLiveBiddingRoom = (eventId: string) => {
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [isEventEnded, setIsEventEnded] = useState<boolean>(false);

  // Leaderboards state: { itemId: Array<{ userId, amount, rank, userName }> }
  const [leaderboards, setLeaderboards] = useState<Record<string, any[]>>({});

  // Current User's Bids & Ranks state: { itemId: { amount, rank } }
  const [userBids, setUserBids] = useState<Record<string, { amount: number; rank: number }>>({});

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
      const event = data.event || data;
      const itemList = data.items || [];

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

  // Helper to extract user's own bid and rank from rankedData array
  const extractUserBid = useCallback((rankedData: any[], userId?: string) => {
    if (!Array.isArray(rankedData)) return null;
    const myBid = rankedData.find(
      (b: any) =>
        (userId && (b.userId === userId || b.user_id === userId)) ||
        (b.userId && b.userId !== 'masked')
    );

    if (myBid && myBid.amount !== null && myBid.rank !== null) {
      return {
        amount: parseFloat(myBid.amount),
        rank: parseInt(myBid.rank, 10),
      };
    }
    return null;
  }, []);

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
                rank: parseInt(b.rank, 10),
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
        const lbRes = await axios.get(`${API_URL}/api/bid/leaderboard?eventId=${eventId}&itemId=${itemId}`, { headers });
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

        const newUserBids: Record<string, { amount: number; rank: number }> = {};
        Object.entries(data.leaderboards).forEach(([itemId, rankedData]: [string, any]) => {
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

    const handleUpdateLeaderboard = (data: any) => {
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

    const handleBidSuccess = (data: any) => {
      toast.success(`🎉 Bid of $${data.amount} placed! (Rank #${data.rank})`);
      setSubmittingItemId(null);
      if (data.itemId && data.rank && data.amount) {
        setUserBids((prev) => ({
          ...prev,
          [data.itemId]: {
            amount: parseFloat(data.amount),
            rank: parseInt(data.rank, 10),
          },
        }));
      }
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

          toast.success(`🎉 Bid placed! (Rank #${res.data.rank})`);
          if (res.data.rank && res.data.amount) {
            setUserBids((prev) => ({
              ...prev,
              [itemId]: {
                amount: parseFloat(res.data.amount),
                rank: parseInt(res.data.rank, 10),
              },
            }));
          }
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Failed to place bid.');
      } finally {
        setSubmittingItemId(null);
      }
    },
    [eventId, isEventEnded]
  );

  return {
    eventData: eventDetails,
    eventDetails,
    columns,
    items,
    isLoading,
    isError,
    isEventEnded,
    leaderboards,
    userBids,
    submittingItemId,
    placeBid,
    refetch: fetchEventItems,
  };
};
