'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Cookies from 'js-cookie';
import { useLiveBiddingRoom } from '@/hooks/useLiveBiddingRoom';
import LiveEventHeader from '@/components/live-event-components/live-event-header';
import ParticipantBiddingTable from '@/components/live-event-components/participant-bidding-table';
import CreatorLeaderboardTable from '@/components/live-event-components/creator-leaderboard-table';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const LiveEventPage = () => {
  const params = useParams();
  const eventId = (params?.id as string) || '';

  const [mounted, setMounted] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  const {
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
  } = useLiveBiddingRoom(eventId);

  useEffect(() => {
    setMounted(true);
    setCurrentUserId(Cookies.get('userId'));
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <span className="text-sm font-medium">Connecting to Live Bidding Room...</span>
      </div>
    );
  }

  if (isError || !eventData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
        <div className="text-red-400 text-lg font-bold">Failed to load Live Event</div>
        <Button asChild variant="outline" className="border-gray-700 text-gray-300">
          <Link href="/event-page">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Events Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  const creatorId = eventData.creator_id || eventData.createdBy;
  const isCreator = Boolean(currentUserId && creatorId === currentUserId);

  return (
    <div className="px-4 sm:px-8 py-8 w-full min-h-screen text-white space-y-6">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200">
          <Link href="/event-page">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Events Dashboard
          </Link>
        </Button>
      </div>

      {/* Live Event Header */}
      <LiveEventHeader event={eventData} isCreator={isCreator} />

      {/* Role-Based Table Rendering */}
      {isCreator ? (
        <CreatorLeaderboardTable
          items={items}
          columns={columns}
          leaderboards={leaderboards}
        />
      ) : (
        <ParticipantBiddingTable
          items={items}
          columns={columns}
          userBids={userBids}
          onPlaceBid={placeBid}
          submittingItemId={submittingItemId}
          isEventEnded={isEventEnded}
        />
      )}
    </div>
  );
};

export default LiveEventPage;
