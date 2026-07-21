import request from 'supertest';
import app from '../app/app';
import { pool } from '../connection/postgresConfig';
import { seedDatabase } from '../scripts/seedEvents';

describe('Backend API Integration Tests', () => {
  let authToken: string;

  beforeAll(async () => {
    // Seed initial test data in PostgreSQL database
    await seedDatabase();

    // Perform Login to get valid JWT Auth Token
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({
        email: '17prateek12@gmail.com',
        password: 'Prateek@1712',
      });

    expect(loginRes.status).toBe(200);
    authToken = loginRes.body.accessToken || loginRes.body.token;
    expect(typeof authToken).toBe('string');
  });

  afterAll(async () => {
    // Cleanup & Close DB Connection
    await pool.end();
  });

  describe('1. Authentication Endpoints', () => {
    it('should login successfully with valid user credentials (17prateek12@gmail.com)', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: '17prateek12@gmail.com',
          password: 'Prateek@1712',
        });

      expect(res.status).toBe(200);
      expect(res.body.userEmail).toBe('17prateek12@gmail.com');
      const token = res.body.accessToken || res.body.token;
      expect(typeof token).toBe('string');
    });

    it('should reject login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: '17prateek12@gmail.com',
          password: 'WrongPassword123',
        });

      expect([400, 401]).toContain(res.status);
    });
  });

  describe('2. Event Sourcing & Dashboard Endpoints', () => {
    it('should fetch all events grouped by status (active, upcoming, ended)', async () => {
      const res = await request(app).get('/api/event/events?page=1&limit=10');

      expect(res.status).toBe(200);
      const eventData = res.body;

      expect(eventData).toHaveProperty('active');
      expect(eventData).toHaveProperty('upcoming');
      expect(eventData).toHaveProperty('ended');

      expect(Array.isArray(eventData.active.event)).toBe(true);
      expect(Array.isArray(eventData.upcoming.event)).toBe(true);
      expect(Array.isArray(eventData.ended.event)).toBe(true);
    });

    it('should fetch user-created events with valid JWT auth token', async () => {
      const res = await request(app)
        .get('/api/event/user-event')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should reject fetching user events without auth token', async () => {
      const res = await request(app).get('/api/event/user-event');

      expect([401, 403]).toContain(res.status);
    });
  });

  describe('3. Event Creation Flow', () => {
    it('should create a new bidding event with dynamic item rows', async () => {
      const now = new Date();
      const nowEnd = new Date(now.getTime() + 5 * 60 * 60 * 1000);

      const eventPayload = {
        eventName: `Jest Test Event ${Date.now()}`,
        description: 'Automated integration test event created via Jest',
        eventDate: now.toISOString(),
        startTime: now.toISOString(),
        endTime: nowEnd.toISOString(),
        columns: ['Item Name', 'Quantity', 'Starting Bid'],
        rows: [
          { 'Item Name': 'Test Industrial Compressor', Quantity: '5', 'Starting Bid': '$1,200' },
          { 'Item Name': 'Test Hydraulic Pump', Quantity: '10', 'Starting Bid': '$850' },
        ],
      };

      const res = await request(app)
        .post('/api/event/create-event')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventPayload);

      expect([200, 201]).toContain(res.status);
      expect(res.body.event).toHaveProperty('id');
      expect(res.body.event.name).toBe(eventPayload.eventName);
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items.length).toBe(2);
    });

    it('should reject event creation if start time is in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const eventPayload = {
        eventName: 'Past Date Test Event',
        description: 'Invalid past date test',
        eventDate: pastDate.toISOString(),
        startTime: pastDate.toISOString(),
        endTime: new Date().toISOString(),
        columns: ['Item Name', 'Quantity'],
        rows: [{ 'Item Name': 'Invalid Item', Quantity: '1' }],
      };

      const res = await request(app)
        .post('/api/event/create-event')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventPayload);

      expect(res.status).toBe(400);
    });
  });
});
