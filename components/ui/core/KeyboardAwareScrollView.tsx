import React from "react";
import { ScrollView } from "react-native";
import {
    KeyboardAwareScrollView as ControllerKeyboardAwareScrollView,
    type KeyboardAwareScrollViewProps as ControllerKeyboardAwareScrollViewProps,
} from "react-native-keyboard-controller";

type KeyboardAwareScrollViewProps = ControllerKeyboardAwareScrollViewProps;

export default React.forwardRef<ScrollView, KeyboardAwareScrollViewProps>(
    function KeyboardAwareScrollView(
        {
            bottomOffset = 24,
            extraKeyboardSpace = 8,
            ...props
        },
        ref
    ) {
        return (
            <ControllerKeyboardAwareScrollView
                ref={ref}
                bottomOffset={bottomOffset}
                extraKeyboardSpace={extraKeyboardSpace}
                {...props}
            />
        );
    }
);
