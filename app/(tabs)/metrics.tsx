import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ScrollView, StyleSheet, Text, View } from "react-native";

const API_IP = "172.20.10.6"; // replace with your backend IP
const API_BASE_URL = `http://${API_IP}:5000/api/metrics`;

export default function Metrics() {
  const [summary, setSummary] = useState({
    complexity_before: 0,
    complexity_after: 0,
    maintainability_before: 0,
    maintainability_after: 0,
    smells_before: 0,
    smells_after: 0
  });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = fetch(`${API_BASE_URL}/`)
      .then((res) => res.json())
      .then((data) =>
        setSummary({
          complexity_before: parseFloat(data.complexity_before ?? 0),
          complexity_after: parseFloat(data.complexity_after ?? 0),
          maintainability_before: parseFloat(data.maintainability_before ?? 0),
          maintainability_after: parseFloat(data.maintainability_after ?? 0),
          smells_before: parseInt(data.smells_before ?? 0),
          smells_after: parseInt(data.smells_after ?? 0)
        })
      )
      .catch((err) => console.log("Error fetching metrics summary:", err));

    const fetchProjects = fetch(`${API_BASE_URL}/projects`)
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .catch((err) => console.log("Error fetching project metrics:", err));

    Promise.all([fetchSummary, fetchProjects]).finally(() => setLoading(false));
  }, []);

  const renderMetricCard = (title, before, after) => {
    const improved = after > before;

    return (
      <View style={styles.cardTop} key={title}>
        <Text style={styles.cardTitle}>{title}</Text>

        <View style={styles.row}>
          <Text style={styles.before}>Before: {before}</Text>
          <Text style={styles.arrow}>→</Text>
          <Text style={styles.after}>After: {after}</Text>
        </View>

        <Text style={[styles.status, { color: improved ? "green" : "red" }]}>
          {improved ? "Improved ✅" : "Needs Improvement ⚠️"}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Code Quality Metrics</Text>
        <Text>Loading data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Code Quality Metrics (Summary)</Text>
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontSize: 25
          }}
        >
          METRICS
        </ThemedText>
      </ThemedView>
      {/* Summary Cards */}
      {renderMetricCard(
        "Cyclomatic Complexity",
        summary.complexity_before,
        summary.complexity_after
      )}
      {renderMetricCard(
        "Maintainability Index",
        summary.maintainability_before,
        summary.maintainability_after
      )}
      {renderMetricCard(
        "Code Smells",
        summary.smells_before,
        summary.smells_after
      )}

      {/* Project-level Metrics */}
      {projects.length > 0 && (
        <>
          <Text style={[styles.title, { marginTop: 20 }]}>
            Metrics Per Project
          </Text>
          {projects.map((p) => (
            <View style={styles.card} key={p.project_name}>
              <Text style={styles.cardTitle}>
                <MaterialCommunityIcons
                  name={
                    p.project_type === "Django" ? "language-python" : "flask"
                  }
                  size={24}
                  color={p.project_type === "Django" ? "#000000" : "#F05A28"}
                  style={{ marginRight: 8 }}
                />{" "}
                {p.project_name}
              </Text>
              {renderMetricCard(
                "Cyclomatic Complexity",
                p.avg_complexity_before,
                p.avg_complexity_after
              )}
              {renderMetricCard(
                "Maintainability Index",
                p.avg_maintainability_before,
                p.avg_maintainability_after
              )}
              {renderMetricCard(
                "Code Smells",
                p.code_smells_before,
                p.code_smells_after
              )}
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20
  },

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
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 10,
    marginBottom: 15
  },

  cardTop: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 20,
    borderColor: "black",
    borderWidth: 2,
    borderStyle: "dashed",
    marginBottom: 15
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    width: 150
  },

  before: {
    fontSize: 16,
    color: "#555"
  },

  arrow: {
    marginHorizontal: 10,
    fontSize: 16
  },

  after: {
    fontSize: 16,
    fontWeight: "bold"
  },

  status: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: "600"
  }
});
