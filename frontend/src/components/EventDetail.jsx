import React, {useState, useEffect} from 'react';
import { Box, Typography, TextField, Button, Grid, CircularProgress,Card, CardContent } from '@mui/material';

const EventDetail = ({event}) => {

    const [timeRemaining, setTimeRemaining] = useState(null);

    useEffect(() => {
        const calculateTimeRemaining = () => {
          const now = new Date();
          const eventEndTime = new Date(event.endTime);
          const timeDiff = eventEndTime - now;
          if (timeDiff > 0) {
            const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
            const seconds = Math.floor((timeDiff / 1000) % 60);
            setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
          } else {
            setTimeRemaining('Event Ended');
          }
        };
    
        calculateTimeRemaining();
        const timer = setInterval(calculateTimeRemaining, 1000);
    
        return () => clearInterval(timer);
      }, [event.endTime]);


  return (
    <Card sx={{ maxWidth: '100%', padding: 2, border: '2px solid', borderColor: 'primary.main', borderRadius: 2 }}>
    <CardContent>
      <Typography variant="h4" color="primary" gutterBottom>
        {event.eventName}
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        {event.description}
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Date:
            </Typography>
            <Typography variant="body2">{new Date(event.eventDate).toLocaleDateString()}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Time:
            </Typography>
            <Typography variant="body2">
              {new Date(event.startTime).toLocaleTimeString()} -{' '}
              {new Date(event.endTime).toLocaleTimeString()}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Time Remaining:
            </Typography>
            <Typography variant="body2" color={timeRemaining === 'Event Ended' ? 'error' : 'success'}>
              {timeRemaining}
            </Typography>
            {timeRemaining !== 'Event Ended' && (
              <Box display="flex" alignItems="center" mt={1}>
                <CircularProgress
                  variant="determinate"
                  value={
                    (100 *
                      (new Date() - new Date(event.startTime))) /
                    (new Date(event.endTime) - new Date(event.startTime))
                  }
                  size={20}
                />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  Event in progress
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>
    </CardContent>
  </Card>
  )
}

export default EventDetail