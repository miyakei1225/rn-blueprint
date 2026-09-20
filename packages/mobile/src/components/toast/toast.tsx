import { useEffect, useRef, useState } from "react";
import { Animated, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";

type ToastProps = {
  message: string;
  /** 出しきってから消え始めるまでの時間 */
  visibleForMs?: number;
};

const FADE_IN_MS = 180;
const FADE_OUT_MS = 240;
/** 出てくる距離。下に少し沈んだ位置から上がってくる */
const SLIDE_DISTANCE = 16;

/**
 * 操作の結果を一度だけ知らせる帯。画面の下から重ねて出し、自動で消える。
 *
 * Alert にしないのは、成功の報告でタップを 1 回増やしたくないため。消えたあとは
 * 何も残らないので、後から確認したい情報はこれに載せず画面本体に出すこと。
 */
export function Toast({ message, visibleForMs = 4000 }: ToastProps) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: FADE_IN_MS, useNativeDriver: true }),
      Animated.delay(visibleForMs),
      Animated.timing(opacity, { toValue: 0, duration: FADE_OUT_MS, useNativeDriver: true }),
    ]);

    animation.start(({ finished }) => {
      // 画面遷移で途中停止したときに残さない
      if (finished) {
        setMounted(false);
      }
    });

    return () => animation.stop();
  }, [opacity, visibleForMs]);

  if (!mounted) {
    return null;
  }

  return (
    <Animated.View
      // 消えていく途中もタップを通す
      pointerEvents="none"
      style={{
        opacity,
        bottom: insets.bottom + 24,
        transform: [
          {
            translateY: opacity.interpolate({
              inputRange: [0, 1],
              outputRange: [SLIDE_DISTANCE, 0],
            }),
          },
        ],
      }}
      className="absolute left-4 right-4"
    >
      <View className="flex-row items-center justify-center gap-2 rounded-2xl bg-success px-4 py-3">
        <ThemedText className="text-sm" style={{ color: "#FFFFFF", fontWeight: "700" }}>
          ✓
        </ThemedText>
        <ThemedText className="text-center text-sm" style={{ color: "#FFFFFF" }}>
          {message}
        </ThemedText>
      </View>
    </Animated.View>
  );
}
