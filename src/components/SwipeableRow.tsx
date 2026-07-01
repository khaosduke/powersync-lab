import React, { Component, PropsWithChildren } from 'react';
import { I18nManager, StyleSheet, Text, View } from 'react-native';

import { RectButton } from 'react-native-gesture-handler';

import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { Todo } from '@/lib/powersync/powersync_app_schema';

import Reanimated, {
    interpolate,
    SharedValue,
    useAnimatedStyle,
} from "react-native-reanimated";

interface Props {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
}

function RightAction({
        text,
        color,
        x,
        progress,
        onPress,
        }: {
        text: string;
        color: string;
        x: number;
        progress: SharedValue<number>;
        onPress: () => void;
        }) {
        const animatedStyle = useAnimatedStyle(() => {
            const trans = interpolate(progress.value, [0, 1], [x, 0]);

            return {
            transform: [{ translateX: trans }],
            };
        });

    return (
        <Reanimated.View style={[{ flex: 1 }, animatedStyle]}>
        <RectButton style={[styles.rightAction, { backgroundColor: color }]} onPress={onPress}>
            <Text style={styles.actionText}>{text}</Text>
        </RectButton>
        </Reanimated.View>
    );
    }



export default class AppleStyleSwipeableRow extends Component<PropsWithChildren<Props>> {

  private renderRightActions = (
  progress: SharedValue<number>
) => (
  <View
    style={{
      width: 160,
      flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    }}
  >
    {this.props.todo.completed === 0 && (
      <RightAction
        text="Done"
        color="#00d890"
        x={160}
        progress={progress}
        onPress={() => {
          this.props.onToggle();
          this.close();
        }}
      />
    )}

    {this.props.todo.completed === 1 && (
      <RightAction
        text="Undone"
        color="#ffc44e"
        x={160}
        progress={progress}
        onPress={() => {
          this.props.onToggle();
          this.close();
        }}
      />
    )}

    <RightAction
      text="Delete"
      color="#ff76e8"
      x={160}
      progress={progress}
      onPress={() => {
        this.props.onDelete();
        this.close();
      }}
    />
  </View>
);

  private swipeableRow?: React.ComponentRef<typeof Swipeable>;

  private updateRef = (
    ref: React.ComponentRef<typeof Swipeable> | null
    ) => {
        this.swipeableRow = ref ?? undefined;
    };
 
  private close = () => {
    this.swipeableRow?.close();
    };

  render() {
    const { children } = this.props;
    return (
      <Swipeable
        ref={this.updateRef}
        friction={2}
        enableTrackpadTwoFingerGesture
        rightThreshold={40}
        renderRightActions={this.renderRightActions}>
        {children}
      </Swipeable>
    );
  }
}

const styles = StyleSheet.create({
  actionText: {
    color: 'white',
    fontSize: 16,
    backgroundColor: 'transparent',
    padding: 10,
  },
  rightAction: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});