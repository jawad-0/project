import { Image } from "expo-image";

import { HelloWave } from "@/components/hello-wave";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome to Derby Uni!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Name: Muhammad Jawad</ThemedText>
        <ThemedText type="subtitle">Student ID: 100772938</ThemedText>
        <ThemedText type="subtitle">Module: Independent Scholarship</ThemedText>
        <ThemedText type="subtitle">Code: 2025-SPR-KED-7CS997</ThemedText>
        <ThemedText type="subtitle">
          Project Title:{" "}
          <Text style={{ color: "#46ECD5" }}>
            Analysis of Refactoring Impact on Monolithic Django and
            Microservice-Based Flask Applications
          </Text>
        </ThemedText>
        <ThemedText type="subtitle">MSc: IT</ThemedText>
        <ThemedText type="subtitle">Supervisor: Mubeen Aslam</ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute"
  }
});
