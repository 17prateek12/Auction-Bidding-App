import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventCard from '../components/reusable-components/event-card';

describe('Frontend Event Component Tests', () => {
  const now = new Date();

  // Dynamic active mock times (Starts 1 hour ago, ends 1 hour from now)
  const activeStart = new Date(now.getTime() - 60 * 60 * 1000);
  const activeEnd = new Date(now.getTime() + 60 * 60 * 1000);

  const sampleActiveEvent = {
    id: 'test-event-101',
    name: 'Live Electronics Auction',
    description: 'Reverse auction event for mobile laptops and smartphones',
    event_status: 'active',
    event_date: activeStart.toISOString(),
    start_time: activeStart.toISOString(),
    end_time: activeEnd.toISOString(),
    creator_id: 'user-xyz',
  };

  // Dynamic upcoming mock times (Starts 1 hour from now, ends 2 hours from now)
  const upcomingStart = new Date(now.getTime() + 60 * 60 * 1000);
  const upcomingEnd = new Date(now.getTime() + 120 * 60 * 1000);

  const sampleUpcomingEvent = {
    id: 'test-event-102',
    name: 'Upcoming Machinery Fleet',
    description: 'Upcoming sourcing auction for heavy excavators',
    event_status: 'upcoming',
    event_date: upcomingStart.toISOString(),
    start_time: upcomingStart.toISOString(),
    end_time: upcomingEnd.toISOString(),
    creator_id: 'user-xyz',
  };

  // Dynamic ended mock times (Starts 2 hours ago, ended 1 hour ago)
  const endedStart = new Date(now.getTime() - 120 * 60 * 1000);
  const endedEnd = new Date(now.getTime() - 60 * 60 * 1000);

  const sampleEndedEvent = {
    id: 'test-event-103',
    name: 'Ended Freight Route Contract',
    description: 'Finalized contract for logistics routes',
    event_status: 'ended',
    event_date: endedStart.toISOString(),
    start_time: endedStart.toISOString(),
    end_time: endedEnd.toISOString(),
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
