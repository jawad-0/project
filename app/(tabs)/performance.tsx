import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

const API_IP = "172.20.10.6"; // replace with your backend IP
const API_BASE_URL = `http://${API_IP}:5000/api/performance`;

export default function Performance() {
  const [projects, setProjects] = useState([]);
  const [average, setAverage] = useState(0);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = fetch(`${API_BASE_URL}/`)
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .catch((err) => console.log("Error fetching projects:", err));

    const fetchAverage = fetch(`${API_BASE_URL}/average`)
      .then((res) => res.json())
      .then((data) =>
        setAverage(
          data.avg_performance_gain != null
            ? parseFloat(data.avg_performance_gain).toFixed(2)
            : 0
        )
      )
      .catch((err) => console.log("Error fetching average:", err));

    const fetchTypes = fetch(`${API_BASE_URL}/type`)
      .then((res) => res.json())
      .then((data) => setTypes(data))
      .catch((err) => console.log("Error fetching types:", err));

    Promise.all([fetchProjects, fetchAverage, fetchTypes]).finally(() =>
      setLoading(false)
    );
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>API Performance</Text>
        <Text>Loading data...</Text>
      </View>
    );
  }

  const getPerformanceText = (before, after) => {
    if (after < before) return "Improved 🚀 By";
    if (after > before) return "Degraded ⚠️ By";
    return "No Change";
  };

  const getPerformanceStyle = (before, after) => ({
    color: after < before ? "green" : after > before ? "red" : "gray",
    fontWeight: "bold"
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>API Performance (Projects)</Text>
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontSize: 25
          }}
        >
          PERFORMANCE
        </ThemedText>
      </ThemedView>

      {/* Project-level performance */}
      {projects.map((project) => (
        <View style={styles.card} key={project.project_name}>
          <Text style={styles.projectTitle}>
            <MaterialCommunityIcons
              name={
                project.project_type === "Django" ? "language-python" : "flask"
              }
              size={24}
              color={project.project_type === "Django" ? "#000000" : "#F05A28"}
              style={{ marginRight: 8 }}
            />{" "}
            {project.project_name}
          </Text>

          <Text>Before: {project.performance_before} ms</Text>

          <Text>
            After:{" "}
            <Text style={{ fontWeight: "bold" }}>
              {project.performance_after} ms
            </Text>
          </Text>

          <Text
            style={getPerformanceStyle(
              project.performance_before,
              project.performance_after
            )}
          >
            {getPerformanceText(
              project.performance_before,
              project.performance_after
            )}{" "}
            {project.improvement_ms} ms
          </Text>
        </View>
      ))}

      {/* Average Performance */}
      {/* <View style={[styles.card, { backgroundColor: "#d0f0c0" }]}>
        <Text style={styles.projectTitle}>Average Improvement</Text>
        <Text style={{ fontWeight: "bold" }}>{average} ms 🚀</Text>
      </View> */}

      {/* Type-level Performance */}
      {types.length > 0 && (
        <>
          <Text style={[styles.title, { marginTop: 20 }]}>By Project Type</Text>
          {types.map((t) => (
            <View style={styles.card} key={t.project_type}>
              <Text style={styles.projectTitle}>{t.project_type}</Text>
              <Text>
                Avg Improvement:{" "}
                <Text style={{ fontWeight: "bold" }}>
                  {t.avg_performance_gain != null
                    ? parseFloat(t.avg_performance_gain).toFixed(2)
                    : 0}{" "}
                  ms 🚀
                </Text>
              </Text>
            </View>
          ))}
        </>
      )}
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
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 20,
    borderColor: "black",
    borderWidth: 2,
    borderStyle: "dashed",
    marginBottom: 15
  },

  projectTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10
  },

  improvement: {
    marginTop: 10,
    fontWeight: "bold",
    color: "green"
  }
});
