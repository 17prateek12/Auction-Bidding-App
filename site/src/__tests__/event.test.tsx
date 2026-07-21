import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventCard from '../components/reusable-components/event-card';

describe('Frontend Event Component Tests', () => {
  const sampleActiveEvent = {
    id: 'test-event-101',
    name: 'Live Electronics Auction',
    description: 'Reverse auction event for mobile laptops and smartphones',
    event_status: 'active',
    event_date: '2026-07-21T10:00:00.000Z',
    start_time: '2026-07-21T10:00:00.000Z',
    end_time: '2026-07-21T14:00:00.000Z',
    creator_id: 'user-xyz',
  };

  const sampleUpcomingEvent = {
    id: 'test-event-102',
    name: 'Upcoming Machinery Fleet',
    description: 'Upcoming sourcing auction for heavy excavators',
    event_status: 'upcoming',
    event_date: '2026-07-25T09:00:00.000Z',
    start_time: '2026-07-25T09:00:00.000Z',
    end_time: '2026-07-25T12:00:00.000Z',
    creator_id: 'user-xyz',
  };

  const sampleEndedEvent = {
    id: 'test-event-103',
    name: 'Ended Freight Route Contract',
    description: 'Finalized contract for logistics routes',
    event_status: 'ended',
    event_date: '2026-07-15T08:00:00.000Z',
    start_time: '2026-07-15T08:00:00.000Z',
    end_time: '2026-07-15T12:00:00.000Z',
    creator_id: 'user-xyz',
  };

  it('renders Live Bidding event card with title and Participate button for participants', () => {
    render(<EventCard event={sampleActiveEvent} />);

    expect(screen.getByText('Live Electronics Auction')).toBeInTheDocument();
    expect(screen.getByText('Live Bidding')).toBeInTheDocument();
    expect(screen.getByText(/Participate \/ Bid Now/i)).toBeInTheDocument();
  });

  it('renders Upcoming event card with disabled Starts at button', () => {
    render(<EventCard event={sampleUpcomingEvent} />);

    expect(screen.getByText('Upcoming Machinery Fleet')).toBeInTheDocument();
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
    expect(screen.getByText(/Starts at/i)).toBeInTheDocument();
  });

  it('renders Ended event card with View Results & AI Chat button', () => {
    render(<EventCard event={sampleEndedEvent} />);

    expect(screen.getByText('Ended Freight Route Contract')).toBeInTheDocument();
    expect(screen.getByText('Ended')).toBeInTheDocument();
    expect(screen.getByText(/View Results & AI Chat/i)).toBeInTheDocument();
  });
});
