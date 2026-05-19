import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

const API_IP = "172.20.10.6"; // replace with your backend IP
const METRICS_API_URL = `http://${API_IP}:5000/api/metrics`;
const HISTORY_API_URL = `http://${API_IP}:5000/api/history`;

type ProjectType = "Django" | "Flask" | string;

type ProjectMetric = {
  project_name: string;
  project_type: ProjectType;
  avg_complexity_before: number | string | null;
  avg_complexity_after: number | string | null;
  avg_maintainability_before: number | string | null;
  avg_maintainability_after: number | string | null;
  code_smells_before: number | string | null;
  code_smells_after: number | string | null;
};

type HistoryRecord = {
  id: number;
  project_name: string;
  project_type: ProjectType;
  cyclomatic_complexity: number | string | null;
  maintainability_index: number | string | null;
  code_smells: number | string | null;
  response_time_ms: number | string | null;
  total_sprints: number | string | null;
  completed_sprints: number | string | null;
  measurement_stage: string | null;
  measured_at: string;
};

type MetricChange = {
  label: string;
  before: number;
  after: number;
  change: number;
  improved: boolean;
  unit?: string;
};

type ProjectSprintMetrics = {
  projectName: string;
  projectType: ProjectType;
  records: HistoryRecord[];
  first: HistoryRecord;
  latest: HistoryRecord;
  changes: MetricChange[];
  totalSprints: number;
  completedSprints: number;
};

