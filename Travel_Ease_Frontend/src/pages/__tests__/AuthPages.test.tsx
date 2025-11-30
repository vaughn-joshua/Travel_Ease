import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import Login from "../Login";
import Signup from "../Signup";

const authState: any = {
  user: null,
  session: null,
  loading: false,
  isConfigured: true,
  loginWithEmail: vi.fn(),
  registerWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
};

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => authState,
}));

describe("Login page", () => {
  beforeEach(() => {
    authState.user = null;
    authState.loading = false;
    authState.isConfigured = true;
    authState.loginWithEmail = vi.fn().mockResolvedValue(undefined);
    authState.signInWithGoogle = vi.fn().mockResolvedValue(undefined);
  });

  it("submits email/password credentials", async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await userEvent.type(
      screen.getByLabelText(/email address/i),
      "traveler@example.com"
    );
    await userEvent.type(
      screen.getByLabelText(/password/i),
      "Password123!"
    );
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(authState.loginWithEmail).toHaveBeenCalledWith({
        email: "traveler@example.com",
        password: "Password123!",
      });
    });
  });

  it("shows validation error when fields are missing", async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(
      await screen.findByText(/please fill in both email and password/i)
    ).toBeInTheDocument();
  });

  it("disables Google button when Supabase is not configured", async () => {
    authState.isConfigured = false;
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const googleButton = screen.getByRole("button", {
      name: /continue with google/i,
    });
    expect(googleButton).toBeDisabled();
  });
});

describe("Signup page", () => {
  beforeEach(() => {
    authState.user = null;
    authState.loading = false;
    authState.isConfigured = true;
    authState.registerWithEmail = vi.fn().mockResolvedValue(undefined);
    authState.signInWithGoogle = vi.fn().mockResolvedValue(undefined);
  });

  it("creates an account when the form is valid", async () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText(/first name/i), "Alex");
    await userEvent.type(screen.getByLabelText(/last name/i), "Traveler");
    await userEvent.type(
      screen.getByLabelText(/email address/i),
      "newuser@example.com"
    );
    await userEvent.type(
      screen.getByLabelText(/^password$/i),
      "Password123!"
    );
    await userEvent.type(
      screen.getByLabelText(/confirm password/i),
      "Password123!"
    );

    await userEvent.click(
      screen.getByRole("button", { name: /create account/i })
    );

    await waitFor(() => {
      expect(authState.registerWithEmail).toHaveBeenCalledWith({
        first_name: "Alex",
        last_name: "Traveler",
        email: "newuser@example.com",
        password: "Password123!",
        contact_no: undefined,
      });
    });
  });

  it("shows password mismatch error", async () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText(/first name/i), "Alex");
    await userEvent.type(screen.getByLabelText(/last name/i), "Traveler");
    await userEvent.type(
      screen.getByLabelText(/email address/i),
      "mismatch@example.com"
    );
    await userEvent.type(
      screen.getByLabelText(/^password$/i),
      "Password123!"
    );
    await userEvent.type(
      screen.getByLabelText(/confirm password/i),
      "WrongPass123!"
    );

    await userEvent.click(
      screen.getByRole("button", { name: /create account/i })
    );

    expect(
      await screen.findByText(/passwords do not match/i)
    ).toBeInTheDocument();
    expect(authState.registerWithEmail).not.toHaveBeenCalled();
  });
});
