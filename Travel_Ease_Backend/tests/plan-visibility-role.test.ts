
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
import { prisma } from '../src/lib/prisma.js';
import travelPlanRoutes from '../src/routes/travelPlanRoutes.js';
import { createTestUser, cleanupTestData } from './setup.js';
import type { user } from '@prisma/client';

const app: Express = express();
app.use(express.json());
app.use((req, res, next) => {
    req.user = undefined; // Clear user from previous requests
    next();
});
app.use('/api/travel_plan', travelPlanRoutes);

describe('Travel Plan Visibility Restrictions', () => {
    let regularUser: user, regularToken: string;
    let agencyUser: user, agencyToken: string;
    let adminUser: user, adminToken: string;

    beforeEach(async () => {
        await cleanupTestData();

        const randomSuffix = () => Math.floor(Math.random() * 1000000);

        // Create Regular User
        const regResult = await createTestUser({ email: `reg_${Date.now()}_${randomSuffix()}@example.com` });
        regularUser = regResult.user;
        regularToken = regResult.token;

        // Create Travel Agency User
        const agencyResult = await createTestUser({ email: `agency_${Date.now()}_${randomSuffix()}@example.com`, role: 'TRAVEL_AGENCY' });
        agencyUser = agencyResult.user;
        agencyToken = agencyResult.token;

        // Create Admin User (just in case we need to verify they are also restricted or allowed)
        const adminResult = await createTestUser({ email: `admin_${Date.now()}_${randomSuffix()}@example.com`, role: 'SUPER_ADMIN' });
        adminUser = adminResult.user;
        adminToken = adminResult.token;
    });

    it('should allow TRAVEL_AGENCY to set visibility=true', async () => {
        // 1. Create plan
        const createRes = await request(app)
            .post('/api/travel_plan/create_plan')
            .set('Authorization', `Bearer ${agencyToken}`)
            .send({ title: 'Agency Plan', start_date: '2025-01-01', end_date: '2025-01-05' });

        const planId = createRes.body.travel_plan_id;

        // 2. Set visibility = true
        const updateRes = await request(app)
            .put(`/api/travel_plan/edit_plan/${planId}`)
            .set('Authorization', `Bearer ${agencyToken}`)
            .send({ visibility: true });

        expect(updateRes.status).toBe(200);
        expect(updateRes.body.plan.visibility).toBe(true);
    });

    it('should PREVENT Regular User from setting visibility=true', async () => {
        // 1. Create plan
        const createRes = await request(app)
            .post('/api/travel_plan/create_plan')
            .set('Authorization', `Bearer ${regularToken}`)
            .send({ title: 'Regular Plan', start_date: '2025-01-01', end_date: '2025-01-05' });

        const planId = createRes.body.travel_plan_id;

        // 2. Try set visibility = true
        const updateRes = await request(app)
            .put(`/api/travel_plan/edit_plan/${planId}`)
            .set('Authorization', `Bearer ${regularToken}`)
            .send({ visibility: true });

        // Expecting 403 Forbidden
        expect(updateRes.status).toBe(403);
        expect(updateRes.body.error).toBe("Permission denied");
        expect(updateRes.body.details).toMatch(/only.*travel agency/i);
    });

    it('should allow Regular User to set visibility=false (hide own plan)', async () => {
        // 1. Create plan
        const createRes = await request(app)
            .post('/api/travel_plan/create_plan')
            .set('Authorization', `Bearer ${regularToken}`)
            .send({ title: 'Regular Plan Hidden', start_date: '2025-01-01', end_date: '2025-01-05' });

        const planId = createRes.body.travel_plan_id;

        // Manually force visibility=true via DB to simulate pre-existing state
        await prisma.travel_plan.update({
            where: { travel_plan_id: planId },
            data: { visibility: true }
        });

        // 2. Try set visibility = false
        const updateRes = await request(app)
            .put(`/api/travel_plan/edit_plan/${planId}`)
            .set('Authorization', `Bearer ${regularToken}`)
            .send({ visibility: false });

        expect(updateRes.status).toBe(200);
        expect(updateRes.body.plan.visibility).toBe(false);
    });
});
