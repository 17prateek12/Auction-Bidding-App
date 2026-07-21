'use client';

import React, { useRef } from 'react';
import { useCreateEventStore } from '@/store/create-event-form-store';
import { useCreateEvent } from '@/hooks/useCreateEvent';
import { Input } from '../ui/input';
import * as XLSX from 'xlsx';
import { Trash2, Plus, PlusCircle, Upload, CheckCircle2, RotateCcw, FileSpreadsheet } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'react-toastify';

const RowColumnCreator = () => {
  const { data, setField, reset: resetStore } = useCreateEventStore();
  const { columns, rows } = data;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const createEventMutation = useCreateEvent();

  const addColumn = () => {
    const colName = `Column ${columns.length + 1}`;
    setField('columns', [...columns, colName]);
  };

  const updateColumnName = (index: number, newName: string) => {
    const oldName = columns[index];
    const updatedCols = [...columns];
    updatedCols[index] = newName;
    setField('columns', updatedCols);

    // Update row keys to match new column name
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

  const updateCell = (rowIndex: number, colKey: string, value: string) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      [colKey]: value,
    };
    setField('rows', updatedRows);
  };

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

      {/* Dynamic Item Table (Full Width 100%, Responsive Overflow Scroll) */}
      {columns.length > 0 ? (
        <div className="w-full overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
          <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700">
            <table className="w-full text-left border-collapse min-w-full">
              {/* Header */}
              <thead>
                <tr className="bg-gray-800/90 text-gray-200 border-b border-gray-700 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3 border-r border-gray-700 w-16 text-center">#</th>
                  {columns.map((col, idx) => (
                    <th key={idx} className="px-4 py-3 border-r border-gray-700 min-w-[180px]">
                      <div className="flex items-center justify-between gap-2">
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
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center w-20">Action</th>
                </tr>
              </thead>

              {/* Rows */}
              <tbody className="divide-y divide-gray-800 text-sm">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 2} className="px-4 py-8 text-center text-gray-400">
                      No items added yet. Click <strong>Add Row</strong> or <strong>Bulk Upload Excel</strong>.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-800/40 transition-colors">
                      <td className="px-4 py-2 text-center text-gray-400 font-mono text-xs border-r border-gray-800">
                        {rowIndex + 1}
                      </td>

                      {columns.map((colKey, colIndex) => (
                        <td key={colIndex} className="px-3 py-2 border-r border-gray-800">
                          <Input
                            type="text"
                            value={row[colKey] ?? ''}
                            onChange={(e) => updateCell(rowIndex, colKey, e.target.value)}
                            placeholder={`Enter ${colKey}`}
                            className="bg-gray-950/80 border-gray-700 text-gray-100 h-9 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full"
                          />
                        </td>
                      ))}

                      <td className="px-4 py-2 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteRow(rowIndex)}
                          className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
                          title="Delete row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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

export default RowColumnCreator;