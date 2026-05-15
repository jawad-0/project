import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

const API_IP = "172.20.10.6"; // replace with your backend IP
const API_BASE_URL = `http://${API_IP}:5000/api/history`;

type HistoryRecord = {
  id: number;
  project_name: string;
  project_type: "Django" | "Flask";
  cyclomatic_complexity: number | null;
  maintainability_index: number | null;
  code_smells: number | null;
  response_time_ms: number | null;
  total_sprints: number | null;
  completed_sprints: number | null;
  total_tasks: number | null;
  completed_tasks: number | null;
  measurement_stage:
    | "baseline"
    | "during_refactoring"
    | "after_refactoring"
    | "maintenance"
    | null;
  notes: string | null;
  measured_at: string;
};

type HistorySummary = {
  total_records: number;
  total_projects: number;
  avg_complexity: number | string | null;
  avg_maintainability: number | string | null;
  avg_response_time: number | string | null;
};

type StageCount = {
  measurement_stage: string;
  total_records: number;
};

export default function History() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [summary, setSummary] = useState<HistorySummary>({
    total_records: 0,
    total_projects: 0,
    avg_complexity: 0,
    avg_maintainability: 0,
    avg_response_time: 0
  });
  const [stages, setStages] = useState<StageCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJson = async (url: string) => {
      const res = await fetch(url);
      const text = await res.text();

      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}: ${text.slice(0, 80)}`);
      }

      try {
        return JSON.parse(text);
      } catch {
        throw new Error(`Expected JSON from ${url}, received: ${text.slice(0, 80)}`);
      }
    };

    const fetchRecords = fetchJson(`${API_BASE_URL}/`)
      .then((data) => setRecords(Array.isArray(data) ? data : []))
      .catch((err) => console.log("Error fetching history records:", err));

    const fetchSummary = fetchJson(`${API_BASE_URL}/summary`)
      .then((data) =>
        setSummary({
          total_records: Number(data.total_records ?? 0),
          total_projects: Number(data.total_projects ?? 0),
          avg_complexity: data.avg_complexity ?? 0,
          avg_maintainability: data.avg_maintainability ?? 0,
          avg_response_time: data.avg_response_time ?? 0
        })
      )
      .catch((err) => console.log("Error fetching history summary:", err));

    const fetchStages = fetchJson(`${API_BASE_URL}/stages`)
      .then((data) => setStages(Array.isArray(data) ? data : []))
      .catch((err) => console.log("Error fetching history stages:", err));

    Promise.all([fetchRecords, fetchSummary, fetchStages]).finally(() =>
      setLoading(false)
    );
  }, []);

  const formatNumber = (value: number | string | null, suffix = "") => {
    if (value == null) return "N/A";

    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return "N/A";

    return `${numericValue.toFixed(2)}${suffix}`;
  };

  const formatInteger = (value: number | null, suffix = "") => {
    if (value == null) return "N/A";

    return `${value}${suffix}`;
  };

  const formatStage = (stage: HistoryRecord["measurement_stage"] | string) => {
    if (!stage) return "Unknown";

    return stage
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatDate = (value: string) => {
    if (!value) return "N/A";

    return new Date(value).toLocaleString();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Project Metrics History</Text>
        <Text>Loading data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Project Metrics History</Text>
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontSize: 25
          }}
        >
          HISTORY
        </ThemedText>
      </ThemedView>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.label}>Records</Text>
          <Text style={styles.value}>{summary.total_records}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.label}>Projects</Text>
          <Text style={styles.value}>{summary.total_projects}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.label}>Avg Complexity</Text>
          <Text style={styles.value}>
            {formatNumber(summary.avg_complexity)}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.label}>Avg Response</Text>
          <Text style={styles.value}>
            {formatNumber(summary.avg_response_time, " ms")}
          </Text>
        </View>
      </View>

      {stages.length > 0 && (
        <View style={styles.stageCard}>
          <Text style={styles.sectionTitle}>Records by Stage</Text>
          {stages.map((stage) => (
            <View style={styles.stageRow} key={stage.measurement_stage}>
              <Text style={styles.stageName}>
                {formatStage(stage.measurement_stage)}
              </Text>
              <Text style={styles.stageCount}>{stage.total_records}</Text>
            </View>
          ))}
        </View>
      )}

      {records.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.projectTitle}>No history records found</Text>
          <Text style={styles.detailText}>
            Add rows to project_metrics_history to see them here.
          </Text>
        </View>
      ) : (
        records.map((record) => (
          <View style={styles.card} key={record.id}>
            <Text style={styles.projectTitle}>
              <MaterialCommunityIcons
                name={
                  record.project_type === "Django" ? "language-python" : "flask"
                }
                size={24}
                color={record.project_type === "Django" ? "#000000" : "#F05A28"}
                style={{ marginRight: 8 }}
              />{" "}
              {record.project_name}
            </Text>

            <Text style={styles.stageBadge}>
              {formatStage(record.measurement_stage)}
            </Text>
            <Text style={styles.measuredAt}>
              Measured: {formatDate(record.measured_at)}
            </Text>

            <View style={styles.metricsGrid}>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>Complexity</Text>
                <Text style={styles.metricValue}>
                  {formatNumber(record.cyclomatic_complexity)}
                </Text>
              </View>

              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>Maintainability</Text>
                <Text style={styles.metricValue}>
                  {formatNumber(record.maintainability_index)}
                </Text>
              </View>

              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>Code Smells</Text>
                <Text style={styles.metricValue}>
                  {formatInteger(record.code_smells)}
                </Text>
              </View>

              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>Response</Text>
                <Text style={styles.metricValue}>
                  {formatInteger(record.response_time_ms, " ms")}
                </Text>
              </View>
            </View>

            <Text style={styles.detailText}>
              Sprints: {record.completed_sprints ?? 0}/
              {record.total_sprints ?? 0}
            </Text>
            <Text style={styles.detailText}>
              Tasks: {record.completed_tasks ?? 0}/{record.total_tasks ?? 0}
            </Text>

            {record.notes ? (
              <Text style={styles.notes}>Notes: {record.notes}</Text>
            ) : null}
          </View>
        ))
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

  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 15
  },

  summaryCard: {
    backgroundColor: "white",
    borderColor: "black",
    borderStyle: "dashed",
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    width: "48%"
  },

  label: { color: "#555", fontSize: 14 },
  value: { fontSize: 18, fontWeight: "bold", marginTop: 4 },

  stageCard: {
    backgroundColor: "#f5f5f5",
    borderColor: "black",
    borderStyle: "dashed",
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    marginBottom: 15
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10
  },

  stageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },

  stageName: { fontSize: 15, color: "#333" },
  stageCount: { fontSize: 15, fontWeight: "bold" },

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
    marginBottom: 8
  },

  stageBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#D9F4EF",
    borderRadius: 8,
    color: "#126B5D",
    fontWeight: "bold",
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 4
  },

  measuredAt: {
    color: "#555",
    marginBottom: 12
  },

  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12
  },

  metricBlock: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    width: "48%"
  },

  metricLabel: {
    color: "#555",
    fontSize: 13
  },

  metricValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 3
  },

  detailText: {
    fontSize: 15,
    marginBottom: 4
  },

  notes: {
    color: "#333",
    fontSize: 15,
    fontStyle: "italic",
    marginTop: 8
  }
});
