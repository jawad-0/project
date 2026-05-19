import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

const API_IP = "172.20.10.6"; // replace with your backend IP
const COMPARISON_API_URL = `http://${API_IP}:5000/api/comparison`;
const HISTORY_API_URL = `http://${API_IP}:5000/api/history`;

type ProjectType = "Django" | "Flask" | string;

type DashboardComparison = {
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

type ComparisonMetric = {
  label: string;
  previous: number;
  now: number;
  delta: number;
  improved: boolean;
  direction: "lower" | "higher";
  unit?: string;
};

type ProjectComparison = {
  projectName: string;
  projectType: ProjectType;
  previous: HistoryRecord;
  now: HistoryRecord;
  records: HistoryRecord[];
  metrics: ComparisonMetric[];
  completedSprints: number;
  totalSprints: number;
  improvementScore: number;
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

const buildMetric = (
  label: string,
  previous: number,
  now: number,
  direction: "lower" | "higher",
  unit?: string
): ComparisonMetric => {
  const delta = direction === "lower" ? previous - now : now - previous;

  return {
    label,
    previous,
    now,
    delta,
    improved: delta > 0,
    direction,
    unit
  };
};

const buildMetrics = (
  previous: HistoryRecord,
  now: HistoryRecord
): ComparisonMetric[] => [
  buildMetric(
    "Cyclomatic Complexity",
    toNumber(previous.cyclomatic_complexity),
    toNumber(now.cyclomatic_complexity),
    "lower"
  ),
  buildMetric(
    "Maintainability Index",
    toNumber(previous.maintainability_index),
    toNumber(now.maintainability_index),
    "higher"
  ),
  buildMetric(
    "Code Smells",
    toNumber(previous.code_smells),
    toNumber(now.code_smells),
    "lower"
  ),
  buildMetric(
    "Response Time",
    toNumber(previous.response_time_ms),
    toNumber(now.response_time_ms),
    "lower",
    " ms"
  )
];

const buildFallbackRecord = (
  project: DashboardComparison,
  stage: "baseline" | "after_refactoring"
): HistoryRecord => ({
  id: stage === "baseline" ? 0 : 1,
  project_name: project.project_name,
  project_type: project.project_type,
  cyclomatic_complexity:
    stage === "baseline"
      ? project.avg_complexity_before
      : project.avg_complexity_after,
  maintainability_index:
    stage === "baseline"
      ? project.avg_maintainability_before
      : project.avg_maintainability_after,
  code_smells:
    stage === "baseline" ? project.code_smells_before : project.code_smells_after,
  response_time_ms: null,
  total_sprints: 1,
  completed_sprints: stage === "baseline" ? 0 : 1,
  measurement_stage: stage,
  measured_at: ""
});

export default function Comparison() {
  const [dashboardProjects, setDashboardProjects] = useState<
    DashboardComparison[]
  >([]);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = fetch(`${COMPARISON_API_URL}/`)
      .then((res) => res.json())
      .then((data) => setDashboardProjects(Array.isArray(data) ? data : []))
      .catch((err) => console.log("Error fetching project comparison:", err));

    const fetchHistory = fetch(`${HISTORY_API_URL}/`)
      .then((res) => res.json())
      .then((data) => setHistoryRecords(Array.isArray(data) ? data : []))
      .catch((err) => console.log("Error fetching sprint comparison:", err));

    Promise.all([fetchProjects, fetchHistory]).finally(() => setLoading(false));
  }, []);

  const historyComparisons = useMemo<ProjectComparison[]>(() => {
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
        const previous = sortedRecords[0];
        const now = sortedRecords[sortedRecords.length - 1];
        const metrics = buildMetrics(previous, now);

        return {
          projectName: now.project_name,
          projectType: now.project_type,
          previous,
          now,
          records: sortedRecords,
          metrics,
          completedSprints: Math.max(
            ...sortedRecords.map((record) => toNumber(record.completed_sprints))
          ),
          totalSprints: Math.max(
            ...sortedRecords.map((record) => toNumber(record.total_sprints))
          ),
          improvementScore: metrics.filter((metric) => metric.improved).length
        };
      })
      .sort((a, b) => a.projectName.localeCompare(b.projectName));
  }, [historyRecords]);

  const fallbackComparisons = useMemo<ProjectComparison[]>(
    () =>
      dashboardProjects.map((project) => {
        const previous = buildFallbackRecord(project, "baseline");
        const now = buildFallbackRecord(project, "after_refactoring");
        const metrics = buildMetrics(previous, now).filter(
          (metric) => metric.label !== "Response Time"
        );

        return {
          projectName: project.project_name,
          projectType: project.project_type,
          previous,
          now,
          records: [previous, now],
          metrics,
          completedSprints: 1,
          totalSprints: 1,
          improvementScore: metrics.filter((metric) => metric.improved).length
        };
      }),
    [dashboardProjects]
  );

  const comparisons =
    historyComparisons.length > 0 ? historyComparisons : fallbackComparisons;

  const summary = useMemo(() => {
    const allMetrics = comparisons.flatMap((project) => project.metrics);
    const improvedProjects = comparisons.filter(
      (project) => project.improvementScore > 0
    ).length;
    const averageDelta = (label: string) => {
      const values = allMetrics.filter((metric) => metric.label === label);
      if (values.length === 0) return 0;

      return (
        values.reduce((total, metric) => total + metric.delta, 0) /
        values.length
      );
    };

    return {
      totalProjects: comparisons.length,
      sprintRecords: historyRecords.length,
      improvedProjects,
      completedSprints: comparisons.reduce(
        (total, project) => total + project.completedSprints,
        0
      ),
      complexityReduction: averageDelta("Cyclomatic Complexity"),
      maintainabilityGain: averageDelta("Maintainability Index"),
      smellReduction: averageDelta("Code Smells")
    };
  }, [comparisons, historyRecords.length]);

  const typeStats = useMemo(() => {
    const grouped = comparisons.reduce<
      Record<
        string,
        {
          type: string;
          count: number;
          complexityReduction: number;
          maintainabilityGain: number;
          smellReduction: number;
        }
      >
    >((groups, project) => {
      const type = project.projectType || "Unknown";
      groups[type] = groups[type] ?? {
        type,
        count: 0,
        complexityReduction: 0,
        maintainabilityGain: 0,
        smellReduction: 0
      };
      groups[type].count += 1;
      groups[type].complexityReduction +=
        project.metrics.find((metric) => metric.label === "Cyclomatic Complexity")
          ?.delta ?? 0;
      groups[type].maintainabilityGain +=
        project.metrics.find((metric) => metric.label === "Maintainability Index")
          ?.delta ?? 0;
      groups[type].smellReduction +=
        project.metrics.find((metric) => metric.label === "Code Smells")
          ?.delta ?? 0;
      return groups;
    }, {});

    return Object.values(grouped);
  }, [comparisons]);

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

  const renderMetricComparison = (metric: ComparisonMetric) => {
    const status = metric.delta > 0 ? "Improved" : metric.delta < 0 ? "Worse" : "No Change";
    const color =
      metric.delta > 0 ? "#126B5D" : metric.delta < 0 ? "#9B1C1C" : "#555";
    const backgroundColor =
      metric.delta > 0 ? "#E4F7EF" : metric.delta < 0 ? "#FDE8E8" : "#F4F4F4";

    return (
      <View
        style={[
          styles.metricRow,
          {
            backgroundColor,
            borderBottomWidth: 0,
            borderRadius: 10,
            marginBottom: 8,
            paddingHorizontal: 10
          }
        ]}
        key={metric.label}
      >
        <View style={styles.metricText}>
          <Text style={styles.label}>{metric.label}</Text>
          <Text style={styles.insightDetail}>
            Previous {formatNumber(metric.previous)}
            {metric.unit ?? ""} to now {formatNumber(metric.now)}
            {metric.unit ?? ""}
          </Text>
        </View>
        <View style={styles.metricResult}>
          <Text style={[styles.metricValue, { color }]}>
            {metric.delta >= 0 ? "+" : ""}
            {formatNumber(metric.delta)}
            {metric.unit ?? ""}
          </Text>
          <Text style={[styles.statusText, { color }]}>{status}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Previous Sprint vs Now</Text>
        <Text>Loading data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Previous Sprint vs Now</Text>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={{ fontSize: 25 }}>
          SPRINT DELTA SUMMARY
        </ThemedText>
      </ThemedView>

      <View style={styles.card}>
        <Text style={styles.label}>Projects Compared</Text>
        <Text style={styles.value}>{summary.totalProjects}</Text>
      </View>

      <View style={styles.statsGrid}>
        {renderInsight(
          "source-branch",
          "Sprint Records Used",
          summary.sprintRecords || summary.totalProjects * 2,
          "Each project compares earliest available sprint against latest"
        )}
        {renderInsight(
          "check-decagram",
          "Projects Improved",
          `${summary.improvedProjects}/${summary.totalProjects}`,
          "A project counts as improved when at least one metric moved positively"
        )}
        {renderInsight(
          "chart-line",
          "Avg Complexity Reduction",
          formatNumber(summary.complexityReduction),
          "Lower complexity is better"
        )}
        {renderInsight(
          "shield-check",
          "Avg Maintainability Gain",
          formatNumber(summary.maintainabilityGain),
          "Higher maintainability is better"
        )}
      </View>

      {comparisons.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.projectTitle}>No comparison records found</Text>
          <Text style={styles.projectDetails}>
            Add sprint history records to compare previous sprint metrics with now.
          </Text>
        </View>
      ) : (
        comparisons.map((project) => (
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

            <View style={styles.stageBox}>
              <View style={styles.stageColumn}>
                <Text style={styles.stageLabel}>Previous Sprint</Text>
                <Text style={styles.projectDetails}>
                  Sprint {toNumber(project.previous.completed_sprints)}/
                  {toNumber(project.previous.total_sprints) || project.totalSprints}
                </Text>
                <Text style={styles.insightDetail}>
                  {formatStage(project.previous.measurement_stage)}
                </Text>
              </View>

              <MaterialCommunityIcons name="arrow-right" size={22} color="#36BBA7" />

              <View style={styles.stageColumn}>
                <Text style={styles.stageLabel}>Now</Text>
                <Text style={styles.projectDetails}>
                  Sprint {toNumber(project.now.completed_sprints)}/
                  {toNumber(project.now.total_sprints) || project.totalSprints}
                </Text>
                <Text style={styles.insightDetail}>
                  {formatStage(project.now.measurement_stage)}
                </Text>
              </View>
            </View>

            {project.metrics.map(renderMetricComparison)}

            <Text style={styles.projectDetails}>
              Sprint history included: {project.records.length} records
            </Text>
          </View>
        ))
      )}

      {typeStats.length > 0 && (
        <>
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="title" style={{ fontSize: 25 }}>
              TYPE COMPARISON
            </ThemedText>
          </ThemedView>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Comparison by Project Type</Text>
            {typeStats.map((type) => (
              <View style={styles.typeBlock} key={type.type}>
                <Text style={styles.projectTitle}>{type.type}</Text>
                <Text style={styles.projectDetails}>
                  Projects compared: {type.count}
                </Text>
                <Text style={styles.projectDetails}>
                  Avg complexity reduction:{" "}
                  {formatNumber(type.complexityReduction / type.count)}
                </Text>
                <Text style={styles.projectDetails}>
                  Avg maintainability gain:{" "}
                  {formatNumber(type.maintainabilityGain / type.count)}
                </Text>
                <Text style={styles.projectDetails}>
                  Avg code smells removed:{" "}
                  {formatNumber(type.smellReduction / type.count)}
                </Text>
              </View>
            ))}
          </View>
        </>
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
    backgroundColor: "#7C3AED",
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
  metricResult: {
    alignItems: "flex-end"
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 12,
    textAlign: "right"
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 2
  },
  label: { fontSize: 16, color: "#555" },
  value: { fontSize: 20, fontWeight: "bold", marginTop: 5 },
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
  sectionTitle: {
    color: "#123B36",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10
  },
  stageBox: {
    alignItems: "center",
    backgroundColor: "#F4FBFA",
    borderRadius: 10,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    marginBottom: 10,
    padding: 10
  },
  stageColumn: {
    flex: 1
  },
  stageLabel: {
    color: "#126B5D",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 4
  },
  typeBlock: {
    borderBottomColor: "#e0e0e0",
    borderBottomWidth: 1,
    marginBottom: 10,
    paddingBottom: 10
  }
});
