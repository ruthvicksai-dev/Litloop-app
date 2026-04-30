import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { Component, ErrorInfo, ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Global error boundary that catches unhandled JS errors
 * and displays a graceful fallback screen instead of a white screen crash.
 */
export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        // Log to console.error so it still surfaces in production crash reports
        console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Ionicons
                        name="warning-outline"
                        size={56}
                        color={Colors.error}
                        style={{ marginBottom: Spacing.md }}
                    />
                    <Text style={styles.title}>Something went wrong</Text>
                    <Text style={styles.subtitle}>
                        An unexpected error occurred. Please try again.
                    </Text>

                    <TouchableOpacity style={styles.retryBtn} onPress={this.handleRetry}>
                        <Ionicons name="refresh" size={18} color={Colors.white} />
                        <Text style={styles.retryText}>Try Again</Text>
                    </TouchableOpacity>

                    {__DEV__ && this.state.error ? (
                        <Text style={styles.errorDetail} numberOfLines={6}>
                            {this.state.error.message}
                        </Text>
                    ) : null}
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
        backgroundColor: Colors.background,
    },
    title: {
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.text,
        textAlign: "center",
    },
    subtitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        textAlign: "center",
        marginTop: Spacing.xs,
        marginBottom: Spacing.xl,
        lineHeight: 22,
    },
    retryBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: Colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
    },
    retryText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.white,
    },
    errorDetail: {
        marginTop: Spacing.xl,
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: Colors.textLight,
        textAlign: "center",
        paddingHorizontal: 16,
    },
});
