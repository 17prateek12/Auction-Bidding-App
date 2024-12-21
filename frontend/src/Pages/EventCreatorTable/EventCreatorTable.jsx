import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { io } from 'socket.io-client';
import * as React from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import { Box, Typography, TextField, Button, Grid, CircularProgress,Card, CardContent } from '@mui/material';
import debounce from 'lodash.debounce';
import EventDetail from '../../components/EventDetail';

const socket = io('http://localhost:3000');

const debouncedSubmit = debounce(async (rowId, bidAmount, userId, eventId) => {
  if (!bidAmount || isNaN(bidAmount)) return;

  const bidData = {
    userId,
    amount: bidAmount,
    itemId: rowId,
    eventId,
  };

  try {
    const response = await axios.post('http://localhost:3000/bid', bidData);
    console.log(response.data.message);
  } catch (error) {
    console.log(error.response?.data?.error || 'Error placing bid.');
  }
}, 1000);

const EventCreatorTable = () => {
  const { eventId } = useParams();
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = Cookies.get('userId');
  const [amounts, setAmounts] = useState({});
  const [bidders, setBidders] = useState({});
  const [userRanks, setUserRanks] = useState({});
  

  useEffect(() => {
    const handleUpdateLeaderboard = ({ eventId: updatedEventId, itemId, rankedData }) => {
      if (updatedEventId === eventId) {
        setBidders((prev) => ({
          ...prev,
          [itemId]: rankedData,
        }));
  
        // Update user ranks dynamically
        const userRank = rankedData.find((bid) => bid.userId === userId);
        if (userRank) {
          setUserRanks((prev) => ({
            ...prev,
            [itemId]: userRank.rank,
          }));
        }
      }
    };
  
    socket.on("updateLeaderboard", handleUpdateLeaderboard);
  
    return () => {
      socket.off("updateLeaderboard", handleUpdateLeaderboard);
    };
  }, [eventId, userId]);


   

//  const fetchLeaderboardFallback = async () => {
//    setLoading(true); // Start loading
//    try {
//      for (const item of eventData.items) {
//        for (const row of item.rows) {
//          const rowId = row._id;
//          const response = await fetch(`http://localhost:3000/leaderboard?eventId=${eventId}&itemId=${rowId}`);
//          const data = await response.json();
//          console.log("backup data", data);
//  
//          if (data.rankedData) {
//            setBidders((prev) => ({
//              ...prev,
//              [rowId]: data.rankedData,
//            }));
//  
//            // Update user ranks dynamically
//            const userRank = data.rankedData.find((bid) => bid.userId === userId);
//            if (userRank) {
//              setUserRanks((prev) => ({
//                ...prev,
//                [rowId]: userRank.rank,
//              }));
//            }
//          }
//        }
//      }
//    } catch (error) {
//      console.error("Error fetching fallback leaderboard:", error);
//    } finally {
//      setLoading(false); // Stop loading once data is fetched
//    }
//  };
//  
//  useEffect(() => {
//    if (!socket.connected) {
//      fetchLeaderboardFallback();
//    }
//  }, [eventId, eventData, socket.connected, userId]);
//
//
//  useEffect(() => {
//    const updateData = () => {
//      if (socket.connected) {
//        // Rely on WebSocket for updates
//        console.log("Socket connected, listening for updates.");
//      } else {
//        // Use fallback data fetching
//        console.log("Socket disconnected, using fallback.");
//        fetchLeaderboardFallback();
//      }
//    };
//  
//    updateData();
//  
//    socket.on("connect", updateData);
//    socket.on("disconnect", updateData);
//  
//    return () => {
//      socket.off("connect", updateData);
//      socket.off("disconnect", updateData);
//    };
//  }, [fetchLeaderboardFallback]);
  
  


  // Fetch event data by eventId
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/event/getEvents/${eventId}`);
        const data = response.data;

        // Normalize items and ensure required fields exist
        data.items = data.items.map(item => ({
          ...item,
          columns: item.columns || [], // Ensure columns exist
          rows: item.rows || [],       // Ensure rows exist
        }));
        console.log(data)
        setEventData(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching event data: ", err);
        setError("Failed to load event data.");
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const { event, items } = eventData;


  const handleInputChange = (rowId, value) => {
    setAmounts((prev) => ({ ...prev, [rowId]: value }));

    // Trigger the debounced submit function
    debouncedSubmit(rowId, parseFloat(value), userId, eventId);
  };


  const maxBidders = Math.max(
    ...items.map((item) =>
      item.rows.reduce((max, row) => Math.max(max, (bidders[row._id] || []).length), 0)
    )
  );


  const hasBidders = bidders && Object.keys(bidders).length > 0;


  return (
    <div className="max-w-full h-[100vh] flex flex-col gap-8 my-6 mx-4">
      <EventDetail event={event} />

      {/* Items Table */}
      {
        event.createdBy === userId ? (
          <Paper sx={{
            width: '1280px', display: 'flex', flexDirection: 'column', boxShadow: 3, borderRadius: '8px', overflow: 'scroll', maxWidth: '100%',
            '@media (max-width:1300px)': {
              width: '100%'
            }
          }}>
            <Box sx={{
              display: 'flex', width: '100%', overflowX: 'auto', '@media (max-width:1300px)': {
                width: '100%'
              }
            }}>
              {/* Main Columns Table */}
              <TableContainer
                sx={{
                  flex: hasBidders ? '0 0 40%' : '1 1 100%', // Adjust width based on bidders
                  overflowX: 'auto',
                  borderRight: hasBidders ? '1px solid #e0e0e0' : 'none',
                  padding: '8px',
                  '@media (max-width:1300px)': {
                    width: '50%'
                  }
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      {items.length > 0 &&
                        items[0]?.columns.map((col, index) => (
                          <TableCell
                            key={index}
                            sx={{
                              fontWeight: 'bold',
                              textAlign: 'center',
                              height: 113,
                              minWidth: '150px',
                              backgroundColor: '#fafafa',
                              padding: '16px',
                              borderBottom: '2px solid #e0e0e0',
                            }}
                          >
                            <Typography variant="body1" sx={{ fontSize: '16px' }}>
                              {col}
                            </Typography>
                          </TableCell>
                        ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, itemIndex) =>
                      item.rows.map((row, rowIndex) => (
                        <TableRow
                          key={`${itemIndex}-${rowIndex}`}
                          sx={{
                            '&:hover': { backgroundColor: '#fafafa' },
                            transition: 'background-color 0.3s',
                          }}
                        >
                          {item.columns.map((column, colIndex) => (
                            <TableCell
                              key={colIndex}
                              sx={{
                                minWidth: '150px',
                                width: 'auto',
                                borderBottom: '1px solid #e0e0e0',
                                fontSize: '14px',
                                height: '96px',
                                textAlign: 'center'
                              }}
                            >
                              {row.data[column.toLowerCase()] || '-'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Bidder Data Table */}
              {hasBidders && (
                <TableContainer
                  sx={{
                    flex: '0 0 60%', // 60% width for bidder table
                    overflowX: 'auto',
                    padding: '8px',
                    '@media (max-width:1300px)': {
                      flex: '0 0 30%',
                    }
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        {[...Array(maxBidders).keys()].map((i) => (
                          <TableCell
                            key={`bidder-header-${i}`}
                            sx={{
                              fontWeight: 'bold',
                              textAlign: 'center',
                              height: 113,
                              minWidth: '150px',
                              backgroundColor: '#fafafa',
                              padding: '16px',
                              borderBottom: '2px solid #e0e0e0',
                            }}
                          >
                            <Typography variant="body1" sx={{ fontSize: '16px' }}>
                              Bidder {i + 1}
                            </Typography>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item, itemIndex) =>
                        item.rows.map((row, rowIndex) => (
                          <TableRow
                            key={`${itemIndex}-${rowIndex}`}
                            sx={{
                              '&:hover': { backgroundColor: '#fafafa' },
                              transition: 'background-color 0.3s',
                            }}
                          >
                            {[...Array(maxBidders).keys()].map((i) => {
                              const bidder = (bidders[row._id] || [])[i];
                              return (
                                <TableCell
                                  key={`bidder-${i}`}
                                  sx={{
                                    textAlign: 'center',
                                    minWidth: '150px',
                                    borderBottom: '1px solid #e0e0e0',
                                    fontSize: '14px',
                                    height: '96px'
                                  }}
                                >
                                  {bidder ? (
                                    <>
                                      <Typography variant="body2">{bidder.userId}</Typography>
                                      <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-evenly' }}>
                                        <Typography variant="body2">${bidder.amount}</Typography>
                                        <Typography variant="body2">{bidder.rank}</Typography>
                                      </Box>
                                    </>
                                  ) : (
                                    '-'
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Paper>
        ) : (
          <Paper sx={{ overflowX: 'auto', padding: 2 }}>
            <TableContainer>
              <Table sx={{ minWidth: '100%', borderCollapse: 'collapse' }}>
                <TableHead>
                  <TableRow>
                    {items.length > 0 &&
                      items[0]?.columns.map((col, index) => (
                        <TableCell
                          key={index}
                          sx={{
                            backgroundColor: '#f5f5f5',
                            textAlign: 'left',
                            fontWeight: 'bold',
                            padding: 2,
                          }}
                        >
                          {col}
                        </TableCell>
                      ))}
                    <TableCell
                      sx={{
                        backgroundColor: '#f5f5f5',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        padding: 2,
                      }}
                    >
                      Bid Amount
                    </TableCell>
                    <TableCell
                      sx={{
                        backgroundColor: '#f5f5f5',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        padding: 2,
                      }}
                    >
                      Rank
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item, itemIndex) =>
                    item.rows.map((row, rowIndex) => (
                      <TableRow key={`${itemIndex}-${rowIndex}`}>
                        {item.columns.map((column, colIndex) => (
                          <TableCell
                            key={colIndex}
                            sx={{
                              padding: 2,
                              borderBottom: '1px solid #ddd',
                              fontSize: '14px',
                            }}
                          >
                            {row.data[column.toLowerCase()] || '-'}
                          </TableCell>
                        ))}
                        <TableCell sx={{ padding: 2, borderBottom: '1px solid #ddd' }}>
                          <TextField
                            value={amounts[row._id] || ''}
                            onChange={(e) =>
                              handleInputChange(row._id, e.target.value)
                            }
                            variant="outlined"
                            size="small"
                            sx={{ width: '100%' }}
                          />
                        </TableCell>
                        <TableCell sx={{ padding: 2, borderBottom: '1px solid #ddd' }}>
                          {userRanks[row._id] || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )
      }
    </div>
  );
};

export default EventCreatorTable;