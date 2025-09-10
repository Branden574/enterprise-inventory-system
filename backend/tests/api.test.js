const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const app = require('../index');

describe('API Health', () => {
  it('should return API running', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/Inventory API running/);
  });
});
