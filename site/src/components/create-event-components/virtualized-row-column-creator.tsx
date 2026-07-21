'use client';

import React, { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useCreateEventStore } from '@/store/create-event-form-store';
import { useCreateEvent } from '@/hooks/useCreateEvent';
import { Input } from '../ui/input';
import * as XLSX from 'xlsx';
import { Trash2, Plus, PlusCircle, Upload, CheckCircle2, RotateCcw, FileSpreadsheet } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'react-toastify';
import { VariableSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

// ----------------------------------------------------------------------
// Memoized Isolated Input Cell (0ms typing latency)
// ----------------------------------------------------------------------
interface VirtualCellProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

const VirtualCellInput = memo(({ value: initialValue, onChange, placeholder }: VirtualCellProps) => {
  const [localVal, setLocalVal] = useState(initialValue ?? '');

  useEffect(() => {
    setLocalVal(initialValue ?? '');
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalVal(e.target.value);
  };

  const handleBlur = () => {
    if (localVal !== initialValue) {
      onChange(localVal);
    }
  };

  return (
    <Input
      type="text"
      value={localVal}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className="bg-gray-950/80 border-gray-700 text-gray-100 h-9 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full font-sans transition-colors"
    />
  );
});

VirtualCellInput.displayName = 'VirtualCellInput';

// ----------------------------------------------------------------------
// Virtualized Row Column Creator Component
// ----------------------------------------------------------------------
const VirtualizedRowColumnCreator = () => {
  const { data, setField, reset: resetStore } = useCreateEventStore();
  const { columns, rows } = data;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const gridRef = useRef<Grid | null>(null);
  const createEventMutation = useCreateEvent();

  const [containerWidth, setContainerWidth] = useState(1200);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setContainerWidth(window.innerWidth - 300);
      const handleResize = () => setContainerWidth(Math.max(600, window.innerWidth - 300));
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const addColumn = () => {
    const colName = `Column ${columns.length + 1}`;
    setField('columns', [...columns, colName]);
  };

  const updateColumnName = (index: number, newName: string) => {
    const oldName = columns[index];
    const updatedCols = [...columns];
    updatedCols[index] = newName;
    setField('columns', updatedCols);

    const updatedRows = rows.map((row) => {
      const newRow = { ...row };
      if (oldName in newRow) {
        newRow[newName] = newRow[oldName];
        delete newRow[oldName];
      }
      return newRow;
    });
    setField('rows', updatedRows);
  };

  const deleteColumn = (index: number) => {
    const colToDelete = columns[index];
    const updatedCols = columns.filter((_, i) => i !== index);
    setField('columns', updatedCols);

    const updatedRows = rows.map((row) => {
      const newRow = { ...row };
      delete newRow[colToDelete];
      return newRow;
    });
    setField('rows', updatedRows);
  };

  const addRow = () => {
    if (columns.length === 0) {
      toast.warn('Please add at least one column first.');
      return;
    }
    const newRow = Object.fromEntries(columns.map((col) => [col, '']));
    setField('rows', [...rows, newRow]);
  };

  const deleteRow = (index: number) => {
    const updatedRows = rows.filter((_, i) => i !== index);
    setField('rows', updatedRows);
  };

  const updateCell = useCallback(
    (rowIndex: number, colKey: string, value: string) => {
      const updatedRows = [...rows];
      updatedRows[rowIndex] = {
        ...updatedRows[rowIndex],
        [colKey]: value,
      };
      setField('rows', updatedRows);
    },
    [rows, setField]
  );

  const handleFileClick = () => {
    inputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      toast.warn('Please upload an Excel file (.xlsx, .xls) or CSV.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const fileData = evt.target?.result;
      if (!(fileData instanceof ArrayBuffer)) return;
      try {
        const workbook = XLSX.read(fileData, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          toast.warn('Uploaded file is empty.');
          return;
        }

        const newColumns = Object.keys(jsonData[0]);
        setField('columns', newColumns);
        setField('rows', jsonData);
        toast.success(`Excel upload successful! Loaded ${jsonData.length} items.`);
      } catch (error) {
        console.error('Error parsing Excel File:', error);
        toast.error('Failed to parse Excel file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleCreateEventSubmit = () => {
    if (!data.eventName || !data.eventDate || !data.startTime || !data.endTime) {
      toast.warn('Please fill in Event Name, Pick Event Date, Start Time, and End Time.');
      return;
    }
    if (data.rows.length === 0) {
      toast.warn('Please add at least one item row or upload an Excel file.');
      return;
    }
    createEventMutation.mutate(data);
  };

  // Dynamic column widths calculation
  const columnWidths = useMemo(() => {
    const actionColWidth = 70;
    const indexColWidth = 60;
    const minColWidth = 200;
    const dynamicColsCount = columns.length;

    if (dynamicColsCount === 0) return [indexColWidth, actionColWidth];

    const availableWidth = containerWidth - indexColWidth - actionColWidth;
    const idealColWidth = availableWidth / dynamicColsCount;
    const actualColWidth = Math.max(minColWidth, Math.floor(idealColWidth));

    return [indexColWidth, ...Array(dynamicColsCount).fill(actualColWidth), actionColWidth];
  }, [columns, containerWidth]);

  const totalGridWidth = useMemo(() => columnWidths.reduce((acc, w) => acc + w, 0), [columnWidths]);

  const getColumnWidth = useCallback((index: number) => columnWidths[index] ?? 200, [columnWidths]);
  const getRowHeight = useCallback(() => 48, []);

  return (
    <div className="w-full flex flex-col gap-5 mt-6">
      {/* Top Action Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap w-full bg-gray-900/90 p-4 rounded-xl border border-gray-700/80 backdrop-blur-md">
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addColumn}
            className="bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-600 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-blue-400" /> Add Column
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRow}
            className="bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-600 flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" /> Add Row
          </Button>

          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            ref={inputRef}
            onChange={handleFileUpload}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFileClick}
            className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border-purple-500/40 flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4 text-purple-400" /> Bulk Upload Excel
          </Button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            type="button"
            size="sm"
            onClick={handleCreateEventSubmit}
            disabled={createEventMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-900/30"
          >
            <CheckCircle2 className="w-4 h-4" />
            {createEventMutation.isPending ? 'Submitting Event...' : 'Submit Event'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => resetStore()}
            className="text-gray-400 hover:text-red-400 hover:bg-gray-800 flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" /> Reset Form
          </Button>
        </div>
      </div>

      {/* Virtualized Table Container */}
      {columns.length > 0 ? (
        <div className="w-full overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
          <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700">
            <div style={{ minWidth: totalGridWidth }} className="w-full">
              {/* Header Bar */}
              <div className="flex bg-gray-800/90 text-gray-200 border-b border-gray-700 text-xs font-semibold uppercase tracking-wider">
                <div style={{ width: columnWidths[0] }} className="px-3 py-3 border-r border-gray-700 text-center flex items-center justify-center">
                  #
                </div>
                {columns.map((col, idx) => (
                  <div
                    key={idx}
                    style={{ width: columnWidths[idx + 1] }}
                    className="px-4 py-3 border-r border-gray-700 flex items-center justify-between gap-2"
                  >
                    <input
                      type="text"
                      value={col}
                      onChange={(e) => updateColumnName(idx, e.target.value)}
                      className="bg-transparent text-gray-200 font-bold focus:outline-none focus:bg-gray-700/50 px-1 py-0.5 rounded w-full"
                      title="Click to rename column"
                    />
                    <button
                      type="button"
                      onClick={() => deleteColumn(idx)}
                      className="text-gray-400 hover:text-red-400 transition-colors p-1 rounded hover:bg-gray-700/50"
                      title="Delete column"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div style={{ width: columnWidths[columns.length + 1] }} className="px-3 py-3 text-center flex items-center justify-center">
                  Action
                </div>
              </div>

              {/* Virtualized Window Grid */}
              <div style={{ height: Math.min(500, Math.max(200, rows.length * 48)) }} className="w-full relative">
                <AutoSizer disableWidth>
                  {({ height }) => (
                    <Grid
                      ref={gridRef}
                      columnCount={columns.length + 2} // index + columns + action
                      rowCount={rows.length}
                      columnWidth={getColumnWidth}
                      rowHeight={getRowHeight}
                      width={totalGridWidth}
                      height={height}
                    >
                      {({ columnIndex, rowIndex, style }) => {
                        const isIndexCol = columnIndex === 0;
                        const isActionCol = columnIndex === columns.length + 1;
                        const colKey = columns[columnIndex - 1];

                        return (
                          <div
                            key={`${rowIndex}-${columnIndex}`}
                            style={{
                              ...style,
                              borderRight: '1px solid #1f2937',
                              borderBottom: '1px solid #1f2937',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0.25rem 0.5rem',
                              backgroundColor: rowIndex % 2 === 0 ? '#111827' : '#0f172a',
                            }}
                          >
                            {isIndexCol ? (
                              <span className="w-full text-center text-gray-500 font-mono text-xs">
                                {rowIndex + 1}
                              </span>
                            ) : isActionCol ? (
                              <div className="w-full flex items-center justify-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteRow(rowIndex)}
                                  className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 h-7 w-7"
                                  title="Delete row"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <VirtualCellInput
                                value={rows[rowIndex]?.[colKey] ?? ''}
                                onChange={(val) => updateCell(rowIndex, colKey, val)}
                                placeholder={`Enter ${colKey}`}
                              />
                            )}
                          </div>
                        );
                      }}
                    </Grid>
                  )}
                </AutoSizer>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-dashed border-gray-700 bg-gray-900/40 text-center w-full">
          <FileSpreadsheet className="w-12 h-12 text-gray-500 mb-3" />
          <h4 className="text-lg font-bold text-gray-200 mb-1">No Columns or Items Added</h4>
          <p className="text-sm text-gray-400 max-w-md mb-5">
            Start by adding custom product columns or upload your product catalog directly from an Excel sheet.
          </p>
          <div className="flex items-center gap-3">
            <Button type="button" size="sm" onClick={addColumn} className="bg-blue-600 hover:bg-blue-500 text-white">
              <Plus className="w-4 h-4 mr-1" /> Add Column
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={handleFileClick} className="border-purple-500/40 text-purple-300 hover:bg-purple-600/20">
              <Upload className="w-4 h-4 mr-1" /> Upload Excel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualizedRowColumnCreator;
