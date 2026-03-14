import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type AppSplashProps = {
  onAnimationComplete?: () => void;
  animate?: boolean;
};

export default function AppSplash({ onAnimationComplete, animate = true }: AppSplashProps) {
  const hasAnimated = useRef(false);
  const scale = useRef(new Animated.Value(animate ? 0.6 : 1)).current;
  const rotate = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const textOpacity = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const textTranslate = useRef(new Animated.Value(animate ? 20 : 0)).current;

  useEffect(() => {
    if (!animate || hasAnimated.current) return;
    hasAnimated.current = true;

    Animated.sequence([
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslate, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => {
      if (finished) {
        onAnimationComplete?.();
      }
    });
  }, [animate, onAnimationComplete, rotate, scale, textOpacity, textTranslate]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["-20deg", "0deg"],
  });

  return (
    <LinearGradient colors={["#0F2027", "#203A43", "#2C5364"]} style={styles.container}>
      <View style={styles.contentWrap}>
        <Animated.View
          style={[
            styles.iconWrap,
            {
              transform: [{ scale }, { rotate: animate ? spin : "0deg" }],
            },
          ]}
        >
          <Image source={require("../../assets/images/icon.png")} style={styles.icon} resizeMode="contain" />
        </Animated.View>

        <Animated.View
          style={[
            styles.textWrap,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslate }],
            },
          ]}
        >
          <Text style={styles.title}>Litloop</Text>
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
    paddingHorizontal: 24,
  },
  iconWrap: {
    borderRadius: 30,
  },
  icon: {
    width: 130,
    height: 130,
    borderRadius: 26,
  },
  textWrap: {
    alignItems: "center",
  },
  title: {
    marginTop: 24,
    fontSize: 26,
    color: "#fff",
    fontFamily: "Lato-Bold",
    letterSpacing: 2,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#d1d5db",
    letterSpacing: 1,
    textAlign: "center",
  },
});
