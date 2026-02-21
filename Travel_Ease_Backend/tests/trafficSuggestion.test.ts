
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app'; // assuming app is exported from server or app file
import { prisma } from '../src/lib/prismaHelpers';

// Mock auth middleware for testing
vi.mock('../src/middleware/auth', () => ({
    authenticateToken: (req: any, res: any, next: any) => {
        req.user = { id: 1, role: 'USER' };
        next();
    }
}));

describe('Traffic Alternative Suggestion', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return error if missing params', async () => {
        const res = await request(app)
            .get('/api/traffic/alternative-suggestion')
            .query({ origin_activity_id: 1 });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Missing');
    });

});
