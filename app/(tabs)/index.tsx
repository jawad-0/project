import { Image } from "expo-image";

import { HelloWave } from "@/components/hello-wave";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { DevSettings, Pressable, StyleSheet, Text, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function HomeScreen() {
  const refreshApp = () => {
    DevSettings.reload();
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#123B36", dark: "#071B18" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <View style={styles.topRow}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title" style={styles.screenTitle}>
            Research Portfolio
          </ThemedText>
          <HelloWave />
        </ThemedView>

        <Pressable
          accessibilityLabel="Refresh app data"
          accessibilityRole="button"
          onPress={refreshApp}
          style={({ pressed }) => [
            styles.refreshButton,
            pressed ? styles.refreshButtonPressed : null
          ]}
        >
          <MaterialCommunityIcons name="refresh" size={24} color="#F4FBFA" />
        </Pressable>
      </View>

      <View style={styles.heroCard}>
        <MaterialCommunityIcons
          name="chart-timeline-variant"
          size={34}
          color="#126B5D"
        />
        <View style={styles.heroText}>
          <ThemedText type="subtitle" style={styles.cardHeading}>
            Refactoring Impact Analysis
          </ThemedText>
          <ThemedText style={styles.cardCopy}>
            Track sprint-by-sprint changes in complexity, maintainability, code
            smells, and API response time across Django and Flask projects.
          </ThemedText>
        </View>
      </View>

      <View style={styles.widgetGrid}>
        <View style={styles.widgetCard}>
          <MaterialCommunityIcons
            name="language-python"
            size={24}
            color="#123B36"
          />
          <Text style={styles.widgetValue}>Django</Text>
          <Text style={styles.widgetLabel}>Monolithic baseline</Text>
        </View>
        <View style={styles.widgetCard}>
          <MaterialCommunityIcons name="flask" size={24} color="#F05A28" />
          <Text style={styles.widgetValue}>Flask</Text>
          <Text style={styles.widgetLabel}>Microservice comparison</Text>
        </View>
        <View style={styles.widgetCard}>
          <MaterialCommunityIcons
            name="source-branch"
            size={24}
            color="#126B5D"
          />
          <Text style={styles.widgetValue}>Sprint 0+</Text>
          <Text style={styles.widgetLabel}>History timeline</Text>
        </View>
        <View style={styles.widgetCard}>
          <MaterialCommunityIcons
            name="speedometer"
            size={24}
            color="#9B1C1C"
          />
          <Text style={styles.widgetValue}>API</Text>
          <Text style={styles.widgetLabel}>Performance review</Text>
        </View>
      </View>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Research Details
        </ThemedText>
        <ThemedText style={styles.cardCopy}>Name: Muhammad Jawad</ThemedText>
        <ThemedText style={styles.cardCopy}>Student ID: 100772938</ThemedText>
        <ThemedText style={styles.cardCopy}>
          Module: Independent Scholarship
        </ThemedText>
        <ThemedText style={styles.cardCopy}>
          Code: 2025-SPR-KED-7CS997
        </ThemedText>
        <ThemedText style={styles.cardCopy}>MSc: IT</ThemedText>
        <ThemedText style={styles.cardCopy}>
          Supervisor: Mubeen Aslam
        </ThemedText>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Project Title{" "}
        </ThemedText>
        <ThemedText style={{ color: "#126B5D" }}>
          Analysis of Refactoring Impact on Monolithic Django and
          Microservice-Based Flask Applications
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  titleContainer: {
    backgroundColor: "#0F766E",
    borderColor: "#36BBA7",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  screenTitle: {
    color: "white",
    fontSize: 28,
  },
  refreshButton: {
    alignItems: "center",
    backgroundColor: "#0F766E",
    borderColor: "#36BBA7",
    borderRadius: 14,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  refreshButtonPressed: {
    opacity: 0.75
  },
  heroCard: {
    alignItems: "center",
    backgroundColor: "white",
    borderColor: "#36BBA7",
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: "dashed",
    flexDirection: "row",
    gap: 14,
    padding: 16
  },
  heroText: {
    flex: 1
  },
  cardHeading: {
    color: "#123B36"
  },
  cardCopy: {
    color: "#126B5D",
    marginTop: 4
  },
  widgetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  widgetCard: {
    backgroundColor: "white",
    borderColor: "#36BBA7",
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 12,
    width: "48%"
  },
  widgetValue: {
    color: "#123B36",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8
  },
  widgetLabel: {
    color: "#55736D",
    fontSize: 13,
    marginTop: 3
  },
  stepContainer: {
    backgroundColor: "white",
    borderColor: "#36BBA7",
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 8,
    marginBottom: 8,
    padding: 16
  },
  sectionTitle: {
    color: "#123B36",
    marginBottom: 4
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute"
  }
});
