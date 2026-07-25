
import { createClient } from "@supabase/supabase-js";

// Ensure these are defined in your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isMock = !supabaseUrl || !supabaseAnonKey;

if (isMock) {
    console.warn("Running in Developer Mode with mock authentication. Enter any credentials to log in.");
}

const mockAuthListeners: Array<(event: string, session: any) => void> = [];

export const supabase = isMock
    ? ({
          auth: {
              getSession: async () => ({ data: { session: null }, error: null }),
              onAuthStateChange: (callback: (event: string, session: any) => void) => {
                  mockAuthListeners.push(callback);
                  // Call immediately with null/initial state
                  setTimeout(() => callback("SIGNED_IN", null), 0);
                  return {
                      data: {
                          subscription: {
                              unsubscribe: () => {
                                  const index = mockAuthListeners.indexOf(callback);
                                  if (index !== -1) mockAuthListeners.splice(index, 1);
                              },
                          },
                      },
                  };
              },
              signInWithPassword: async ({ email }: { email: string }) => {
                  const mockSession = {
                      access_token: "mock-token",
                      token_type: "bearer",
                      expires_in: 3600,
                      refresh_token: "mock-refresh",
                      user: {
                          id: "mock-user-id",
                          email,
                          app_metadata: {},
                          user_metadata: {},
                          aud: "authenticated",
                          created_at: new Date().toISOString(),
                      },
                  };
                  mockAuthListeners.forEach(listener => listener("SIGNED_IN", mockSession));
                  return { data: { session: mockSession }, error: null };
              },
              signOut: async () => {
                  mockAuthListeners.forEach(listener => listener("SIGNED_OUT", null));
                  return { error: null };
              },
          },
      } as any)
    : createClient(supabaseUrl, supabaseAnonKey);
