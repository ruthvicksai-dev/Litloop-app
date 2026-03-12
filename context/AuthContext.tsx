import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import * as SecureStore from "expo-secure-store";
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface User {
    _id: Id<"users">;
    name: string;
    email: string;
    phone: string;
    role: "user" | "admin";
}

interface AuthContextType {
    user: User | null;
    userId: Id<"users"> | null;
    isLoading: boolean;
    isAdmin: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (
        name: string,
        email: string,
        phone: string,
        password: string
    ) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userId: null,
    isLoading: true,
    isAdmin: false,
    signIn: async () => { },
    signUp: async () => { },
    signOut: async () => { },
});

export function useAuth() {
    return useContext(AuthContext);
}

// ─── SecureStore Keys ────────────────────────────────────────────────────────

const ACCESS_TOKEN_KEY = "litloop_access_token";
const REFRESH_TOKEN_KEY = "litloop_refresh_token";

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [tokenLoaded, setTokenLoaded] = useState(false); // SecureStore read complete
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const signInMutation = useMutation(api.auth.signIn);
    const signUpMutation = useMutation(api.auth.signUp);
    const refreshSessionMutation = useMutation(api.auth.refreshSession);
    const signOutMutation = useMutation(api.auth.signOut);

    // Fetch user from Convex using the current access token
    const sessionUser = useQuery(
        api.auth.getSession,
        accessToken ? { accessToken } : "skip"
    );

    const user = sessionUser
        ? ({
            _id: sessionUser._id,
            name: sessionUser.name,
            email: sessionUser.email,
            phone: sessionUser.phone,
            role: sessionUser.role as "user" | "admin",
        } as User)
        : null;

    // isLoading is true until:
    //   1. SecureStore read is complete (tokenLoaded === true)
    //   2. AND either: no token was found, OR the Convex query has resolved
    //      (sessionUser is not undefined — it will be null for invalid/no session, or an object for valid)
    const isLoading = !tokenLoaded || (accessToken !== null && sessionUser === undefined);

    // ─── Token Helpers ───────────────────────────────────────────────────

    /** Decode a JWT payload without verifying (client-side time checks). */
    const decodeTokenPayload = useCallback((token: string) => {
        try {
            const parts = token.split(".");
            if (parts.length !== 3) return null;
            const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
            return payload as { sub: string; type: string; iat: number; exp: number };
        } catch {
            return null;
        }
    }, []);

    /** Schedule automatic refresh before the access token expires. */
    const scheduleRefresh = useCallback(
        (token: string) => {
            // Clear any existing timer
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
                refreshTimerRef.current = null;
            }

            const payload = decodeTokenPayload(token);
            if (!payload?.exp) return;

            // Refresh 2 minutes before expiry (or immediately if <2 min left)
            const msUntilExpiry = payload.exp - Date.now();
            const refreshIn = Math.max(msUntilExpiry - 2 * 60 * 1000, 0);

            refreshTimerRef.current = setTimeout(async () => {
                try {
                    const storedRefreshToken = await SecureStore.getItemAsync(
                        REFRESH_TOKEN_KEY
                    );
                    if (!storedRefreshToken) return;

                    const result = await refreshSessionMutation({
                        refreshToken: storedRefreshToken,
                    });

                    await SecureStore.setItemAsync(
                        ACCESS_TOKEN_KEY,
                        result.accessToken
                    );
                    setAccessToken(result.accessToken);

                    // Schedule the next refresh
                    scheduleRefresh(result.accessToken);
                } catch {
                    // Refresh failed — force sign out
                    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
                    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
                    setAccessToken(null);
                }
            }, refreshIn);
        },
        [decodeTokenPayload, refreshSessionMutation]
    );

    // ─── Load session on mount ───────────────────────────────────────────

    useEffect(() => {
        (async () => {
            try {
                const storedAccess = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
                const storedRefresh = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

                if (!storedAccess || !storedRefresh) {
                    // No stored tokens — user is not logged in
                    setTokenLoaded(true);
                    return;
                }

                // Check if access token is still valid (client-side time check)
                const payload = decodeTokenPayload(storedAccess);
                if (payload && payload.exp > Date.now()) {
                    // Access token still valid — use it
                    setAccessToken(storedAccess);
                    scheduleRefresh(storedAccess);
                } else {
                    // Access token expired — try to refresh
                    try {
                        const result = await refreshSessionMutation({
                            refreshToken: storedRefresh,
                        });
                        await SecureStore.setItemAsync(
                            ACCESS_TOKEN_KEY,
                            result.accessToken
                        );
                        setAccessToken(result.accessToken);
                        scheduleRefresh(result.accessToken);
                    } catch {
                        // Refresh also failed — clean up
                        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
                        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
                    }
                }
            } catch {
                // Ignore storage errors
            } finally {
                setTokenLoaded(true);
            }
        })();

        // Cleanup timer on unmount
        return () => {
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Auth Actions ────────────────────────────────────────────────────

    const signIn = useCallback(
        async (email: string, password: string) => {
            const result = await signInMutation({ email, password });
            await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, result.accessToken);
            await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, result.refreshToken);
            setAccessToken(result.accessToken);
            scheduleRefresh(result.accessToken);
        },
        [signInMutation, scheduleRefresh]
    );

    const signUp = useCallback(
        async (
            name: string,
            email: string,
            phone: string,
            password: string
        ) => {
            const result = await signUpMutation({
                name,
                email,
                phone,
                password,
            });
            await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, result.accessToken);
            await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, result.refreshToken);
            setAccessToken(result.accessToken);
            scheduleRefresh(result.accessToken);
        },
        [signUpMutation, scheduleRefresh]
    );

    const signOut = useCallback(async () => {
        try {
            const storedRefresh = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
            if (storedRefresh) {
                await signOutMutation({ refreshToken: storedRefresh });
            }
        } catch {
            // Ignore backend errors on sign-out
        }

        // Clear timer
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }

        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        setAccessToken(null);
    }, [signOutMutation]);

    return (
        <AuthContext.Provider
            value={{
                user,
                userId: user?._id ?? null,
                isLoading,
                isAdmin: user?.role === "admin",
                signIn,
                signUp,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
