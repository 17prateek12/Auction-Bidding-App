'use client';

import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import { Input } from '../ui/input';
import { Gavel, Trophy, Lock } from 'lucide-react';
import { FixedSizeList as List, areEqual } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

interface ParticipantBiddingTableProps {
  items: any[];
  columns: string[];
  userBids: Record<string, { amount: number; rank: number }>;
  onPlaceBid: (itemId: string, amount: number) => void;
  submittingItemId: string | null;
  isEventEnded?: boolean;
}

interface DebouncedBidInputProps {
  itemId: string;
  currentSubmittedAmount: number | undefined;
  onPlaceBid: (itemId: string, amount: number) => void;
  isSubmitting: boolean;
  isEventEnded?: boolean;
}

const DebouncedBidInput = memo(({ itemId, currentSubmittedAmount, onPlaceBid, isEventEnded }: DebouncedBidInputProps) => {
  const [val, setVal] = useState<string>(currentSubmittedAmount ? String(currentSubmittedAmount) : '');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isFocused = useRef<boolean>(false);

  useEffect(() => {
    // Only update the input value with server data if the user is not actively editing/focusing the field
    if (currentSubmittedAmount !== undefined && !isFocused.current) {
      setVal(currentSubmittedAmount ? String(currentSubmittedAmount) : '');
    }
  }, [currentSubmittedAmount]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isEventEnded) return;

    const newText = e.target.value;
    setVal(newText);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      const amount = parseFloat(newText);
      if (!isNaN(amount) && amount > 0 && amount !== currentSubmittedAmount) {
        onPlaceBid(itemId, amount);
      }
    }, 1000);
  };

  const handleFocus = () => {
    isFocused.current = true;
  };

  const handleBlur = () => {
    isFocused.current = false;
    if (isEventEnded) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    const amount = parseFloat(val);
    if (!isNaN(amount) && amount > 0 && amount !== currentSubmittedAmount) {
      onPlaceBid(itemId, amount);
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
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={isEventEnded}
          className="bg-gray-950 border-gray-700 text-gray-100 h-9 w-full text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
});

DebouncedBidInput.displayName = 'DebouncedBidInput';

// Define row item data type
interface RowData {
  items: any[];
  columns: string[];
  userBids: Record<string, { amount: number; rank: number }>;
  onPlaceBid: (itemId: string, amount: number) => void;
  submittingItemId: string | null;
  isEventEnded?: boolean;
}

// ----------------------------------------------------------------------
// Static Row Component (Defined OUTSIDE parent to prevent unmounting resets)
// ----------------------------------------------------------------------
const BiddingTableRow = memo(({ index, style, data }: { index: number; style: React.CSSProperties; data: RowData }) => {
  const { items, columns, userBids, onPlaceBid, submittingItemId, isEventEnded } = data;
  const item = items[index];
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
    <div
      style={style}
      className={`flex items-center text-sm text-gray-300 border-b border-gray-800/80 transition-colors hover:bg-gray-800/20 ${
        index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-950/60'
      }`}
    >
      {/* Index */}
      <div className="w-[60px] flex-shrink-0 text-center font-mono text-xs text-gray-500 border-r border-gray-800/80 self-stretch flex items-center justify-center">
        {index + 1}
      </div>

      {/* Dynamic Columns */}
      {columns.map((colKey, colIdx) => (
        <div
          key={colIdx}
          className="flex-1 min-w-[120px] px-4 py-2 border-r border-gray-800/80 truncate self-stretch flex items-center"
        >
          {colData[colKey] !== undefined ? String(colData[colKey]) : '—'}
        </div>
      ))}

      {/* Your Final Rank */}
      <div className="w-[200px] flex-shrink-0 border-r border-gray-800/80 text-center bg-purple-950/10 self-stretch flex flex-col items-center justify-center px-4">
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
            <span className="text-[11px] text-gray-400 mt-1 font-mono">
              My Bid: <strong className="text-purple-300">${myBid.amount.toLocaleString()}</strong>
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-500 italic">No bid placed</span>
        )}
      </div>

      {/* Submit Bid Input */}
      <div className="w-[240px] flex-shrink-0 text-center bg-emerald-950/10 self-stretch flex items-center justify-center px-4">
        <DebouncedBidInput
          itemId={itemId}
          currentSubmittedAmount={myBid?.amount}
          onPlaceBid={onPlaceBid}
          isSubmitting={isSubmitting}
          isEventEnded={isEventEnded}
        />
      </div>
    </div>
  );
}, areEqual);

BiddingTableRow.displayName = 'BiddingTableRow';

// ----------------------------------------------------------------------
// Main Participant Table Component
// ----------------------------------------------------------------------
const ParticipantBiddingTable: React.FC<ParticipantBiddingTableProps> = ({
  items,
  columns,
  userBids,
  onPlaceBid,
  submittingItemId,
  isEventEnded,
}) => {
  // Memoize the item data to prevent unnecessary row re-renders while typing
  const rowData: RowData = useMemo(() => ({
    items,
    columns,
    userBids,
    onPlaceBid,
    submittingItemId,
    isEventEnded,
  }), [items, columns, userBids, onPlaceBid, submittingItemId, isEventEnded]);

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
            <span>⚡ Virtualized Live Catalog (Type to Bid)</span>
          )}
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl h-[550px] flex flex-col">
        {/* Table Header */}
        <div className="flex items-center bg-gray-800/90 text-gray-200 text-xs font-bold uppercase tracking-wider border-b border-gray-700 h-12 select-none">
          <div className="w-[60px] flex-shrink-0 text-center border-r border-gray-700 py-3">#</div>
          {columns.map((col, idx) => (
            <div key={idx} className="flex-1 min-w-[120px] px-4 py-3 border-r border-gray-700 truncate">
              {col}
            </div>
          ))}
          <div className="w-[200px] flex-shrink-0 border-r border-gray-700 text-center text-purple-300 bg-purple-950/30 py-3">
            Your Final Rank
          </div>
          <div className="w-[240px] flex-shrink-0 text-center text-emerald-300 bg-emerald-950/30 py-3">
            Submit Lower Bid ($)
          </div>
        </div>

        {/* Virtualized Body */}
        <div className="flex-1 min-h-0 bg-gray-900">
          <AutoSizer>
            {({ height, width }) => (
              <List
                height={height}
                itemCount={items.length}
                itemSize={56}
                width={width}
                itemData={rowData}
                className="scrollbar-thin scrollbar-thumb-gray-850"
              >
                {BiddingTableRow}
              </List>
            )}
          </AutoSizer>
        </div>
      </div>
    </div>
  );
};

export default ParticipantBiddingTable;
