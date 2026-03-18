import { Fonts, FontSizes } from "@/constants/fonts";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type AppSplashProps = {
  onAnimationComplete?: () => void;
};

export default function AppSplash({ onAnimationComplete }: AppSplashProps) {
  const hasAnimated = useRef(false);
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.8)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    Animated.sequence([
      Animated.delay(120),
      Animated.parallel([
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(iconScale, {
          toValue: 1.1,
          duration: 420,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(iconRotate, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(iconScale, {
          toValue: 1,
          friction: 7,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(iconRotate, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 520,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 520,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => {
      if (finished) {
        onAnimationComplete?.();
      }
    });
  }, [iconOpacity, iconRotate, iconScale, onAnimationComplete, textOpacity, textTranslateY]);

  const rotate = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-8deg"],
  });

  return (
    <LinearGradient colors={["#0F2027", "#203A43", "#2C5364"]} style={styles.container}>
      <View style={styles.contentWrap}>
        <Animated.View
          style={[
            styles.iconWrap,
            {
              opacity: iconOpacity,
              transform: [{ scale: iconScale }, { rotate }],
            },
          ]}
        >
          <Image
            source={require("../../assets/images/splash-icon.png")}
            style={styles.icon}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.textWrap,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <Text style={styles.title}>
            <Text style={{ color: "orange" }}>Lit </Text>
            <Text style={{ color: "white" }}>Loop</Text>
          </Text>
          <Text style={styles.subtitle}>Read. Rent. Return.</Text>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentWrap: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 176,
    height: 112,
  },
  textWrap: {
    marginTop: 8,
    alignItems: "center",
  },
  title: {
    fontSize: FontSizes.hero,
    color: "#FFFFFF",
    fontFamily: Fonts.bold,
    letterSpacing: 2,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 4,
    fontSize: FontSizes.body,
    color: "#d1d5db",
    fontFamily: Fonts.regular,
    letterSpacing: 1,
    textAlign: "center",
  },
});
