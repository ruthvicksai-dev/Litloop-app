import { FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import React, { createContext, ReactNode, useCallback, useContext, useRef, useState } from "react";
import { Animated, Dimensions, Modal, StyleSheet, Text, View } from "react-native";

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
    const [isToastVisible, setIsToastVisible] = useState(false);
    const [opacity] = useState(new Animated.Value(0));
    const [translateY] = useState(new Animated.Value(50));
    const timerRef = useRef<any>(null);
    const isVisibleRef = useRef(false);

    const showToast = useCallback(
        (msg: string, toastType: ToastType = "info") => {
            // Cancel any pending auto-hide timer
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }

            const startShowing = () => {
                setMessage(msg);
                setType(toastType);
                setIsToastVisible(true);
                isVisibleRef.current = true;

                // Important: Reset values first
                opacity.setValue(0);
                translateY.setValue(15);

                // Give React one or two frames to render the message text before fading in.
                // This prevents "blank toast" and "previous text" flickers.
                setTimeout(() => {
                    Animated.parallel([
                        Animated.timing(opacity, {
                            toValue: 1,
                            duration: 200, // Snappier
                            useNativeDriver: true,
                        }),
                        Animated.timing(translateY, {
                            toValue: 0,
                            duration: 200, // Snappier
                            useNativeDriver: true,
                        }),
                    ]).start();
                }, 32); // ~2 frames at 60fps

                timerRef.current = setTimeout(() => {
                    hide();
                }, 3000);
            };

            const hide = (callback?: () => void) => {
                opacity.stopAnimation();
                translateY.stopAnimation();

                Animated.parallel([
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 150, // Snappier
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateY, {
                        toValue: 15, // Subtle
                        duration: 150, // Snappier
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    isVisibleRef.current = false;
                    setIsToastVisible(false);
                    if (callback) {
                        callback();
                    }
                });
            };

            if (isVisibleRef.current) {
                // If already visible, hide current first, then show new
                hide(startShowing);
            } else {
                startShowing();
            }
        },
        [opacity, translateY]
    );

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Modal
                visible={isToastVisible}
                transparent
                animationType="none"
                statusBarTranslucent
            >
                <View pointerEvents="box-none" style={styles.modalOverlay}>
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
                </View>
            </Modal>
        </ToastContext.Provider>
    );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
    },
    toastContainer: {
        marginBottom: 36,
        marginHorizontal: Spacing.md,
        maxWidth: width - 32,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: 12,
        alignSelf: "center",
        zIndex: 9999,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
    },
    toastText: {
        color: Colors.white,
        fontSize: FontSizes.body,
        fontWeight: "600",
        textAlign: "center",
    },
});
