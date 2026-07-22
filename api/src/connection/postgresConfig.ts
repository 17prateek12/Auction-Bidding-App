import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgrespassword@localhost:5436/auction_db';

export const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

export const initPostgresDb = async () => {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL Database');

    // Enable pgcrypto extension for UUIDs
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // DDL Schemas Initialization
    await client.query(`
      -- Users Table
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        registration_time VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      -- Events Table
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ NOT NULL,
        event_date TIMESTAMPTZ NOT NULL,
        event_status VARCHAR(50) NOT NULL DEFAULT 'upcoming',
        columns JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      -- Items Catalog Table
      CREATE TABLE IF NOT EXISTS items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        column_data JSONB NOT NULL,
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      -- Event Participants Table
      CREATE TABLE IF NOT EXISTS participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT unique_event_participant UNIQUE (event_id, user_id)
      );

      -- Live Bids Table
      CREATE TABLE IF NOT EXISTS bids (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount NUMERIC(15, 2) NOT NULL,
        rank INT NOT NULL DEFAULT 1,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT unique_user_item_bid UNIQUE (event_id, item_id, user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_bids_item_rank ON bids(event_id, item_id, amount ASC);
      CREATE INDEX IF NOT EXISTS idx_items_event ON items(event_id);
      CREATE INDEX IF NOT EXISTS idx_events_creator ON events(creator_id);

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

    // Creator Bid Prevention Trigger (Wired directly to bids table)
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
      DROP TRIGGER IF EXISTS trg_check_creator_bidding_bids ON bids;

      CREATE TRIGGER trg_check_creator_bidding_bids
      BEFORE INSERT OR UPDATE ON bids
      FOR EACH ROW EXECUTE FUNCTION check_creator_bidding();
    `);

    client.release();
    console.log('PostgreSQL DDL Schemas & Triggers Initialized Successfully');
  } catch (error) {
    console.error('Error initializing PostgreSQL DDL tables:', error);
  }
};
