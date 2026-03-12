import { Colors, Spacing } from "@/constants/theme";
import React, { createContext, ReactNode, useCallback, useContext, useState } from "react";
import { Animated, Dimensions, StyleSheet, Text } from "react-native";

type ToastType = "success" | "error" | "info";

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({
    showToast: () => { },
});

export function useToast() {
    return useContext(ToastContext);
}

const TOAST_COLORS: Record<ToastType, string> = {
    success: Colors.success,
    error: Colors.error,
    info: Colors.primary,
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [message, setMessage] = useState("");
    const [type, setType] = useState<ToastType>("info");
    const [opacity] = useState(new Animated.Value(0));
    const [translateY] = useState(new Animated.Value(-50));

    const showToast = useCallback(
        (msg: string, toastType: ToastType = "info") => {
            setMessage(msg);
            setType(toastType);

            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            setTimeout(() => {
                Animated.parallel([
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateY, {
                        toValue: -50,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start();
            }, 3000);
        },
        [opacity, translateY]
    );

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Animated.View
                pointerEvents="none"
                style={[
                    styles.toastContainer,
                    {
                        opacity,
                        transform: [{ translateY }],
                        backgroundColor: TOAST_COLORS[type],
                    },
                ]}
            >
                <Text style={styles.toastText}>{message}</Text>
            </Animated.View>
        </ToastContext.Provider>
    );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
    toastContainer: {
        position: "absolute",
        top: 60,
        left: Spacing.md,
        right: Spacing.md,
        maxWidth: width - 32,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: 12,
        alignSelf: "center",
        zIndex: 9999,
        elevation: 10,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    toastText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: "600",
        textAlign: "center",
    },
});
