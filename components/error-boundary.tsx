import { Component, ErrorInfo, ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import i18n from "@/i18n";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-gray-50 p-6">
          <Text className="mb-2 text-xl font-bold text-red-600">{i18n.t("errorBoundary.title")}</Text>
          <Text className="mb-4 text-center text-gray-600">
            {this.state.error?.message || i18n.t("errorBoundary.unexpected")}
          </Text>
          <TouchableOpacity
            className="rounded-lg bg-primary px-6 py-3"
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text className="font-semibold text-white">{i18n.t("errorBoundary.retry")}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
