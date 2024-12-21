import React from 'react';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import CustomButton from './Button'

const EventCard = ({ event, type, name }) => {
  return (
    <Card
      sx={{
        width: 300,
        height: 300,
        borderRadius: '16px',
        border: '1px solid',
        borderColor: 'grey.300',
        display: 'flex',
        flexDirection: 'column',
        padding: 2,
      }}
    >
      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontWeight: 'bold',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            height: '4em',
          }}
        >
          {event.eventName}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            height: '4em',
            marginTop: 1,
            marginBottom: 2,
          }}
        >
          {event.description}
        </Typography>
        <Box>
          <Link
            to={`/home/event-room/${event._id}`}
            style={{ textDecoration: 'none' }}
          >
            <CustomButton type={type} label={name} />
          </Link>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EventCard;