const toNumber = (value: number | string | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatNumber = (value: number, digits = 2) => value.toFixed(digits);

const formatStage = (stage: string | null) => {
  if (!stage) return "Unknown";

  return stage
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const compareHistoryRecords = (a: HistoryRecord, b: HistoryRecord) => {
  const sprintDiff = toNumber(a.completed_sprints) - toNumber(b.completed_sprints);
  if (sprintDiff !== 0) return sprintDiff;

  return new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime();
};

const buildChanges = (first: HistoryRecord, latest: HistoryRecord): MetricChange[] => [
  {
    label: "Cyclomatic Complexity",
    before: toNumber(first.cyclomatic_complexity),
    after: toNumber(latest.cyclomatic_complexity),
    change:
      toNumber(first.cyclomatic_complexity) -
      toNumber(latest.cyclomatic_complexity),
    improved:
      toNumber(latest.cyclomatic_complexity) <
      toNumber(first.cyclomatic_complexity)
  },
  {
    label: "Maintainability Index",
    before: toNumber(first.maintainability_index),
    after: toNumber(latest.maintainability_index),
    change:
      toNumber(latest.maintainability_index) -
      toNumber(first.maintainability_index),
    improved:
      toNumber(latest.maintainability_index) >
      toNumber(first.maintainability_index)
  },
  {
    label: "Code Smells",
    before: toNumber(first.code_smells),
    after: toNumber(latest.code_smells),
    change: toNumber(first.code_smells) - toNumber(latest.code_smells),
    improved: toNumber(latest.code_smells) < toNumber(first.code_smells)
  },
  {
    label: "Response Time",
    before: toNumber(first.response_time_ms),
    after: toNumber(latest.response_time_ms),
    change: toNumber(first.response_time_ms) - toNumber(latest.response_time_ms),
    improved: toNumber(latest.response_time_ms) < toNumber(first.response_time_ms),
    unit: " ms"
  }
];

export default function Metrics() {
  const [projects, setProjects] = useState<ProjectMetric[]>([]);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = fetch(`${METRICS_API_URL}/projects`)
      .then((res) => res.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch((err) => console.log("Error fetching project metrics:", err));

    const fetchHistory = fetch(`${HISTORY_API_URL}/`)
      .then((res) => res.json())
      .then((data) => setHistoryRecords(Array.isArray(data) ? data : []))
      .catch((err) => console.log("Error fetching sprint history:", err));

    Promise.all([fetchProjects, fetchHistory]).finally(() => setLoading(false));
  }, []);

  const sprintMetrics = useMemo(() => {
    const grouped = historyRecords.reduce<Record<string, HistoryRecord[]>>(
      (groups, record) => {
        groups[record.project_name] = groups[record.project_name] ?? [];
        groups[record.project_name].push(record);
        return groups;
      },
      {}
    );

    return Object.values(grouped)
      .map((records) => {
        const sortedRecords = [...records].sort(compareHistoryRecords);
        const first = sortedRecords[0];
        const latest = sortedRecords[sortedRecords.length - 1];

        return {
          projectName: latest.project_name,
          projectType: latest.project_type,
          records: sortedRecords,
          first,
          latest,
          changes: buildChanges(first, latest),
          totalSprints: Math.max(...sortedRecords.map((r) => toNumber(r.total_sprints))),
          completedSprints: Math.max(
            ...sortedRecords.map((r) => toNumber(r.completed_sprints))
          )
        };
      })
      .sort((a, b) => a.projectName.localeCompare(b.projectName));
  }, [historyRecords]);

  const fallbackMetrics = useMemo<ProjectSprintMetrics[]>(
    () =>
      projects.map((project) => {
        const first: HistoryRecord = {
          id: 0,
          project_name: project.project_name,
          project_type: project.project_type,
          cyclomatic_complexity: project.avg_complexity_before,
          maintainability_index: project.avg_maintainability_before,
          code_smells: project.code_smells_before,
          response_time_ms: null,
          total_sprints: 1,
          completed_sprints: 0,
          measurement_stage: "baseline",
          measured_at: ""
        };
        const latest: HistoryRecord = {
          ...first,
          id: 1,
          cyclomatic_complexity: project.avg_complexity_after,
          maintainability_index: project.avg_maintainability_after,
          code_smells: project.code_smells_after,
          completed_sprints: 1,
          measurement_stage: "after_refactoring"
        };

        return {
          projectName: project.project_name,
          projectType: project.project_type,
          records: [first, latest],
          first,
          latest,
          changes: buildChanges(first, latest).filter(
            (change) => change.label !== "Response Time"
          ),
          totalSprints: 1,
          completedSprints: 1
        };
      }),
    [projects]
  );

  const displayedProjects =
    sprintMetrics.length > 0 ? sprintMetrics : fallbackMetrics;

  const summary = useMemo(() => {
    const allChanges = displayedProjects.flatMap((project) => project.changes);
    const getAverageChange = (label: string) => {
      const values = allChanges.filter((change) => change.label === label);
      if (values.length === 0) return 0;

      return (
        values.reduce((total, change) => total + change.change, 0) /
        values.length
      );
    };

    return {
      totalProjects: displayedProjects.length,
      totalSprintRecords: historyRecords.length,
      totalCompletedSprints: displayedProjects.reduce(
        (total, project) => total + project.completedSprints,
        0
      ),
      complexityGain: getAverageChange("Cyclomatic Complexity"),
      maintainabilityGain: getAverageChange("Maintainability Index"),
      smellReduction: getAverageChange("Code Smells")
    };
  }, [displayedProjects, historyRecords.length]);

  const renderInsight = (
    icon: keyof typeof MaterialCommunityIcons.glyphMap,
    label: string,
    value: string | number,
    detail: string
  ) => (
    <View style={styles.insightCard} key={label}>
      <MaterialCommunityIcons name={icon} size={28} color="#36BBA7" />
      <View style={styles.insightText}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.insightDetail}>{detail}</Text>
      </View>
    </View>
  );

  const renderChangeRow = (change: MetricChange) => (
    <View
      style={[
        styles.metricRow,
        {
          backgroundColor: change.improved ? "#E4F7EF" : "#FDE8E8",
          borderBottomWidth: 0,
          borderRadius: 10,
          marginBottom: 8,
          paddingHorizontal: 10
        }
      ]}
      key={change.label}
    >
      <View style={styles.metricText}>
        <Text style={styles.label}>{change.label}</Text>
        <Text style={styles.insightDetail}>
          {formatNumber(change.before)}
          {change.unit ?? ""} to {formatNumber(change.after)}
          {change.unit ?? ""}
        </Text>
      </View>
      <Text
        style={[
          styles.metricValue,
          { color: change.improved ? "#126B5D" : "#9B1C1C" }
        ]}
      >
        {change.change >= 0 ? "+" : ""}
        {formatNumber(change.change)}
        {change.unit ?? ""}
      </Text>
    </View>
  );

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
      <Text style={styles.title}>Code Quality Metrics</Text>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={{ fontSize: 25 }}>
          QUALITY SUMMARY
        </ThemedText>
      </ThemedView>

      <View style={styles.card}>
        <Text style={styles.label}>Projects Analysed</Text>
        <Text style={styles.value}>{summary.totalProjects}</Text>
      </View>

      <View style={styles.statsGrid}>
        {renderInsight(
          "source-branch",
          "Completed Sprints",
          summary.totalCompletedSprints,
          `${summary.totalSprintRecords} historical sprint records included`
        )}
        {renderInsight(
          "chart-line",
          "Avg Complexity Gain",
          formatNumber(summary.complexityGain),
          "Calculated from each project's first sprint to latest sprint"
        )}
        {renderInsight(
          "shield-check",
          "Avg Maintainability Gain",
          formatNumber(summary.maintainabilityGain),
          "Higher maintainability is treated as improvement"
        )}
        {renderInsight(
          "bug-check",
          "Avg Code Smells Removed",
          formatNumber(summary.smellReduction),
          "Lower code smells means cleaner refactored code"
        )}
      </View>

      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={{ fontSize: 25 }}>
          SPRINT QUALITY DETAIL
        </ThemedText>
      </ThemedView>

      {displayedProjects.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.projectTitle}>No metric records found</Text>
          <Text style={styles.projectDetails}>
            Add project or sprint history records to see metrics here.
          </Text>
        </View>
      ) : (
        displayedProjects.map((project) => (
          <View style={styles.projectCard} key={project.projectName}>
            <Text style={styles.projectTitle}>
              <MaterialCommunityIcons
                name={
                  project.projectType === "Django" ? "language-python" : "flask"
                }
                size={24}
                color={project.projectType === "Django" ? "#000000" : "#F05A28"}
                style={{ marginRight: 8 }}
              />{" "}
              {project.projectName}
            </Text>

            <View style={styles.metricRow}>
              <Text style={styles.label}>Sprints used</Text>
              <Text style={styles.metricValue}>
                {project.records.length} records, {project.completedSprints}/
                {project.totalSprints || project.completedSprints} completed
              </Text>
            </View>

            {project.changes.map(renderChangeRow)}

            <Text style={styles.sectionTitle}>Previous Sprint Records</Text>
            {project.records.map((record) => (
              <View style={styles.sprintBlock} key={`${record.id}-${record.measured_at}`}>
                <Text style={styles.projectDetails}>
                  Sprint {toNumber(record.completed_sprints)}/
                  {toNumber(record.total_sprints) || project.totalSprints} -{" "}
                  {formatStage(record.measurement_stage)}
                </Text>
                <Text style={styles.insightDetail}>
                  Complexity {formatNumber(toNumber(record.cyclomatic_complexity))}
                  {" | "}Maintainability{" "}
                  {formatNumber(toNumber(record.maintainability_index))}
                  {" | "}Smells {toNumber(record.code_smells)}
                  {record.response_time_ms != null
                    ? ` | Response ${toNumber(record.response_time_ms)} ms`
                    : ""}
                </Text>
              </View>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#0E2A25", flex: 1, padding: 16, paddingTop: 28 },
  title: { color: "#F4FBFA", fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  titleContainer: {
    flexDirection: "row",
    marginBottom: 10,
    backgroundColor: "#1D4ED8",
    width: "100%",
    borderRadius: 10,
    borderColor: "#36BBA7",
    borderWidth: 1,
    alignSelf: "center",
    justifyContent: "center"
  },
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 20,
    borderColor: "#36BBA7",
    borderWidth: 1,
    borderStyle: "dashed",
    marginBottom: 15
  },
  statsGrid: {
    gap: 12,
    marginBottom: 15
  },
  insightCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 20,
    borderColor: "#36BBA7",
    borderWidth: 1,
    borderStyle: "dashed",
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  insightText: {
    flex: 1
  },
  insightDetail: {
    color: "#555",
    fontSize: 13,
    marginTop: 4
  },
  sectionTitle: {
    color: "#123B36",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 14
  },
  metricRow: {
    alignItems: "center",
    borderBottomColor: "#e0e0e0",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8
  },
  metricText: {
    flex: 1,
    paddingRight: 12
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 12,
    textAlign: "right"
  },
  label: { fontSize: 16, color: "#555" },
  value: { color: "#126B5D", fontSize: 20, fontWeight: "bold", marginTop: 5 },
  projectCard: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 20,
    borderColor: "#36BBA7",
    borderWidth: 1,
    borderStyle: "dashed",
    marginBottom: 10
  },
  projectTitle: { color: "#123B36", fontSize: 20, fontWeight: "bold", marginBottom: 5 },
  projectDetails: { fontSize: 16, fontWeight: "bold" },
  sprintBlock: {
    backgroundColor: "#F4FBFA",
    borderRadius: 10,
    marginBottom: 8,
    padding: 10
  }
});
