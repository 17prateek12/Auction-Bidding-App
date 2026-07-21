'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { Input } from '../ui/input';
import { Gavel, Trophy, Check, Loader2, Lock } from 'lucide-react';

interface ParticipantBiddingTableProps {
  items: any[];
  columns: string[];
  userBids: Record<string, { amount: number; rank: number }>;
  onPlaceBid: (itemId: string, amount: number) => void;
  submittingItemId: string | null;
  isEventEnded?: boolean;
}

// ----------------------------------------------------------------------
// Search-Bar Style 1-Second (1000ms) Auto-Debounced Bid Input Cell
// ----------------------------------------------------------------------
interface DebouncedBidInputProps {
  itemId: string;
  currentSubmittedAmount: number | undefined;
  onPlaceBid: (itemId: string, amount: number) => void;
  isSubmitting: boolean;
  isEventEnded?: boolean;
}

const DebouncedBidInput = memo(({ itemId, currentSubmittedAmount, onPlaceBid, isSubmitting, isEventEnded }: DebouncedBidInputProps) => {
  const [val, setVal] = useState<string>(currentSubmittedAmount ? String(currentSubmittedAmount) : '');
  const [status, setStatus] = useState<'idle' | 'typing' | 'synced'>('idle');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentSubmittedAmount && status !== 'typing') {
      setVal(String(currentSubmittedAmount));
      setStatus('synced');
    }
  }, [currentSubmittedAmount]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isEventEnded) return;

    const newText = e.target.value;
    setVal(newText);
    setStatus('typing');

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // 1000ms Auto-Debounce Timer
    timerRef.current = setTimeout(() => {
      const amount = parseFloat(newText);
      if (!isNaN(amount) && amount > 0 && amount !== currentSubmittedAmount) {
        onPlaceBid(itemId, amount);
        setStatus('synced');
      } else if (newText === '') {
        setStatus('idle');
      }
    }, 1000);
  };

  const handleBlur = () => {
    if (isEventEnded) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    const amount = parseFloat(val);
    if (!isNaN(amount) && amount > 0 && amount !== currentSubmittedAmount) {
      onPlaceBid(itemId, amount);
      setStatus('synced');
    }
  };

  if (isEventEnded) {
    return (
      <div className="flex items-center gap-1.5 justify-center w-full max-w-[200px] mx-auto px-3 py-1.5 rounded-lg bg-gray-950/80 border border-gray-800 text-gray-500 text-xs font-medium cursor-not-allowed">
        <Lock className="w-3.5 h-3.5 text-gray-500" />
        <span>Bidding Closed</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 justify-center w-full max-w-[200px] mx-auto">
      <div className="relative w-full">
        <Input
          type="number"
          step="0.01"
          placeholder="Enter lower bid ($)"
          value={val}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isSubmitting || isEventEnded}
          className="bg-gray-950 border-gray-700 text-gray-100 h-9 w-full text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono pr-8 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="absolute right-2 top-2.5 flex items-center text-xs">
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          ) : status === 'typing' ? (
            <span className="text-[10px] text-yellow-400 font-bold animate-pulse">⏳ 1s</span>
          ) : status === 'synced' && currentSubmittedAmount ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : null}
        </div>
      </div>
    </div>
  );
});

DebouncedBidInput.displayName = 'DebouncedBidInput';

// ----------------------------------------------------------------------
// Participant Bidding Table Component
// ----------------------------------------------------------------------
const ParticipantBiddingTable: React.FC<ParticipantBiddingTableProps> = ({
  items,
  columns,
  userBids,
  onPlaceBid,
  submittingItemId,
  isEventEnded,
}) => {
  return (
    <div className="w-full flex flex-col gap-4 mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <Gavel className="w-5 h-5 text-emerald-400" /> Item Sourcing & Bidding Catalog
        </h2>
        <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/50">
          {isEventEnded ? (
            <span className="text-red-400 font-bold">🚫 Event Ended - Bidding Closed</span>
          ) : (
            <span>⚡ 1s Auto-Debounced Input (Type to Bid)</span>
          )}
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
        <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700">
          <table className="w-full text-left border-collapse min-w-[800px]">
            {/* Header Row */}
            <thead>
              <tr className="bg-gray-800/90 text-gray-200 text-xs font-bold uppercase tracking-wider border-b border-gray-700">
                <th className="px-4 py-3 text-center border-r border-gray-700 w-12">#</th>
                {columns.map((col, idx) => (
                  <th key={idx} className="px-4 py-3 border-r border-gray-700">
                    {col}
                  </th>
                ))}
                <th className="px-4 py-3 border-r border-gray-700 text-center text-purple-300 w-44 bg-purple-950/30">
                  Your Final Rank
                </th>
                <th className="px-4 py-3 text-center text-emerald-300 w-60 bg-emerald-950/30">
                  Submit Lower Bid ($)
                </th>
              </tr>
            </thead>

            {/* Table Rows */}
            <tbody className="divide-y divide-gray-800 text-sm text-gray-300">
              {items.map((item, rowIndex) => {
                const itemId = item.id || item._id;
                let colData: Record<string, any> = {};

                if (typeof item.column_data === 'string') {
                  try {
                    colData = JSON.parse(item.column_data);
                  } catch {
                    colData = {};
                  }
                } else if (typeof item.column_data === 'object' && item.column_data !== null) {
                  colData = item.column_data;
                }

                const myBid = userBids[itemId];
                const isSubmitting = submittingItemId === itemId;

                return (
                  <tr
                    key={itemId || rowIndex}
                    className={`transition-colors ${
                      rowIndex % 2 === 0 ? 'bg-gray-900' : 'bg-gray-950/60'
                    } hover:bg-gray-800/40`}
                  >
                    <td className="px-4 py-3 text-center font-mono text-xs text-gray-500 border-r border-gray-800">
                      {rowIndex + 1}
                    </td>

                    {columns.map((colKey, colIdx) => (
                      <td key={colIdx} className="px-4 py-3 border-r border-gray-800 font-medium text-gray-200">
                        {colData[colKey] !== undefined ? String(colData[colKey]) : '—'}
                      </td>
                    ))}

                    {/* 1. Your Private Rank & Bid */}
                    <td className="px-4 py-3 border-r border-gray-800 text-center bg-purple-950/10">
                      {myBid ? (
                        <div className="flex flex-col items-center justify-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              myBid.rank === 1
                                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                                : 'bg-gray-700/40 text-gray-300 border border-gray-600/40'
                            }`}
                          >
                            <Trophy className="w-3 h-3" /> Rank #{myBid.rank}
                          </span>
                          <span className="text-xs text-gray-400 mt-1 font-mono">
                            My Bid: <strong className="text-purple-300">${myBid.amount.toLocaleString()}</strong>
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 italic">No bid placed</span>
                      )}
                    </td>

                    {/* 2. Bid Input Cell (Disabled when Event Ended) */}
                    <td className="px-4 py-3 text-center bg-emerald-950/10">
                      <DebouncedBidInput
                        itemId={itemId}
                        currentSubmittedAmount={myBid?.amount}
                        onPlaceBid={onPlaceBid}
                        isSubmitting={isSubmitting}
                        isEventEnded={isEventEnded}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ParticipantBiddingTable;
