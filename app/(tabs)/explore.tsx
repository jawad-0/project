import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts } from "@/constants/theme";

export default function TabTwoScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#123B36", dark: "#071B18" }}
      headerImage={
        <IconSymbol
          size={310}
          color="#36BBA7"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={styles.screenTitle}>
          Research Context
        </ThemedText>
      </ThemedView>

      <View style={styles.infoCard}>
        <MaterialCommunityIcons name="information-outline" size={28} color="#126B5D" />
        <ThemedText style={styles.infoText}>
          This React Native app visualizes software quality metrics collected
          from Django and Flask systems, helping evaluate how refactoring affects
          code quality and backend performance over time.
        </ThemedText>
      </View>

      <View style={styles.workflowGrid}>
        <View style={styles.workflowCard}>
          <MaterialCommunityIcons name="database-search" size={24} color="#126B5D" />
          <Text style={styles.workflowTitle}>Collect</Text>
          <Text style={styles.workflowText}>Store sprint metrics and stages.</Text>
        </View>
        <View style={styles.workflowCard}>
          <MaterialCommunityIcons name="compare-horizontal" size={24} color="#126B5D" />
          <Text style={styles.workflowTitle}>Compare</Text>
          <Text style={styles.workflowText}>Review previous sprint vs now.</Text>
        </View>
        <View style={styles.workflowCard}>
          <MaterialCommunityIcons name="chart-box-outline" size={24} color="#126B5D" />
          <Text style={styles.workflowTitle}>Analyze</Text>
          <Text style={styles.workflowText}>Summarize gains and regressions.</Text>
        </View>
      </View>

      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={styles.screenTitle}>
          Application Goals
        </ThemedText>
      </ThemedView>

      <View style={styles.objectiveCard}>
        {[
          "Display cyclomatic complexity and maintainability trends",
          "Compare code quality before and after refactoring",
          "Visualize backend response-time improvements",
          "Provide an interactive dashboard for research analysis"
        ].map((objective) => (
          <View style={styles.objectiveRow} key={objective}>
            <MaterialCommunityIcons name="check-circle" size={18} color="#126B5D" />
            <Text style={styles.objectiveText}>{objective}</Text>
          </View>
        ))}
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "#36BBA7",
    bottom: -90,
    left: -35,
    position: "absolute"
  },
  titleContainer: {
    backgroundColor: "#155E75",
    borderColor: "#36BBA7",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  screenTitle: {
    color: "white",
    fontFamily: Fonts.rounded
  },
  infoCard: {
    alignItems: "flex-start",
    backgroundColor: "white",
    borderColor: "#36BBA7",
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: "dashed",
    flexDirection: "row",
    gap: 12,
    padding: 16
  },
  infoText: {
    color: "#35524C",
    flex: 1
  },
  workflowGrid: {
    flexDirection: "row",
    gap: 10
  },
  workflowCard: {
    backgroundColor: "white",
    borderColor: "#36BBA7",
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    flex: 1,
    padding: 12
  },
  workflowTitle: {
    color: "#123B36",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8
  },
  workflowText: {
    color: "#55736D",
    fontSize: 12,
    marginTop: 4
  },
  objectiveCard: {
    backgroundColor: "white",
    borderColor: "#36BBA7",
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 10,
    padding: 16
  },
  objectiveRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  objectiveText: {
    color: "#35524C",
    flex: 1,
    fontSize: 15,
    fontWeight: "600"
  }
});
