import { type ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";

const OPEN_DURATION_MS = 260;
const CLOSE_DURATION_MS = 200;

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
};

/**
 * 下からせり上がるシート。
 *
 * Modal の animationType="slide" を使わないのは、あれがモーダルの中身を丸ごと動かすため。
 * 半透明の背景まで一緒にスライドしてしまい、暗幕が下から差し込んでくるように見える。
 * 背景はフェード、シートはスライドと別々に持たせて、暗幕は最初から画面全体を覆わせる。
 */
export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);

  // 閉じるアニメーションを見せるため、visible が false になっても
  // 動き終わるまでは Modal を出したままにする
  const [mounted, setMounted] = useState(visible);
  const [sheetHeight, setSheetHeight] = useState(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
    }
  }, [visible]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    if (visible) {
      // 高さが分かるまでスライド量を決められないので、計測できてから動かす
      if (sheetHeight > 0) {
        progress.value = withTiming(1, {
          duration: OPEN_DURATION_MS,
          easing: Easing.out(Easing.cubic),
        });
      }
      return;
    }

    progress.value = withTiming(
      0,
      { duration: CLOSE_DURATION_MS, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(setMounted)(false);
        }
      },
    );
  }, [mounted, visible, sheetHeight, progress]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  const sheetStyle = useAnimatedStyle(
    () => ({
      // 計測前は translateY を決められない。定位置のまま一瞬見えるのを避ける
      opacity: sheetHeight === 0 ? 0 : 1,
      transform: [{ translateY: (1 - progress.value) * sheetHeight }],
    }),
    [sheetHeight],
  );

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
            onPress={onClose}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <KeyboardAvoidingView behavior="padding">
          <Animated.View
            style={sheetStyle}
            onLayout={(event) => setSheetHeight(event.nativeEvent.layout.height)}
          >
            <ThemedView
              className="gap-4 rounded-t-3xl p-5"
              style={{ paddingBottom: insets.bottom + 20 }}
            >
              {children}
            </ThemedView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
});
