import { Link, Stack } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <ThemedView className="flex-1 items-center justify-center gap-3 p-6">
        <ThemedText type="title">This screen doesn&apos;t exist.</ThemedText>
        <Link href="/">
          <ThemedText type="link">Go to home screen</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}
