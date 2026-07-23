import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React, { useEffect } from "react";
import {
    Dimensions,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const { width } = Dimensions.get("window");

// Full width now
const TAB_BAR_MARGIN = 0;
const TAB_BAR_WIDTH = width;
const TAB_BAR_HEIGHT = 75;
const CIRCLE_SIZE = 52;
// We'll drop the circle down so it sits lower inside the curve
const CIRCLE_TOP_OFFSET = -CIRCLE_SIZE / 2 + 14;

// The SVG background shape logic
const SVG_WIDTH = 3000;
const CENTER = SVG_WIDTH / 2;
// Adjust the curve properties here — fitted dip for lowered circle
const DIP_W = 36;
const DIP_D = 28;

const pathStr = `
  M 0 0
  L ${CENTER - DIP_W} 0
  C ${CENTER - 18} 0, ${CENTER - 24} ${DIP_D}, ${CENTER} ${DIP_D}
  C ${CENTER + 24} ${DIP_D}, ${CENTER + 18} 0, ${CENTER + DIP_W} 0
  L ${SVG_WIDTH} 0
  L ${SVG_WIDTH} ${TAB_BAR_HEIGHT}
  L 0 ${TAB_BAR_HEIGHT}
  Z
`;

const topStrokePathStr = `
  M 0 0
  L ${CENTER - DIP_W} 0
  C ${CENTER - 18} 0, ${CENTER - 24} ${DIP_D}, ${CENTER} ${DIP_D}
  C ${CENTER + 24} ${DIP_D}, ${CENTER + 18} 0, ${CENTER + DIP_W} 0
  L ${SVG_WIDTH} 0
`;

export default function AnimatedTabBar({
    state,
    descriptors,
    navigation,
}: BottomTabBarProps) {
    const insets = useSafeAreaInsets();

    const visibleRoutes = state.routes.filter(
        (route) =>
            descriptors[route.key].options.title !== undefined ||
            route.name !== "notifications"
    );

    const renderRoutes = visibleRoutes.filter(
        (route) => (descriptors[route.key].options as any).href !== null
    );

    const TAB_WIDTH = TAB_BAR_WIDTH / renderRoutes.length;

    // Track active tab index (0...len-1)
    const tabPositionX = useSharedValue(0);

    useEffect(() => {
        const activeRouteKey = state.routes[state.index].key;
        const renderIndex = renderRoutes.findIndex((r) => r.key === activeRouteKey);

        if (renderIndex !== -1) {
            // Offset by half a tab width to center precisely on the tab icon
            const centerOfTab = renderIndex * TAB_WIDTH + TAB_WIDTH / 2;
            tabPositionX.value = withTiming(centerOfTab, {
                duration: 350,
                easing: Easing.out(Easing.cubic),
            });
        }
    }, [state.index, state.routes, renderRoutes, TAB_WIDTH, tabPositionX]);

    // Translate entire massive SVG left/right so its CENTER perfectly aligns with tab_center
    const svgStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: tabPositionX.value - CENTER }],
        };
    });

    // Floating badge aligned perfectly with tab position
    const indicatorStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: tabPositionX.value - CIRCLE_SIZE / 2 }],
        };
    });

    // Calculate total height to stretch down into the safe area
    const totalHeight = TAB_BAR_HEIGHT + insets.bottom;

    return (
        <View style={[styles.wrapper, { height: totalHeight, bottom: 0 }]}>

            {/* Outer bounding box clips the top rounded corners and fills absolute bottom */}
            <View style={[styles.pillContainer, { paddingBottom: insets.bottom }]}>
                {/* Massive SVG background sliding inside (keeps the fixed 65 height for the curve) */}
                <AnimatedSvg width={SVG_WIDTH} height={TAB_BAR_HEIGHT} style={svgStyle}>
                    <Path
                        d={pathStr}
                        fill={Colors.background}
                    />
                    <Path
                        d={topStrokePathStr}
                        fill="none"
                        stroke="rgba(110, 104, 98, 0.35)"
                        strokeWidth={1.5}
                    />
                </AnimatedSvg>
                {/* Fill the remainder of the safe area below the curve */}
                <View style={{ flex: 1, backgroundColor: Colors.background }} />
            </View>

            {/* Floating Orange Badge - outside the overflow:hidden pill container! */}
            <Animated.View style={[styles.floatingCircle, indicatorStyle]} />

            {/* Tab Icons mapping */}
            <View style={[styles.tabsContainer, { height: TAB_BAR_HEIGHT }]}>
                {renderRoutes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === state.routes.findIndex((r) => r.key === route.key);

                    return (
                        <TabItem
                            key={route.key}
                            route={route}
                            options={options}
                            isFocused={isFocused}
                            navigation={navigation}
                        />
                    );
                })}
            </View>
        </View>
    );
}

// Separate component for internal animation logic
function TabItem({ route, options, isFocused, navigation }: any) {
    const onPress = () => {
        const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
        });
        if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
        }
    };

    const onLongPress = () => {
        navigation.emit({ type: "tabLongPress", target: route.key });
    };

    // Upwards shift inside the floating badge
    const shiftOffset = CIRCLE_TOP_OFFSET + (CIRCLE_SIZE / 2) - (TAB_BAR_HEIGHT / 2);

    const iconStyle = {
        transform: [
            { translateY: isFocused ? shiftOffset : 0 },
            { scale: isFocused ? 1.08 : 1 },
        ],
    };

    const name = route.name;
    let iconName: keyof typeof Ionicons.glyphMap = "help-circle-outline" as any;
    if (name === "index") iconName = isFocused ? "home" : "home-outline";
    if (name === "search") iconName = isFocused ? "search" : "search-outline";
    if (name === "my-rentals") iconName = isFocused ? "list" : "list-outline";
    if (name === "history") iconName = isFocused ? "time" : "time-outline";
    if (name === "profile") iconName = isFocused ? "person" : "person-outline";

    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={(options as any).tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
            activeOpacity={1}
        >
            <View style={[styles.iconContainer, iconStyle]}>
                <Ionicons
                    name={iconName}
                    size={23}
                    color={isFocused ? Colors.white : Colors.text}
                />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: "absolute",
        left: TAB_BAR_MARGIN,
        right: TAB_BAR_MARGIN,
        zIndex: 100,
        backgroundColor: Colors.background,
    },
    pillContainer: {
        ...StyleSheet.absoluteFillObject,
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        overflow: "hidden", // bounds the massive SVG
        backgroundColor: "transparent",
    },
    floatingCircle: {
        position: "absolute",
        top: CIRCLE_TOP_OFFSET,
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        borderRadius: CIRCLE_SIZE / 2,
        backgroundColor: Colors.primary,
        zIndex: 2, // ABOVE the pill
        // Softer shadow for the floating circle
        elevation: 4,
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
    },
    tabsContainer: {
        flexDirection: "row",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10, // MUST be above the floating badge
    },
    tabButton: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    iconContainer: {
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
    },
});
