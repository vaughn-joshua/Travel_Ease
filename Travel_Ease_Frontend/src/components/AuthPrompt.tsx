import { Link } from "react-router-dom";

interface AuthPromptProps {
  /** Title to display */
  title?: string;
  /** Message explaining why auth is needed */
  message: string | null;
  /** Callback when user clicks sign in */
  onSignIn: () => void;
  /** Whether sign in is in progress */
  isLoading?: boolean;
  /** Optional back link */
  backLink?: {
    to: string;
    label: string;
  };
}

/**
 * Component to display when a user needs to authenticate with Google
 * to access a protected feature.
 */
export default function AuthPrompt({
  title = "Sign in Required",
  message,
  onSignIn,
  isLoading = false,
  backLink,
}: AuthPromptProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 bg-primary-red/10 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>

        {/* Message */}
        <p className="text-gray-600 mb-8 max-w-sm mx-auto">
          {message || "Please sign in with your Google account to continue."}
        </p>

        {/* Google Sign In Button */}
        <button
          onClick={onSignIn}
          disabled={isLoading}
          className="w-full max-w-xs mx-auto flex items-center justify-center gap-3 px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-gray-600 font-medium">Signing in...</span>
            </>
          ) : (
            <>
              {/* Google Icon */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-gray-700 font-medium">Sign in with Google</span>
            </>
          )}
        </button>

        {/* Back Link */}
        {backLink && (
          <Link
            to={backLink.to}
            className="inline-flex items-center mt-6 text-primary-red hover:text-primary-red-dark transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {backLink.label}
          </Link>
        )}

        {/* Info */}
        <p className="mt-8 text-xs text-gray-500">
          We use Google Sign-In to verify your identity and protect our community.
        </p>
      </div>
    </div>
  );
}


