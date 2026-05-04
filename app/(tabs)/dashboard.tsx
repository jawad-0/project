import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const API_IP = "172.20.10.6"; // Replace with your network IP
const API_BASE_URL = `http://${API_IP}:5000/api/dashboard`;

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState({
    totalProjects: 0,
    avgPerformanceGain: 0,
    avgComplexityGain: 0,
    avgMaintainabilityGain: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = fetch(`${API_BASE_URL}/`)
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .catch((err) => console.log("Error fetching projects:", err));

    const fetchCount = fetch(`${API_BASE_URL}/count`)
      .then((res) => res.json())
      .then((data) =>
        setSummary((prev) => ({
          ...prev,
          totalProjects: data.total_projects ?? 0
        }))
      )
      .catch((err) => console.log("Error fetching count:", err));

    // const fetchPerformance = fetch(`${API_BASE_URL}/performance`)
    //   .then((res) => res.json())
    //   .then((data) =>
    //     setSummary((prev) => ({
    //       ...prev,
    //       avgPerformanceGain:
    //         typeof data.avg_performance_gain === "number"
    //           ? data.avg_performance_gain.toFixed(2)
    //           : 0,
    //     }))
    //   )
    //   .catch((err) => console.log("Error fetching performance:", err));

    const fetchGains = fetch(`${API_BASE_URL}/gains`)
      .then((res) => res.json())
      .then((data) =>
        setSummary((prev) => ({
          ...prev,
          avgComplexityGain:
            data.avg_complexity_gain != null
              ? parseFloat(data.avg_complexity_gain).toFixed(2)
              : 0,
          avgMaintainabilityGain:
            data.avg_maintainability_gain != null
              ? parseFloat(data.avg_maintainability_gain).toFixed(2)
              : 0,
          avgPerformanceGain:
            data.avg_performance_gain != null
              ? parseFloat(data.avg_performance_gain).toFixed(2)
              : 0
        }))
      )
      .catch((err) => console.log("Error fetching gains:", err));

    const fetchPerformance = fetch(`${API_BASE_URL}/performance`)
      .then((res) => res.json())
      .then((data) =>
        setSummary((prev) => ({
          ...prev,
          avgPerformanceGain:
            data.avg_performance_gain != null
              ? parseFloat(data.avg_performance_gain).toFixed(2)
              : 0
        }))
      )
      .catch((err) => console.log("Error fetching performance:", err));

    Promise.all([
      fetchProjects,
      fetchCount,
      fetchPerformance,
      fetchGains
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Refactoring Dashboard</Text>
        <Text>Loading data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Refactoring Dashboard</Text>
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontSize: 25
          }}
        >
          DASHBOARD
        </ThemedText>
      </ThemedView>
      {/* Summary Cards */}
      <View style={styles.card}>
        <Text style={styles.label}>Total Projects</Text>
        <Text style={styles.value}>{summary.totalProjects}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Avg Performance Gain</Text>
        <Text style={styles.value}>{summary.avgPerformanceGain}%</Text>
        <Text style={styles.label}>Avg Complexity Gain</Text>
        <Text style={styles.value}>{summary.avgComplexityGain}%</Text>
        <Text style={styles.label}>Avg Maintainability Gain</Text>
        <Text style={styles.value}>{summary.avgMaintainabilityGain}%</Text>
      </View>

      <Text style={styles.line}>-----------------------------------------</Text>

      {/* Project List */}
      <View style={{ marginTop: 20 }}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText
            type="title"
            style={{
              fontSize: 25
            }}
          >
            STATISTICS
          </ThemedText>
        </ThemedView>
        {projects.map((project) => (
          <View key={project.id} style={styles.projectCard}>
            <Text style={styles.projectTitle}>
              <MaterialCommunityIcons
                name={
                  project.project_type === "Django"
                    ? "language-python"
                    : "flask"
                }
                size={24}
                color={
                  project.project_type === "Django" ? "#000000" : "#F05A28"
                }
                style={{ marginRight: 8 }}
              />{" "}
              {project.project_name}
            </Text>
            <Text></Text>
            <Text style={styles.projectDetails}>
              - Performance Before: {project.performance_before}
            </Text>
            <Text style={styles.projectDetails}>
              - Performance After: {project.performance_after}
            </Text>
            <Text></Text>
            <Text style={styles.projectDetails}>
              - Average Complexity Before: {project.avg_complexity_before}
            </Text>
            <Text style={styles.projectDetails}>
              - Average Complexity After: {project.avg_complexity_after}
            </Text>
            <Text></Text>
            <Text style={styles.projectDetails}>
              - Average Maintainability Before:{" "}
              {project.avg_maintainability_before}
            </Text>
            <Text style={styles.projectDetails}>
              - Average Maintainability After:{" "}
              {project.avg_maintainability_after}
            </Text>
            <Text></Text>
            <Text style={styles.projectDetails}>
              - Code Smells Before: {project.code_smells_before}
            </Text>
            <Text style={styles.projectDetails}>
              - Code Smells After: {project.code_smells_after}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  titleContainer: {
    flexDirection: "row",
    marginBottom: 10,
    backgroundColor: "#36BBA7",
    width: "100%",
    borderRadius: 10,
    borderColor: "white",
    borderWidth: 1,
    alignSelf: "center",
    justifyContent: "center"
  },
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 20,
    borderColor: "black",
    borderWidth: 2,
    borderStyle: "dashed",
    marginBottom: 15
  },
  label: { fontSize: 16, color: "#555" },
  line: { fontSize: 25, fontWeight: "bold", color: "#555" },
  value: { fontSize: 20, fontWeight: "bold", marginTop: 5 },
  projectCard: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 20,
    borderColor: "black",
    borderWidth: 2,
    borderStyle: "dashed",
    marginBottom: 10
  },
  projectTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 5 },
  projectDetails: { fontSize: 16, fontWeight: "bold" }
});
