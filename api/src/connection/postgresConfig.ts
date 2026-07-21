import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgrespassword@localhost:5436/auction_db';

const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const initPostgresDb = async () => {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL Database');

    // Create DDL Tables & Indexes
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      -- Users Table
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        registration_time TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      -- Events Table
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ NOT NULL,
        event_date TIMESTAMPTZ NOT NULL,
        event_status TEXT NOT NULL DEFAULT 'upcoming' CHECK (event_status IN ('upcoming', 'active', 'ended')),
        columns JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_events_status ON events(event_status);
      CREATE INDEX IF NOT EXISTS idx_events_creator ON events(creator_id, event_status);

      -- Items Table
      CREATE TABLE IF NOT EXISTS items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        column_data JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_items_event ON items(event_id);

      -- Participants Table
      CREATE TABLE IF NOT EXISTS participants (
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (event_id, user_id)
      );

      -- Bids Table
      CREATE TABLE IF NOT EXISTS bids (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount NUMERIC(12, 2) NOT NULL,
        rank INT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT unique_user_item_bid UNIQUE (event_id, item_id, user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_bids_item_rank ON bids(event_id, item_id, amount ASC);

      -- Entire Event Snapshots Table
      CREATE TABLE IF NOT EXISTS entire_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID UNIQUE NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        event_details JSONB NOT NULL,
        items JSONB NOT NULL,
        bids JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // Creator Participant Validation Trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION check_creator_bidding()
      RETURNS TRIGGER AS $$
      DECLARE
        event_creator UUID;
      BEGIN
        SELECT creator_id INTO event_creator FROM events WHERE id = NEW.event_id;
        IF event_creator = NEW.user_id THEN
          RAISE EXCEPTION 'Event creator cannot participate or bid in their own event';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trg_check_creator_bidding ON participants;
      CREATE TRIGGER trg_check_creator_bidding
      BEFORE INSERT ON participants
      FOR EACH ROW EXECUTE FUNCTION check_creator_bidding();
    `);

    client.release();
    console.log('PostgreSQL DDL Schemas & Triggers Initialized Successfully');
  } catch (error) {
    console.error('Error connecting/initializing PostgreSQL:', error);
  }
};

export { pool };
