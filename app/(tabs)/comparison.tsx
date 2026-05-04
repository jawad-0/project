import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const API_IP = "172.20.10.6"; // replace with your backend IP
const API_BASE_URL = `http://${API_IP}:5000/api/comparison`;

export default function Comparison() {
  const [projects, setProjects] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = fetch(`${API_BASE_URL}/`)
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .catch((err) => console.log("Error fetching project comparison:", err));

    const fetchTypes = fetch(`${API_BASE_URL}/type`)
      .then((res) => res.json())
      .then((data) => setTypes(data))
      .catch((err) => console.log("Error fetching type comparison:", err));

    Promise.all([fetchProjects, fetchTypes]).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Before vs After Comparison</Text>
        <Text>Loading data...</Text>
      </View>
    );
  }

  const getChangeText = (before, after) => {
    if (after < before) return "Decreased ⬇️";
    if (after > before) return "Increased ⬆️";
    return "No Change";
  };

  const getChangeStyle = (before, after) => ({
    color: after < before ? "red" : after > before ? "green" : "gray",
    fontWeight: "bold"
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Before vs After Comparison (Projects)</Text>
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontSize: 25
          }}
        >
          COMPARISON
        </ThemedText>
      </ThemedView>

      {/* Project-level Comparison */}
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

          <Text>
            Complexity: {project.avg_complexity_before} →{" "}
            <Text style={{ fontWeight: "bold" }}>
              {project.avg_complexity_after}
            </Text>{" "}
            <Text
              style={getChangeStyle(
                project.avg_complexity_before,
                project.avg_complexity_after
              )}
            >
              (
              {getChangeText(
                project.avg_complexity_before,
                project.avg_complexity_after
              )}
              )
            </Text>
          </Text>

          <Text>
            Maintainability: {project.avg_maintainability_before} →{" "}
            <Text style={{ fontWeight: "bold" }}>
              {project.avg_maintainability_after}
            </Text>{" "}
            <Text
              style={getChangeStyle(
                project.avg_maintainability_before,
                project.avg_maintainability_after
              )}
            >
              (
              {getChangeText(
                project.avg_maintainability_before,
                project.avg_maintainability_after
              )}
              )
            </Text>
          </Text>

          <Text>
            Code Smells: {project.code_smells_before} →{" "}
            <Text style={{ fontWeight: "bold" }}>
              {project.code_smells_after}
            </Text>{" "}
            <Text
              style={getChangeStyle(
                project.code_smells_before,
                project.code_smells_after
              )}
            >
              (
              {getChangeText(
                project.code_smells_before,
                project.code_smells_after
              )}
              )
            </Text>
          </Text>
        </View>
      ))}

      {/* Type-level Comparison */}
      {types.length > 0 && (
        <>
          <Text style={[styles.title, { marginTop: 20 }]}>
            Comparison by Project Type
          </Text>
          {types.map((t) => (
            <View style={styles.card} key={t.project_type}>
              <Text style={styles.projectTitle}>{t.project_type}</Text>
              <Text>
                Avg Complexity Reduction:{" "}
                <Text style={{ fontWeight: "bold" }}>
                  {t.avg_complexity_reduction?.toFixed(2) ?? 0}
                </Text>
              </Text>
              <Text>
                Avg Maintainability Gain:{" "}
                <Text style={{ fontWeight: "bold" }}>
                  {t.avg_maintainability_gain?.toFixed(2) ?? 0}
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
  }
});
