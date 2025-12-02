import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import express, { type Express } from "express";
import request from "supertest";
import { randomUUID } from "crypto";
import { prisma } from "../src/lib/prisma.js";
import user_routes from "../routes/user_routes.js";
import { errorHandler } from "../src/middleware/errorHandler.js";

const supabaseAuthMocks = vi.hoisted(() => ({
  createUser: vi.fn(),
  signInWithPassword: vi.fn(),
}));

vi.mock("../src/lib/supabase.js", () => ({
  supabaseAdmin: {
    auth: {
      admin: { createUser: supabaseAuthMocks.createUser },
      signInWithPassword: supabaseAuthMocks.signInWithPassword,
      getUser: vi.fn(),
    },
  },
  isSupabaseConfigured: vi.fn(() => true),
}));

import { isSupabaseConfigured } from "../src/lib/supabase.js";

const app: Express = express();
app.use(express.json());
app.use("/api/user", user_routes);
app.use(errorHandler);

const uniqueEmail = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;

describe("Auth routes (login & signup)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await prisma.user.deleteMany({
      where: { email: { contains: "auth-flow" } },
    });
    (isSupabaseConfigured as ReturnType<typeof vi.fn>).mockReturnValue(true);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("registers a new user through Supabase + Prisma", async () => {
    const email = uniqueEmail("auth-flow");
    const authId = randomUUID();

    supabaseAuthMocks.createUser.mockResolvedValue({
      data: { user: { id: authId } },
      error: null,
    });

    const response = await request(app).post("/api/user/register").send({
      first_name: "Auth",
      last_name: "Flow",
      email,
      password: "StrongPass123!",
      contact_no: "1234567890",
    });

    expect(response.status).toBe(201);
    expect(supabaseAuthMocks.createUser).toHaveBeenCalled();
    expect(response.body.user.email).toBe(email);

    const created = await prisma.user.findUnique({ where: { email } });
    expect(created).not.toBeNull();
  });

  it("rejects duplicate email registration", async () => {
    const email = uniqueEmail("auth-flow-dup");
    await prisma.user.create({
      data: {
        first_name: "Existing",
        last_name: "User",
        email,
        password: "hashed",
      },
    });

    const response = await request(app).post("/api/user/register").send({
      first_name: "Auth",
      last_name: "Flow",
      email,
      password: "StrongPass123!",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("exists");
    expect(supabaseAuthMocks.createUser).not.toHaveBeenCalled();
  });

  it("logs in an existing profile when Supabase validates credentials", async () => {
    const email = uniqueEmail("auth-flow-login");
    const authId = randomUUID();

    await prisma.user.create({
      data: {
        first_name: "Auth",
        last_name: "Flow",
        email,
        auth_id: authId,
      },
    });

    supabaseAuthMocks.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: authId, email },
        session: {
          access_token: "access-token-123",
          refresh_token: "refresh-token-456",
          expires_at: 123456,
        },
      },
      error: null,
    });

    const response = await request(app).post("/api/user/login").send({
      email,
      password: "StrongPass123!",
    });

    expect(response.status).toBe(200);
    expect(supabaseAuthMocks.signInWithPassword).toHaveBeenCalled();
    expect(response.body.user.email).toBe(email);
    expect(response.body.token).toBe("access-token-123");
  });

  it("returns 503 when Supabase is not configured", async () => {
    (isSupabaseConfigured as ReturnType<typeof vi.fn>).mockReturnValue(false);

    const response = await request(app).post("/api/user/login").send({
      email: "missing@example.com",
      password: "password",
    });

    expect(response.status).toBe(503);
    expect(supabaseAuthMocks.signInWithPassword).not.toHaveBeenCalled();
  });
});

