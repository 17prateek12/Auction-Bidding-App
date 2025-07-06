'use client';
import React, { useRef, useMemo, useCallback, useEffect } from 'react'
import AllButton from '../reusable-components/all-button'
import { useCreateEventStore } from '@/store/create-event-form-store';
import { Input } from '../ui/input';
import * as XLSX from 'xlsx';
import { Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'react-toastify';
import { VariableSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';



const RowColumnCreator = () => {
    const { data, setField } = useCreateEventStore();
    const { columns, rows } = data;
    const inputRef = useRef<HTMLInputElement | null>(null);

    const gridRef = useRef<Grid>(null);

    const rowHeights = useMemo(() => rows.map(() => 50), [rows]);
    const getRowHeight = useCallback((index: number) => rowHeights[index], [rowHeights]);

    const defaultColumnWidth = 200;

    //const columnWidths = useMemo(() => {
    //    return [...columns.map(() => 200), 80]; // 80 for the Action column
    //}, [columns]);
    const width = window.innerWidth;

    const columnWidths = useMemo(() => {
        const actionColWidth = 80;
        const minColWidth = 200;
        const dynamicColsCount = columns.length;
      
        const availableWidth = width - actionColWidth;
        const idealColWidth = availableWidth / dynamicColsCount;
      
        // If there's more space, distribute it. Otherwise, fall back to minColWidth
        const actualColWidth = Math.max(minColWidth, Math.floor(idealColWidth));
      
        return [...Array(dynamicColsCount).fill(actualColWidth), actionColWidth];
      }, [columns, width]);

    const getColumnwidth = useCallback(
        (index: number) => columnWidths[index] ?? defaultColumnWidth,
        [columnWidths]
    );

    useEffect(() => {
        gridRef.current?.resetAfterColumnIndex(0, true);
    }, [columns]);


    const addColumn = () => {
        const newCol = prompt('Enter column name');
        if (!newCol || columns.includes(newCol)) return;

        const updatedColumns = [...columns, newCol];
        const updatedRows = rows.map((row, idx) => ({
            ...row,
            [newCol]: ''
        }));

        setField('columns', updatedColumns);
        setField('rows', updatedRows);
    };


    const addRow = () => {
        const newRow = Object.fromEntries(columns.map((col, idx) => [col, '']));
        setField('rows', [...rows, newRow]);
        console.log([...rows, newRow])
    };

    const deleteColumn = (colIdx: number) => {
        const updateColumn = columns.filter((_, index) => index !== colIdx);
        const updateRow = rows.map(row => {
            if (Array.isArray(row)) {
                return row.filter((_: unknown, index: number) => index !== colIdx);
            } else {
                const keyToRemove = columns[colIdx];
                const { [keyToRemove]: _, ...rest } = row;
                return rest;
            }
        });
        setField('columns', updateColumn);
        setField('rows', updateRow);
    }

    const deleteRow = (rowIdx: number) => {
        const updateRow = rows.filter((_, index) => index !== rowIdx);
        setField('rows', updateRow);
    }

    const updateCell = (rowIndex: number, column: string, value: string) => {
        const updateRows = [...rows];
        updateRows[rowIndex][column] = value;
        setField('rows', updateRows);
    };

    const handleFileClick = () => {
        inputRef.current?.click();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            toast.warn('Invalid file type. Please upload an Excel file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = evt.target?.result;
            if (!(data instanceof ArrayBuffer)) {
                return;
            }
            try {
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet);

                console.log("Excel JSON Data:", jsonData);

                if (jsonData.length === 0) {
                    return;
                }

                const newColumn = Object.keys(jsonData[0]);
                setField('columns', newColumn);
                setField('rows', jsonData);
                toast.success('Excel upload successfully');
            } catch (error) {
                console.error('Error parsing Excel File', error);
                toast.error(error as string);
            }

        };
        reader.readAsArrayBuffer(file);
    };

    const gridTotalWidth = useMemo(() => columnWidths.reduce((acc, w) => acc + w, 0), [columnWidths]);


    return (
        <div className='flex flex-col gap-2 mt-4 overflow-hidden relative'>
            <div className='flex items-center justify-between gap-4 flex-wrap w-full'>
                <div className='flex items-center gap-4 flex-wrap'>
                    <AllButton text={'Add Column'} onClick={addColumn} />
                    <AllButton text={'Add Row'} onClick={addRow} />
                    <Input
                        type='file'
                        accept='.xlsx, .xls'
                        className='hidden'
                        ref={inputRef}
                        onChange={handleFileUpload} />
                    <AllButton text={'Upload File'} onClick={handleFileClick} />
                </div>
                <div className='flex items-center gap-4 flex-wrap'>
                    <AllButton text={'Submit'} onClick={addRow} />
                    <AllButton text={'Reset'} onClick={addRow} />
                </div>
            </div>
            {columns.length !== 0 ?
                (
                        <div className="w-full flex-1 relative overflow-hidden">
                        <div
                          className=" mx-auto overflow-x-auto border border-gray-200 rounded-md"
                          style={{
                            minWidth: '300px',       // mobile minimum
                            scrollbarWidth:'none',
                            maxWidth:1200,
                            //width: `${gridTotalWidth}px`,
                            width:'100%'

                          }}
                        >
                          <div
                            style={{
                              width: `${gridTotalWidth}px`, // dynamic width based on columns
                              minWidth: '100%',             // never shrink below container
                            }}
                          >
                            {/* Header */}
                            <div className="flex">
                              {columns.map((col, index) => (
                                <div
                                  key={index}
                                  style={{ width: columnWidths[index] }}
                                  className="flex items-center justify-between px-2 py-2 border-r bg-gray-100"
                                >
                                  <span>{col}</span>
                                  <Button
                                    onClick={() => deleteColumn(index)}
                                    className="p-1 bg-transparent hover:text-red-500 text-black"
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              ))}
                              <div
                                style={{ width: columnWidths[columns.length] }}
                                className="bg-gray-100 flex items-center justify-center border-r px-2 py-2"
                              >
                                Action
                              </div>
                            </div>
                      
                            {/* Grid */}
                            <div style={{ minHeight: 200 }}>
                              <AutoSizer disableWidth>
                                {({ height }) => (
                                  <Grid
                                    ref={gridRef}
                                    columnCount={columns.length + 1}
                                    rowCount={rows.length}
                                    columnWidth={getColumnwidth}
                                    rowHeight={getRowHeight}
                                    width={gridTotalWidth}
                                    height={height}
                                    style={{ scrollbarWidth: 'none' }}
                                  >
                                    {({ columnIndex, rowIndex, style }) => {
                                      const isActionCol = columnIndex === columns.length;
                                      const colKey = columns[columnIndex];
                                      return (
                                        <div
                                          key={`${rowIndex}-${columnIndex}`}
                                          style={{
                                            ...style,
                                            padding: '0.5rem',
                                            borderRight: '1px solid #eee',
                                            borderBottom: '1px solid #eee',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                          }}
                                        >
                                          {isActionCol ? (
                                            <Button
                                              variant="ghost"
                                              className="text-red-500 hover:text-red-700 p-1"
                                              onClick={() => deleteRow(rowIndex)}
                                            >
                                              <Trash2 size={16} />
                                            </Button>
                                          ) : (
                                            <Input
                                              value={rows[rowIndex]?.[colKey] ?? ''}
                                              onChange={(e) => updateCell(rowIndex, colKey, e.target.value)}
                                              className="w-full h-full"
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

                ) :
                (
                    <></>
                )}

        </div>
    )
}

export default RowColumnCreator

{/*<div className='max-w-[1200px] border-none flex flex-col gap-2 mt-4 overflow-scroll'
                style={columns.length === 0 ? {} : { minHeight: 300 }}>
                <div className="flex w-full">
                    {columns.map((col, index) => (
                        <div
                            key={index}
                            style={{ width: columnWidths[index], minWidth: columnWidths[index] }}
                            className="flex items-center justify-between px-2 py-2 border-r bg-gray-100"
                        >
                            <span>{col}</span>
                            <Button
                                onClick={() => deleteColumn(index)}
                                className="p-1 bg-transparent hover:text-red-500 text-black"
                            >
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    ))}
                    <div
                        style={{ width: columnWidths[columns.length], minWidth: columnWidths[columns.length] }}
                        className="bg-gray-100 flex items-center justify-center border-r px-2 py-2"
                    >
                        Action
                    </div>
                </div>
                <AutoSizer>
                    {({ height, width }) => {
                        console.log('AutoSizer dimensions:', { height, width });
                        return (
                            <Grid
                                ref={gridRef}
                                columnCount={columns.length + 1} // +1 for the Action column
                                rowCount={rows.length}
                                columnWidth={getColumnwidth}
                                rowHeight={getRowHeight}
                                width={width}
                                height={height}
                            >
                                {({ columnIndex, rowIndex, style }) => {
                                    const isActionCol = columnIndex === columns.length;

                                    if (isActionCol) {
                                        return (
                                            <div
                                                key={`action-${rowIndex}`}
                                                style={{
                                                    ...style,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderBottom: '1px solid #eee',
                                                    borderRight: '1px solid #eee',
                                                }}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                    onClick={() => deleteRow(rowIndex)}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        );
                                    }

                                    const colKey = columns[columnIndex];
                                    return (
                                        <div
                                            key={`${rowIndex}-${columnIndex}`}
                                            style={{
                                                ...style,
                                                padding: '0.5rem',
                                                borderRight: '1px solid #eee',
                                                borderBottom: '1px solid #eee',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <Input
                                                value={rows[rowIndex]?.[colKey] ?? ''}
                                                onChange={(e) => updateCell(rowIndex, colKey, e.target.value)}
                                                className="w-full h-full"
                                            />
                                        </div>
                                    );
                                }}
                            </Grid>
                        )
                    }}
                </AutoSizer>
            </div> */}

{/*
    {rows?.map((row, rowId) => (
                            <TableRow key={rowId} className='flex items-center gap-4'>
                                {columns.map((col, idx) => (
                                    <TableCell key={idx}>
                                        <Input
                                            type='text'
                                            value={row[col] ?? ''}
                                            onChange={(e) => updateCell(rowId, col, e.target.value)}
                                            className='w-full px-2 py-1'
                                        />
                                    </TableCell>
                                ))}
                                <TableCell>
                                    <Button onClick={() => deleteRow(rowId)}
                                        className='px-2 py-2 shadow-none border-collapse bg-transparent hover:text-red-500 text-white'>
                                        <Trash2 size={16}  />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
    */}


//    <div
//    className="w-full flex-1 relative"
//    style={{
//      display: 'flex',
//      justifyContent: 'center', // center content in wide viewports
//    }}
//        //className="w-full"
//     //   style={{
//     //       display: 'flex',
//     //       justifyContent: 'center', // center content in wide viewports
//     //   }}
//    //style={columns.length === 0 ?
//    //    {} :
//    //    {
//    //        overflowX: 'scroll',
//    //        scrollbarWidth: 'none',
//    //        width: `${gridTotalWidth}px`, // fixed width for the grid
//    //        minWidth: '250px', // ensures minimum full width
//    //        maxWidth: 1200,
//    //        overflowY: 'hidden',
//    //        border: '1px solid white',
//    //        borderRadius: '12px',
//    //        display: 'flex',
//    //        flexDirection: 'column',
//    //        marginTop: '1rem',
//    //        gap: '0.5rem',
//    //        padding: 0
//    //    }}
//    >
//        <div className='flex-1'
//            style={{
//                //maxWidth:'1200px',
//                display:'flex',
//                //minWidth: '250px',
//                width:'100%',
//                overflowX: 'auto', // allow horizontal scroll on small devices
//                border: '1px solid #e5e7eb',
//                borderRadius: '8px',
//            }}
//            >
//            <div
//                style={{
//                    width: `100%`, // computed from columns
//                    minWidth: '100%', // ensure it fills container at minimum
//                }}
//            >
//                <div className="flex">
//                    {columns.map((col, index) => (
//                        <div
//                            key={index}
//                            style={{ width: columnWidths[index], minWidth: columnWidths[index] }}
//                            className="flex items-center justify-between px-2 py-2 border-r bg-gray-100 text-base text-black font-medium"
//                        >
//                            <span>{col}</span>
//                            <Button
//                                onClick={() => deleteColumn(index)}
//                                className="p-1 bg-transparent hover:text-red-500 text-black"
//                            >
//                                <Trash2 size={16} />
//                            </Button>
//                        </div>
//                    ))}
//                    {columns.length === 0 ? (
//                        <></>
//                    ) : (
//                        <div
//                            style={{ width: columnWidths[columns.length], minWidth: columnWidths[columns.length] }}
//                            className="bg-gray-100 flex items-center justify-center border-r px-2 py-2"
//                        >
//                            Action
//                        </div>
//                    )}
//                </div>
//                <div style={{ minHeight: 200 }}>
//                    <AutoSizer disableWidth>
//                        {({ height }) => (
//
//                            <Grid
//                                ref={gridRef}
//                                columnCount={columns.length + 1}
//                                rowCount={rows.length}
//                                columnWidth={getColumnwidth}
//                                rowHeight={getRowHeight}
//                                width={gridTotalWidth}
//                                height={height}
//                                style={{ scrollbarWidth: 'none' }}
//                            >
//                                {({ columnIndex, rowIndex, style }) => {
//                                    const isActionCol = columnIndex === columns.length;
//                                    const colKey = columns[columnIndex];
//                                    return (
//                                        <div
//                                            key={`${rowIndex}-${columnIndex}`}
//                                            style={{
//                                                ...style,
//                                                padding: '0.5rem',
//                                                borderRight: '1px solid #eee',
//                                                borderBottom: '1px solid #eee',
//                                                display: 'flex',
//                                                alignItems: 'center',
//                                                justifyContent: 'space-between',
//
//                                            }}
//                                        >
//                                            {isActionCol ? (
//                                                <Button
//                                                    variant="ghost"
//                                                    className="text-red-500 hover:text-red-700 p-1"
//                                                    onClick={() => deleteRow(rowIndex)}
//                                                >
//                                                    <Trash2 size={16} />
//                                                </Button>
//                                            ) : (
//                                                <Input
//                                                    value={rows[rowIndex]?.[colKey] ?? ''}
//                                                    onChange={(e) => updateCell(rowIndex, colKey, e.target.value)}
//                                                    className="w-full h-full text-white font-normal text-[14px]"
//                                                />
//                                            )}
//                                        </div>
//                                    );
//                                }}
//                            </Grid>
//                        )}
//                    </AutoSizer>
//                </div>
//            </div>
//        </div>
//    </div>