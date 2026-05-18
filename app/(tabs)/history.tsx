import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

const API_IP = "172.20.10.6"; // replace with your backend IP
const API_BASE_URL = `http://${API_IP}:5000/api/history`;

type ProjectType = "Django" | "Flask" | string;

type MeasurementStage =
  | "baseline"
  | "during_refactoring"
  | "after_refactoring"
  | "maintenance"
  | "unknown"
  | string
  | null;

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
  total_tasks: number | string | null;
  completed_tasks: number | string | null;
  measurement_stage: MeasurementStage;
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
  total_records: number | string;
};

type ProjectTimeline = {
  projectName: string;
  projectType: ProjectType;
  records: HistoryRecord[];
  first: HistoryRecord;
  latest: HistoryRecord;
  totalSprints: number;
  completedSprints: number;
  totalTasks: number;
  completedTasks: number;
  complexityChange: number;
  maintainabilityChange: number;
  smellsRemoved: number;
  responseChange: number;
};

const toNumber = (value: number | string | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatNumber = (
  value: number | string | null | undefined,
  suffix = "",
  digits = 2
) => {
  if (value == null) return "N/A";

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "N/A";

  return `${numericValue.toFixed(digits)}${suffix}`;
};

const formatInteger = (value: number | string | null | undefined, suffix = "") => {
  if (value == null) return "N/A";

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "N/A";

  return `${Math.round(numericValue)}${suffix}`;
};

const formatStage = (stage: MeasurementStage) => {
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

const compareHistoryRecords = (a: HistoryRecord, b: HistoryRecord) => {
  const sprintDiff = toNumber(a.completed_sprints) - toNumber(b.completed_sprints);
  if (sprintDiff !== 0) return sprintDiff;

  return new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime();
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

  const timelines = useMemo<ProjectTimeline[]>(() => {
    const grouped = records.reduce<Record<string, HistoryRecord[]>>(
      (groups, record) => {
        groups[record.project_name] = groups[record.project_name] ?? [];
        groups[record.project_name].push(record);
        return groups;
      },
      {}
    );

    return Object.values(grouped)
      .map((projectRecords) => {
        const sortedRecords = [...projectRecords].sort(compareHistoryRecords);
        const first = sortedRecords[0];
        const latest = sortedRecords[sortedRecords.length - 1];

        return {
          projectName: latest.project_name,
          projectType: latest.project_type,
          records: sortedRecords,
          first,
          latest,
          totalSprints: Math.max(
            ...sortedRecords.map((record) => toNumber(record.total_sprints))
          ),
          completedSprints: Math.max(
            ...sortedRecords.map((record) => toNumber(record.completed_sprints))
          ),
          totalTasks: Math.max(
            ...sortedRecords.map((record) => toNumber(record.total_tasks))
          ),
          completedTasks: Math.max(
            ...sortedRecords.map((record) => toNumber(record.completed_tasks))
          ),
          complexityChange:
            toNumber(first.cyclomatic_complexity) -
            toNumber(latest.cyclomatic_complexity),
          maintainabilityChange:
            toNumber(latest.maintainability_index) -
            toNumber(first.maintainability_index),
          smellsRemoved: toNumber(first.code_smells) - toNumber(latest.code_smells),
          responseChange:
            toNumber(first.response_time_ms) - toNumber(latest.response_time_ms)
        };
      })
      .sort((a, b) => a.projectName.localeCompare(b.projectName));
  }, [records]);

  const overall = useMemo(() => {
    const completedSprints = timelines.reduce(
      (total, project) => total + project.completedSprints,
      0
    );
    const totalSprints = timelines.reduce(
      (total, project) => total + project.totalSprints,
      0
    );
    const completedTasks = timelines.reduce(
      (total, project) => total + project.completedTasks,
      0
    );
    const totalTasks = timelines.reduce(
      (total, project) => total + project.totalTasks,
      0
    );
    const improvedProjects = timelines.filter(
      (project) =>
        project.complexityChange > 0 ||
        project.maintainabilityChange > 0 ||
        project.smellsRemoved > 0 ||
        project.responseChange > 0
    ).length;
    const average = (values: number[]) =>
      values.reduce((total, value) => total + value, 0) / (values.length || 1);

    return {
      completedSprints,
      totalSprints,
      completedTasks,
      totalTasks,
      improvedProjects,
      complexityChange: average(timelines.map((project) => project.complexityChange)),
      maintainabilityChange: average(
        timelines.map((project) => project.maintainabilityChange)
      ),
      responseChange: average(timelines.map((project) => project.responseChange))
    };
  }, [timelines]);

  const renderInsight = (
    icon: keyof typeof MaterialCommunityIcons.glyphMap,
    label: string,
    value: string | number,
    detail: string,
    color = "#36BBA7"
  ) => (
    <View style={styles.insightCard} key={label}>
      <MaterialCommunityIcons name={icon} size={28} color={color} />
      <View style={styles.insightText}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color }]}>{value}</Text>
        <Text style={styles.insightDetail}>{detail}</Text>
      </View>
    </View>
  );

  const renderChange = (label: string, value: number, suffix = "") => {
    const color = value > 0 ? "#126B5D" : value < 0 ? "#9B1C1C" : "#555";

    return (
      <View style={styles.changeItem} key={label}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={[styles.changeValue, { color }]}>
          {value >= 0 ? "+" : ""}
          {formatNumber(value, suffix)}
        </Text>
      </View>
    );
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
        <ThemedText type="title" style={{ fontSize: 25 }}>
          HISTORY
        </ThemedText>
      </ThemedView>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Overall Sprint Summary</Text>
        <View style={styles.progressRow}>
          <View>
            <Text style={styles.label}>Sprint Progress</Text>
            <Text style={styles.value}>
              {overall.completedSprints}/{overall.totalSprints || overall.completedSprints}
            </Text>
          </View>
          <View style={styles.progressPill}>
            <Text style={styles.progressText}>
              {formatNumber(
                overall.totalSprints
                  ? (overall.completedSprints / overall.totalSprints) * 100
                  : 0,
                "%",
                0
              )}
            </Text>
          </View>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailBlock}>
            <Text style={styles.metricLabel}>Records</Text>
            <Text style={styles.metricValue}>{summary.total_records}</Text>
          </View>
          <View style={styles.detailBlock}>
            <Text style={styles.metricLabel}>Projects</Text>
            <Text style={styles.metricValue}>{summary.total_projects}</Text>
          </View>
          <View style={styles.detailBlock}>
            <Text style={styles.metricLabel}>Tasks</Text>
            <Text style={styles.metricValue}>
              {overall.completedTasks}/{overall.totalTasks || overall.completedTasks}
            </Text>
          </View>
          <View style={styles.detailBlock}>
            <Text style={styles.metricLabel}>Improved</Text>
            <Text style={styles.metricValue}>
              {overall.improvedProjects}/{timelines.length}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {renderInsight(
          "source-branch",
          "Sprint 0 to Latest",
          `${overall.completedSprints} completed`,
          `${summary.total_records} historical records included`
        )}
        {renderInsight(
          "chart-line",
          "Avg Complexity Reduction",
          formatNumber(overall.complexityChange),
          `Current average complexity: ${formatNumber(summary.avg_complexity)}`
        )}
        {renderInsight(
          "shield-check",
          "Avg Maintainability Gain",
          formatNumber(overall.maintainabilityChange),
          `Current average maintainability: ${formatNumber(
            summary.avg_maintainability
          )}`
        )}
        {renderInsight(
          "speedometer",
          "Avg Response Time Saved",
          formatNumber(overall.responseChange, " ms"),
          `Current average response: ${formatNumber(summary.avg_response_time, " ms")}`,
          overall.responseChange >= 0 ? "#126B5D" : "#9B1C1C"
        )}
      </View>

      {stages.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Records by Stage</Text>
          {stages.map((stage) => (
            <View style={styles.stageRow} key={stage.measurement_stage}>
              <Text style={styles.stageName}>
                {formatStage(stage.measurement_stage)}
              </Text>
              <Text style={styles.stageCount}>
                {formatInteger(stage.total_records)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={{ fontSize: 25 }}>
          SPRINT TIMELINE
        </ThemedText>
      </ThemedView>

      {timelines.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.projectTitle}>No history records found</Text>
          <Text style={styles.detailText}>
            Add rows to project_metrics_history to see sprint 0 through latest
            history here.
          </Text>
        </View>
      ) : (
        timelines.map((project) => (
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

            <View style={styles.projectSummary}>
              <View>
                <Text style={styles.label}>Timeline Coverage</Text>
                <Text style={styles.projectDetails}>
                  Sprint 0 to {project.completedSprints}/
                  {project.totalSprints || project.completedSprints}
                </Text>
              </View>
              <Text style={styles.recordCount}>{project.records.length} records</Text>
            </View>

            <View style={styles.changeGrid}>
              {renderChange("Complexity", project.complexityChange)}
              {renderChange("Maintainability", project.maintainabilityChange)}
              {renderChange("Smells Removed", project.smellsRemoved)}
              {renderChange("Response Saved", project.responseChange, " ms")}
            </View>

            {project.records.map((record, index) => {
              const isFirst = index === 0;
              const isLatest = index === project.records.length - 1;
              const stageColor = isLatest ? "#126B5D" : isFirst ? "#555" : "#36BBA7";

              return (
                <View style={styles.timelineRow} key={record.id}>
                  <View style={styles.timelineRail}>
                    <View style={[styles.timelineDot, { backgroundColor: stageColor }]} />
                    {!isLatest ? <View style={styles.timelineLine} /> : null}
                  </View>

                  <View style={styles.timelineCard}>
                    <View style={styles.timelineHeader}>
                      <View>
                        <Text style={styles.sprintTitle}>
                          Sprint {toNumber(record.completed_sprints)}/
                          {toNumber(record.total_sprints) || project.totalSprints}
                        </Text>
                        <Text style={styles.measuredAt}>
                          {formatDate(record.measured_at)}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.stageBadge,
                          { color: stageColor, borderColor: stageColor }
                        ]}
                      >
                        {formatStage(record.measurement_stage)}
                      </Text>
                    </View>

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

                    <View style={styles.stageRow}>
                      <Text style={styles.detailText}>
                        Tasks: {formatInteger(record.completed_tasks)}/
                        {formatInteger(record.total_tasks)}
                      </Text>
                      <Text style={styles.detailText}>
                        Sprint progress: {formatNumber(
                          toNumber(record.total_sprints)
                            ? (toNumber(record.completed_sprints) /
                                toNumber(record.total_sprints)) *
                                100
                            : 0,
                          "%",
                          0
                        )}
                      </Text>
                    </View>

                    {record.notes ? (
                      <Text style={styles.notes}>Notes: {record.notes}</Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
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
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 20,
    borderColor: "black",
    borderWidth: 2,
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
    borderColor: "black",
    borderWidth: 2,
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
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10
  },
  progressRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
  },
  progressPill: {
    backgroundColor: "#D9F4EF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  progressText: {
    color: "#126B5D",
    fontWeight: "bold"
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  detailBlock: {
    backgroundColor: "#F4FBFA",
    borderRadius: 10,
    padding: 10,
    width: "48%"
  },
  label: { color: "#555", fontSize: 14 },
  value: { fontSize: 20, fontWeight: "bold", marginTop: 4 },
  stageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8
  },
  stageName: { fontSize: 15, color: "#333" },
  stageCount: { fontSize: 15, fontWeight: "bold" },
  projectCard: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 20,
    borderColor: "black",
    borderWidth: 2,
    borderStyle: "dashed",
    marginBottom: 10
  },
  projectTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 8 },
  projectSummary: {
    alignItems: "center",
    backgroundColor: "#F4FBFA",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    padding: 10
  },
  projectDetails: { fontSize: 16, fontWeight: "bold" },
  recordCount: {
    color: "#126B5D",
    fontSize: 13,
    fontWeight: "bold"
  },
  changeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12
  },
  changeItem: {
    backgroundColor: "#F7F7F7",
    borderRadius: 10,
    padding: 10,
    width: "48%"
  },
  changeValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 3
  },
  timelineRow: {
    flexDirection: "row"
  },
  timelineRail: {
    alignItems: "center",
    marginRight: 10,
    width: 18
  },
  timelineDot: {
    borderRadius: 6,
    height: 12,
    marginTop: 14,
    width: 12
  },
  timelineLine: {
    backgroundColor: "#D8D8D8",
    flex: 1,
    marginTop: 3,
    width: 2
  },
  timelineCard: {
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    flex: 1,
    marginBottom: 10,
    padding: 12
  },
  timelineHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10
  },
  sprintTitle: {
    fontSize: 17,
    fontWeight: "bold"
  },
  stageBadge: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 4,
    textAlign: "right"
  },
  measuredAt: {
    color: "#555",
    fontSize: 13,
    marginTop: 3
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10
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
    color: "#333",
    fontSize: 14,
    fontWeight: "600"
  },
  notes: {
    color: "#333",
    fontSize: 15,
    fontStyle: "italic",
    marginTop: 6
  }
});
