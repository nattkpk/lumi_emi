import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index';

describe('Public API Endpoints Integration Test', () => {
  it('GET /api/countries should return 200 and an array', async () => {
    const res = await request(app).get('/api/countries');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/emissions/trend should require country iso code', async () => {
    const res = await request(app).get('/api/emissions/trend');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('country iso code is required');
  });

  it('GET /api/emissions/trend?country=THA should return 200', async () => {
    const res = await request(app).get('/api/emissions/trend?country=THA');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('Protected API Endpoints (Auth Middleware)', () => {
  it('POST /api/countries should return 401 Unauthorized without token', async () => {
    const res = await request(app).post('/api/countries').send({
      iso_code: 'XYZ',
      name: 'Test Country'
    });
    expect(res.status).toBe(401);
  });
});
