import { useAuth } from "@/context/AuthContext";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID_WEB = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB || "";
const GOOGLE_CLIENT_ID_ANDROID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID || "";
const GOOGLE_CLIENT_ID_IOS = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS || "";

// Expo auth proxy: hardcoded to the HTTPS URI Google accepts.
// Replace 'ruthvicksai' with your actual Expo username (expo.dev profile).
// Also add this exact URI to Google Cloud Console → Authorized Redirect URIs.
const EXPO_OWNER = process.env.EXPO_PUBLIC_OWNER || "ruthvicksai";
const redirectUri = `https://auth.expo.io/@${EXPO_OWNER}/litloop`;

export function useGoogleAuth() {
    const { signInWithGoogle } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: GOOGLE_CLIENT_ID_WEB,
        androidClientId: GOOGLE_CLIENT_ID_ANDROID,
        iosClientId: GOOGLE_CLIENT_ID_IOS,
        redirectUri,
        responseType: "id_token",
    });

    useEffect(() => {
        if (response?.type === "success") {
            const { id_token } = response.params;
            if (id_token) {
                handleGoogleSignIn(id_token);
            } else {
                setError("No ID token received from Google");
                setIsLoading(false);
            }
        } else if (response?.type === "error") {
            setError(response.error?.message || "Google sign-in failed");
            setIsLoading(false);
        } else if (response?.type === "cancel") {
            setIsLoading(false);
        }
    }, [response]);

    const handleGoogleSignIn = async (idToken: string) => {
        setIsLoading(true);
        setError(null);
        try {
            await signInWithGoogle(idToken);
        } catch (err: any) {
            console.error("Google AuthContext sign-in failed:", err);
            setError(err.message || "Failed to sign in with Google");
        } finally {
            setIsLoading(false);
        }
    };

    const signIn = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await promptAsync();
            if (result.type !== "success") {
                setIsLoading(false);
            }
        } catch (err: any) {
            setError(err.message || "Google prompt failed");
            setIsLoading(false);
        }
    };

    return {
        signIn,
        isLoading: isLoading || !request,
        error,
    };
}
