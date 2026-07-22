'use client';

import React, { memo, useMemo } from 'react';
import { Trophy, ShieldAlert, Users, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { FixedSizeList as List, areEqual } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

interface CreatorLeaderboardTableProps {
  items: any[];
  columns: string[];
  leaderboards: Record<string, any[]>;
}

interface RowData {
  items: any[];
  columns: string[];
  leaderboards: Record<string, any[]>;
}

// ----------------------------------------------------------------------
// Static Row Component (Defined OUTSIDE parent to prevent unmounting resets)
// ----------------------------------------------------------------------
const CreatorTableRow = memo(({ index, style, data }: { index: number; style: React.CSSProperties; data: RowData }) => {
  const { items, columns, leaderboards } = data;
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

  const itemBids = leaderboards[itemId] || [];
  const rank1Bid = itemBids.length > 0 ? itemBids[0] : null;

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

      {/* Leading Bidder (Rank #1) */}
      <div className="w-[200px] flex-shrink-0 border-r border-gray-800/80 text-center bg-yellow-950/10 self-stretch flex flex-col items-center justify-center px-4">
        {rank1Bid ? (
          <div className="flex flex-col items-center justify-center">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-yellow-400 truncate max-w-[180px]">
              <Trophy className="w-3.5 h-3.5 flex-shrink-0" />
              {rank1Bid.userName || rank1Bid.user_name || rank1Bid.userEmail || 'Participant'}
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-500 italic">No bids yet</span>
        )}
      </div>

      {/* Lowest Price ($) */}
      <div className="w-[160px] flex-shrink-0 border-r border-gray-800/80 text-center bg-emerald-950/10 self-stretch flex items-center justify-center px-4">
        {rank1Bid ? (
          <span className="font-mono font-bold text-emerald-400 text-base">
            ${parseFloat(rank1Bid.amount).toLocaleString()}
          </span>
        ) : (
          <span className="text-xs text-gray-500 italic">—</span>
        )}
      </div>

      {/* All Participant Bids & Ranks */}
      <div className="w-[220px] flex-shrink-0 text-center bg-blue-950/10 self-stretch flex items-center justify-center px-4">
        {itemBids.length > 0 ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 bg-gray-950 border-gray-700 text-gray-200 hover:bg-gray-800 text-xs flex items-center justify-between gap-1.5 w-full max-w-[180px] mx-auto shadow-sm"
              >
                <span className="flex items-center gap-1 text-blue-300 font-semibold truncate">
                  <Users className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  {itemBids.length} Bidder{itemBids.length > 1 ? 's' : ''}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 bg-gray-900 border-gray-700 text-gray-100 shadow-2xl rounded-xl">
              <div className="space-y-2">
                <div className="text-xs font-bold text-gray-300 border-b border-gray-800 pb-1.5 flex items-center justify-between">
                  <span>Live Leaderboard Ranks</span>
                  <span className="text-gray-500 font-normal">{itemBids.length} total</span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-gray-700">
                  {itemBids.map((bid: any, bIdx: number) => (
                    <div
                      key={bIdx}
                      className={`text-xs p-2 rounded-lg flex items-center justify-between border ${
                        bIdx === 0
                          ? 'bg-yellow-950/30 border-yellow-700/50 text-yellow-300 font-bold'
                          : 'bg-gray-950/80 border-gray-800 text-gray-400 font-normal'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                        <span className="font-mono text-[11px] text-gray-400">#{bIdx + 1}</span>
                        <span className="truncate">{bid.userName || bid.user_name || bid.userEmail || 'Bidder'}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-400">
                        ${parseFloat(bid.amount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <span className="text-xs text-gray-500 italic">Awaiting bids...</span>
        )}
      </div>
    </div>
  );
}, areEqual);

CreatorTableRow.displayName = 'CreatorTableRow';

// ----------------------------------------------------------------------
// Main Creator Leaderboard Component
// ----------------------------------------------------------------------
const CreatorLeaderboardTable: React.FC<CreatorLeaderboardTableProps> = ({
  items,
  columns,
  leaderboards,
}) => {
  const rowData: RowData = useMemo(() => ({
    items,
    columns,
    leaderboards,
  }), [items, columns, leaderboards]);

  return (
    <div className="w-full flex flex-col gap-4 mt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-purple-400" />
          <h2 className="text-xl font-bold text-gray-100">Live Creator Observation Dashboard</h2>
        </div>
        <span className="text-xs text-purple-300 bg-purple-950/60 px-3 py-1 rounded-full border border-purple-800/50">
          ⚡ Virtualized Creator Monitor
        </span>
      </div>

      <div className="w-full overflow-hidden rounded-xl border border-purple-900/50 bg-gray-900 shadow-2xl h-[550px] flex flex-col">
        {/* Table Header */}
        <div className="flex items-center bg-gray-800/90 text-gray-200 text-xs font-bold uppercase tracking-wider border-b border-gray-700 h-12 select-none">
          <div className="w-[60px] flex-shrink-0 text-center border-r border-gray-700 py-3">#</div>
          {columns.map((col, idx) => (
            <div key={idx} className="flex-1 min-w-[120px] px-4 py-3 border-r border-gray-700 truncate">
              {col}
            </div>
          ))}
          <div className="w-[200px] flex-shrink-0 border-r border-gray-700 text-center text-yellow-300 bg-yellow-950/30 py-3">
            Leading Bidder (Rank #1)
          </div>
          <div className="w-[160px] flex-shrink-0 border-r border-gray-700 text-center text-emerald-300 bg-emerald-950/30 py-3">
            Lowest Price ($)
          </div>
          <div className="w-[220px] flex-shrink-0 text-center text-blue-300 bg-blue-950/30 py-3">
            All Participant Bids & Ranks
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
                {CreatorTableRow}
              </List>
            )}
          </AutoSizer>
        </div>
      </div>
    </div>
  );
};

export default CreatorLeaderboardTable;
