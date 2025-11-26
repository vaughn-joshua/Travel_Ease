/**
 * Ownership and Role-Based Access Control Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { prisma } from '../src/lib/prisma.js';
import travel_plan_routes from '../routes/travel_plan_routes.js';
import business_routes from '../routes/business_routes.js';
import { createTestUser, cleanupTestData } from './setup.js';

const app = express();
app.use(express.json());
app.use('/api/travel_plan', travel_plan_routes);
app.use('/api/business', business_routes);

describe('Ownership Access Control', () => {
  let owner, ownerToken, editor, editorToken, viewer, viewerToken, stranger, strangerToken;
  let planId, businessId;

  beforeEach(async () => {
    await cleanupTestData();

    const ownerResult = await createTestUser({ email: `owner_${Date.now()}@example.com` });
    owner = ownerResult.user;
    ownerToken = ownerResult.token;

    const editorResult = await createTestUser({ email: `editor_${Date.now()}@example.com` });
    editor = editorResult.user;
    editorToken = editorResult.token;

    const viewerResult = await createTestUser({ email: `viewer_${Date.now()}@example.com` });
    viewer = viewerResult.user;
    viewerToken = viewerResult.token;

    const strangerResult = await createTestUser({ email: `stranger_${Date.now()}@example.com` });
    stranger = strangerResult.user;
    strangerToken = strangerResult.token;

    // Create plan with owner
    const planResponse = await request(app)
      .post('/api/travel_plan/create_plan')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Ownership Test Plan' });
    planId = planResponse.body.travel_plan_id;

    // Add editor participant
    await prisma.participant.create({
      data: {
        travel_plan_id: planId,
        user_id: editor.user_id,
        role: 'Editor',
        status: true
      }
    });

    // Add viewer participant
    await prisma.participant.create({
      data: {
        travel_plan_id: planId,
        user_id: viewer.user_id,
        role: 'Viewer',
        status: true
      }
    });

    // Create business
    const bizResponse = await request(app)
      .post('/api/business/create_business')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Owner Business', category: ['food'] });
    businessId = bizResponse.body.business_id;
  });

  describe('Travel Plan Ownership', () => {
    it('should allow owner to edit plan', async () => {
      const response = await request(app)
        .put(`/api/travel_plan/edit_plan/${planId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ title: 'Owner Edited' });

      expect(response.status).toBe(201);
    });

    it('should allow admin participant to edit plan', async () => {
      // Promote editor to admin
      await prisma.participant.updateMany({
        where: { travel_plan_id: planId, user_id: editor.user_id },
        data: { role: 'Admin' }
      });

      const response = await request(app)
        .put(`/api/travel_plan/edit_plan/${planId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ title: 'Admin Edited' });

      expect(response.status).toBe(201);
    });

    it('should reject edit by editor participant', async () => {
      const response = await request(app)
        .put(`/api/travel_plan/edit_plan/${planId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ title: 'Editor Attempt' });

      expect(response.status).toBe(403);
    });

    it('should reject edit by viewer participant', async () => {
      const response = await request(app)
        .put(`/api/travel_plan/edit_plan/${planId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ title: 'Viewer Attempt' });

      expect(response.status).toBe(403);
    });

    it('should reject edit by non-participant', async () => {
      const response = await request(app)
        .put(`/api/travel_plan/edit_plan/${planId}`)
        .set('Authorization', `Bearer ${strangerToken}`)
        .send({ title: 'Stranger Attempt' });

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent plan', async () => {
      const response = await request(app)
        .put('/api/travel_plan/edit_plan/99999')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ title: 'Ghost Plan' });

      expect(response.status).toBe(404);
    });
  });

  describe('Business Ownership', () => {
    it('should allow owner to edit business', async () => {
      const response = await request(app)
        .put(`/api/business/edit_business/${businessId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Owner Updated Business' });

      expect(response.status).toBe(200);
    });

    it('should reject edit by non-owner', async () => {
      const response = await request(app)
        .put(`/api/business/edit_business/${businessId}`)
        .set('Authorization', `Bearer ${strangerToken}`)
        .send({ name: 'Hijacked Business' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Not authorized');
    });

    it('should return 404 for non-existent business', async () => {
      const response = await request(app)
        .put('/api/business/edit_business/99999')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Ghost Business' });

      expect(response.status).toBe(404);
    });
  });

  describe('Activity Access Control', () => {
    let activityId;

    beforeEach(async () => {
      // Create activity as owner
      const response = await request(app)
        .post('/api/travel_plan/create_activity')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          travel_plan_id: planId,
          notes: 'Owner activity'
        });
      activityId = response.body.activity_id;
    });

    it('should allow owner to edit activity', async () => {
      const response = await request(app)
        .put(`/api/travel_plan/activity_edit/${activityId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ notes: 'Owner updated' });

      expect(response.status).toBe(200);
    });

    it('should allow editor to edit activity', async () => {
      const response = await request(app)
        .put(`/api/travel_plan/activity_edit/${activityId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ notes: 'Editor updated' });

      expect(response.status).toBe(200);
    });

    it('should reject activity edit by viewer', async () => {
      const response = await request(app)
        .put(`/api/travel_plan/activity_edit/${activityId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ notes: 'Viewer attempt' });

      expect(response.status).toBe(403);
    });

    it('should allow activity creator to edit their own activity', async () => {
      // Create activity as editor
      const createResponse = await request(app)
        .post('/api/travel_plan/create_activity')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          travel_plan_id: planId,
          notes: 'Editor activity'
        });

      const editorActivityId = createResponse.body.activity_id;

      const response = await request(app)
        .put(`/api/travel_plan/activity_edit/${editorActivityId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ notes: 'Editor self-update' });

      expect(response.status).toBe(200);
    });

    it('should allow owner to delete activity', async () => {
      const response = await request(app)
        .delete(`/api/travel_plan/delete_activity/${activityId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
    });
  });
});


