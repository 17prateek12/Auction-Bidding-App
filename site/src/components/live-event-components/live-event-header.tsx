'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Clock, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface LiveEventHeaderProps {
  event: any;
  isCreator: boolean;
}

const LiveEventHeader: React.FC<LiveEventHeaderProps> = ({ event, isCreator }) => {
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');
  const [isEnded, setIsEnded] = useState<boolean>(false);

  useEffect(() => {
    if (event?.event_status === 'ended') {
      setIsEnded(true);
      setTimeLeft('00:00:00');
      return;
    }

    if (!event?.end_time && !event?.endTime) return;

    const endTimeDate = new Date(event.end_time || event.endTime).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = endTimeDate - now;

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        setIsEnded(true);
        return;
      }

      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [event]);

  const eventName = event?.name || event?.eventName || 'Live Reverse Auction Event';
  const description = event?.description || 'Competitive reverse bidding event for registered items.';
  const startDateStr = event?.start_time ? format(new Date(event.start_time), 'MMM dd, yyyy - hh:mm a') : 'N/A';
  const endDateStr = event?.end_time ? format(new Date(event.end_time), 'MMM dd, yyyy - hh:mm a') : 'N/A';

  return (
    <div className="w-full p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-gray-900/90 to-emerald-950/40 border border-gray-700 shadow-2xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="space-y-2 max-w-2xl">
        <div className="flex items-center gap-3 flex-wrap">
          {isEnded ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/40">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              Event Ended & Bidding Closed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              Live Bidding Event
            </span>
          )}

          {isCreator ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <ShieldAlert className="w-3.5 h-3.5" /> Event Creator (Observation Mode)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" /> Participant Bidding Mode
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-100 tracking-tight">{eventName}</h1>
        <p className="text-sm text-gray-400 leading-relaxed">{description}</p>

        <div className="flex items-center gap-4 text-xs text-gray-400 pt-1 flex-wrap">
          <span>Starts: <strong className="text-gray-200">{startDateStr}</strong></span>
          <span>•</span>
          <span>Ends: <strong className="text-gray-200">{endDateStr}</strong></span>
        </div>
      </div>

      {/* Countdown Timer Display */}
      <div className="flex flex-col items-end justify-center bg-gray-950/80 p-4 rounded-xl border border-gray-800 shadow-inner min-w-[200px] w-full md:w-auto">
        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold mb-1">
          <Clock className={`w-4 h-4 ${isEnded ? 'text-red-400' : 'text-emerald-400 animate-pulse'}`} />
          <span>{isEnded ? 'Auction Concluded' : 'Time Remaining'}</span>
        </div>
        <div className={`text-3xl font-black font-mono tracking-wider ${isEnded ? 'text-red-400' : 'text-emerald-400'}`}>
          {timeLeft}
        </div>
        {isEnded && (
          <span className="text-[10px] text-red-400 font-bold mt-1 uppercase">Bidding Closed</span>
        )}
      </div>
    </div>
  );
};

export default LiveEventHeader;
