import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import React from "react";
import {
    Animated,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

interface OtpCodeInputProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    length?: number;
    autoFocus?: boolean;
}

export default function OtpCodeInput({
    label = "Verification Code",
    value,
    onChange,
    length = 6,
    autoFocus = false,
}: OtpCodeInputProps) {
    const inputRef = React.useRef<TextInput | null>(null);
    const [isFocused, setIsFocused] = React.useState(false);
    const caretOpacity = React.useRef(new Animated.Value(1)).current;

    const sanitizedValue = React.useMemo(
        () => value.replace(/[^0-9]/g, "").slice(0, length),
        [length, value]
    );

    const digits = React.useMemo(
        () => Array.from({ length }, (_, index) => sanitizedValue[index] ?? ""),
        [length, sanitizedValue]
    );

    const activeIndex = React.useMemo(() => {
        if (sanitizedValue.length >= length) {
            return length - 1;
        }
        return sanitizedValue.length;
    }, [length, sanitizedValue.length]);

    const focusInput = React.useCallback(() => {
        inputRef.current?.focus();
    }, []);

    React.useEffect(() => {
        if (!autoFocus) return;

        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 120);

        return () => clearTimeout(timer);
    }, [autoFocus]);

    React.useEffect(() => {
        if (!isFocused) {
            caretOpacity.stopAnimation();
            caretOpacity.setValue(1);
            return;
        }

        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(caretOpacity, {
                    toValue: 0,
                    duration: 450,
                    useNativeDriver: true,
                }),
                Animated.timing(caretOpacity, {
                    toValue: 1,
                    duration: 450,
                    useNativeDriver: true,
                }),
            ])
        );

        animation.start();

        return () => {
            animation.stop();
            caretOpacity.setValue(1);
        };
    }, [caretOpacity, isFocused]);

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>

            <Pressable style={styles.pressableArea} onPress={focusInput}>
                <View style={styles.row}>
                    {digits.map((digit, index) => {
                        const isFilled = Boolean(digit);
                        const isActive =
                            isFocused &&
                            (activeIndex === index ||
                                (sanitizedValue.length === length && index === length - 1));

                        return (
                            <View
                                key={index}
                                style={[
                                    styles.box,
                                    isFilled && styles.boxFilled,
                                    isActive && styles.boxActive,
                                ]}
                            >
                                <Text style={styles.digit}>{digit}</Text>
                                {isActive && !digit ? (
                                    <Animated.View
                                        style={[styles.caret, { opacity: caretOpacity }]}
                                    />
                                ) : null}
                            </View>
                        );
                    })}
                </View>

                <TextInput
                    ref={inputRef}
                    style={styles.hiddenInput}
                    value={sanitizedValue}
                    onChangeText={(text) => onChange(text.replace(/[^0-9]/g, "").slice(0, length))}
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    autoComplete="sms-otp"
                    returnKeyType="done"
                    maxLength={length}
                    autoFocus={autoFocus}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    contextMenuHidden={false}
                    selection={{
                        start: sanitizedValue.length,
                        end: sanitizedValue.length,
                    }}
                    importantForAutofill="yes"
                />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: FontSizes.small,
        color: Colors.textSecondary,
        marginBottom: 6,
        fontFamily: Fonts.medium,
        letterSpacing: 0.3,
        textTransform: "uppercase",
    },
    pressableArea: {
        position: "relative",
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: Spacing.xs,
    },
    box: {
        flex: 1,
        minWidth: 0,
        height: 52,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.white,
        alignItems: "center",
        justifyContent: "center",
    },
    boxFilled: {
        borderColor: Colors.primary + "55",
    },
    boxActive: {
        borderColor: Colors.primary,
        borderWidth: 2,
    },
    digit: {
        color: Colors.text,
        fontFamily: Fonts.bold,
        fontSize: FontSizes.subtitle,
        textAlign: "center",
    },
    caret: {
        position: "absolute",
        width: 2,
        height: 22,
        backgroundColor: Colors.primary,
        borderRadius: 999,
    },
    hiddenInput: {
        position: "absolute",
        opacity: 0.01,
        inset: 0,
        color: "transparent",
    },
});
