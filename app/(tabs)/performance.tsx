import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  type DimensionValue,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

const API_IP = "172.20.10.6"; // replace with your backend IP
const PERFORMANCE_API_URL = `http://${API_IP}:5000/api/performance`;
const HISTORY_API_URL = `http://${API_IP}:5000/api/history`;

type ProjectType = "Django" | "Flask" | string;

type PerformanceProject = {
  project_name: string;
  project_type: ProjectType;
  performance_before: number | string | null;
  performance_after: number | string | null;
  improvement_ms: number | string | null;
};

type HistoryRecord = {
  id: number;
  project_name: string;
  project_type: ProjectType;
  response_time_ms: number | string | null;
  total_sprints: number | string | null;
  completed_sprints: number | string | null;
  measurement_stage: string | null;
  measured_at: string;
};

type ProjectPerformance = {
  projectName: string;
  projectType: ProjectType;
  previous: HistoryRecord;
  now: HistoryRecord;
  records: HistoryRecord[];
  previousTime: number;
  nowTime: number;
  improvementMs: number;
  improvementPercent: number;
  completedSprints: number;
  totalSprints: number;
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

const getImprovementPercent = (previousTime: number, nowTime: number) => {
  if (previousTime <= 0) return 0;

  return ((previousTime - nowTime) / previousTime) * 100;
};

const buildFallbackRecord = (
  project: PerformanceProject,
  stage: "baseline" | "after_refactoring"
): HistoryRecord => ({
  id: stage === "baseline" ? 0 : 1,
  project_name: project.project_name,
  project_type: project.project_type,
  response_time_ms:
    stage === "baseline" ? project.performance_before : project.performance_after,
  total_sprints: 1,
  completed_sprints: stage === "baseline" ? 0 : 1,
  measurement_stage: stage,
  measured_at: ""
});

export default function Performance() {
  const [snapshotProjects, setSnapshotProjects] = useState<PerformanceProject[]>(
    []
  );
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = fetch(`${PERFORMANCE_API_URL}/`)
      .then((res) => res.json())
      .then((data) => setSnapshotProjects(Array.isArray(data) ? data : []))
      .catch((err) => console.log("Error fetching projects:", err));

    const fetchHistory = fetch(`${HISTORY_API_URL}/`)
      .then((res) => res.json())
      .then((data) => setHistoryRecords(Array.isArray(data) ? data : []))
      .catch((err) => console.log("Error fetching performance history:", err));

    Promise.all([fetchProjects, fetchHistory]).finally(() => setLoading(false));
  }, []);

  const historyPerformance = useMemo<ProjectPerformance[]>(() => {
    const grouped = historyRecords
      .filter((record) => record.response_time_ms != null)
      .reduce<Record<string, HistoryRecord[]>>((groups, record) => {
        groups[record.project_name] = groups[record.project_name] ?? [];
        groups[record.project_name].push(record);
        return groups;
      }, {});

    return Object.values(grouped)
      .map((records) => {
        const sortedRecords = [...records].sort(compareHistoryRecords);
        const previous = sortedRecords[0];
        const now = sortedRecords[sortedRecords.length - 1];
        const previousTime = toNumber(previous.response_time_ms);
        const nowTime = toNumber(now.response_time_ms);
        const improvementMs = previousTime - nowTime;

        return {
          projectName: now.project_name,
          projectType: now.project_type,
          previous,
          now,
          records: sortedRecords,
          previousTime,
          nowTime,
          improvementMs,
          improvementPercent: getImprovementPercent(previousTime, nowTime),
          completedSprints: Math.max(
            ...sortedRecords.map((record) => toNumber(record.completed_sprints))
          ),
          totalSprints: Math.max(
            ...sortedRecords.map((record) => toNumber(record.total_sprints))
          )
        };
      })
      .sort((a, b) => a.projectName.localeCompare(b.projectName));
  }, [historyRecords]);

  const fallbackPerformance = useMemo<ProjectPerformance[]>(
    () =>
      snapshotProjects.map((project) => {
        const previous = buildFallbackRecord(project, "baseline");
        const now = buildFallbackRecord(project, "after_refactoring");
        const previousTime = toNumber(project.performance_before);
        const nowTime = toNumber(project.performance_after);
        const improvementMs = previousTime - nowTime;

        return {
          projectName: project.project_name,
          projectType: project.project_type,
          previous,
          now,
          records: [previous, now],
          previousTime,
          nowTime,
          improvementMs,
          improvementPercent: getImprovementPercent(previousTime, nowTime),
          completedSprints: 1,
          totalSprints: 1
        };
      }),
    [snapshotProjects]
  );

  const projects =
    historyPerformance.length > 0 ? historyPerformance : fallbackPerformance;

  const summary = useMemo(() => {
    const improvedProjects = projects.filter(
      (project) => project.improvementMs > 0
    ).length;
    const regressedProjects = projects.filter(
      (project) => project.improvementMs < 0
    ).length;
    const averageImprovement =
      projects.reduce((total, project) => total + project.improvementMs, 0) /
      (projects.length || 1);
    const fastestProject = projects.reduce(
      (fastest, project) =>
        !fastest || project.nowTime < fastest.nowTime ? project : fastest,
      null as ProjectPerformance | null
    );

    return {
      totalProjects: projects.length,
      sprintRecords: historyRecords.filter((record) => record.response_time_ms != null)
        .length,
      improvedProjects,
      regressedProjects,
      averageImprovement,
      fastestProject
    };
  }, [historyRecords, projects]);

  const typeStats = useMemo(() => {
    const grouped = projects.reduce<
      Record<
        string,
        {
          type: string;
          count: number;
          improvementMs: number;
          currentTime: number;
        }
      >
    >((groups, project) => {
      const type = project.projectType || "Unknown";
      groups[type] = groups[type] ?? {
        type,
        count: 0,
        improvementMs: 0,
        currentTime: 0
      };
      groups[type].count += 1;
      groups[type].improvementMs += project.improvementMs;
      groups[type].currentTime += project.nowTime;
      return groups;
    }, {});

    return Object.values(grouped);
  }, [projects]);

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

  const renderPerformanceBar = (project: ProjectPerformance) => {
    const maxTime = Math.max(project.previousTime, project.nowTime, 1);
    const previousWidth: DimensionValue = `${Math.max(
      (project.previousTime / maxTime) * 100,
      4
    )}%`;
    const nowWidth: DimensionValue = `${Math.max(
      (project.nowTime / maxTime) * 100,
      4
    )}%`;
    const improved = project.improvementMs > 0;
    const regressed = project.improvementMs < 0;
    const color = improved ? "#126B5D" : regressed ? "#9B1C1C" : "#555";

    return (
      <View style={styles.barSection}>
        <View style={styles.barRow}>
          <Text style={styles.barLabel}>Previous</Text>
          <View style={styles.barTrack}>
            <View style={[styles.previousBar, { width: previousWidth }]} />
          </View>
          <Text style={styles.barValue}>{formatNumber(project.previousTime)} ms</Text>
        </View>

        <View style={styles.barRow}>
          <Text style={styles.barLabel}>Now</Text>
          <View style={styles.barTrack}>
            <View style={[styles.nowBar, { width: nowWidth, backgroundColor: color }]} />
          </View>
          <Text style={[styles.barValue, { color }]}>
            {formatNumber(project.nowTime)} ms
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>API Performance</Text>
        <Text>Loading data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>API Performance</Text>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={{ fontSize: 25 }}>
          PERFORMANCE
        </ThemedText>
      </ThemedView>

      <View style={styles.card}>
        <Text style={styles.label}>Projects Analysed</Text>
        <Text style={styles.value}>{summary.totalProjects}</Text>
      </View>

      <View style={styles.statsGrid}>
        {renderInsight(
          "trending-up",
          "Improved Projects",
          summary.improvedProjects,
          "Lower response time than the previous sprint",
          "#126B5D"
        )}
        {renderInsight(
          "trending-down",
          "Regressed Projects",
          summary.regressedProjects,
          "Higher response time than the previous sprint",
          "#9B1C1C"
        )}
        {renderInsight(
          "speedometer",
          "Avg Time Saved",
          `${formatNumber(summary.averageImprovement)} ms`,
          `${summary.sprintRecords || summary.totalProjects * 2} performance records used`,
          summary.averageImprovement >= 0 ? "#126B5D" : "#9B1C1C"
        )}
        {renderInsight(
          "timer-check",
          "Fastest Current Project",
          summary.fastestProject?.projectName ?? "No data",
          summary.fastestProject
            ? `${formatNumber(summary.fastestProject.nowTime)} ms currently`
            : "Add response time records to see this insight"
        )}
      </View>

      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={{ fontSize: 25 }}>
          PREVIOUS VS NOW
        </ThemedText>
      </ThemedView>

      {projects.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.projectTitle}>No performance records found</Text>
          <Text style={styles.projectDetails}>
            Add response time records to compare previous sprint performance with now.
          </Text>
        </View>
      ) : (
        projects.map((project) => {
          const improved = project.improvementMs > 0;
          const regressed = project.improvementMs < 0;
          const color = improved ? "#126B5D" : regressed ? "#9B1C1C" : "#555";
          const backgroundColor = improved
            ? "#E4F7EF"
            : regressed
              ? "#FDE8E8"
              : "#F4F4F4";
          const status = improved
            ? "Improved"
            : regressed
              ? "Decreased Performance"
              : "No Change";

          return (
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

              <View style={[styles.statusRow, { backgroundColor }]}>
                <View>
                  <Text style={styles.label}>Performance Status</Text>
                  <Text style={[styles.statusText, { color }]}>{status}</Text>
                </View>
                <View style={styles.deltaBox}>
                  <Text style={[styles.deltaValue, { color }]}>
                    {project.improvementMs >= 0 ? "+" : ""}
                    {formatNumber(project.improvementMs)} ms
                  </Text>
                  <Text style={[styles.deltaPercent, { color }]}>
                    {project.improvementPercent >= 0 ? "+" : ""}
                    {formatNumber(project.improvementPercent)}%
                  </Text>
                </View>
              </View>

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

              {renderPerformanceBar(project)}

              <Text style={styles.projectDetails}>
                History included: {project.records.length} performance records
              </Text>
            </View>
          );
        })
      )}

      {typeStats.length > 0 && (
        <>
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="title" style={{ fontSize: 25 }}>
              BY TYPE
            </ThemedText>
          </ThemedView>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Performance by Project Type</Text>
            {typeStats.map((type) => {
              const avgImprovement = type.improvementMs / type.count;
              const avgCurrentTime = type.currentTime / type.count;
              const color = avgImprovement >= 0 ? "#126B5D" : "#9B1C1C";

              return (
                <View style={styles.typeBlock} key={type.type}>
                  <Text style={styles.projectTitle}>{type.type}</Text>
                  <Text style={styles.projectDetails}>
                    Projects analysed: {type.count}
                  </Text>
                  <Text style={[styles.projectDetails, { color }]}>
                    Avg time saved: {formatNumber(avgImprovement)} ms
                  </Text>
                  <Text style={styles.projectDetails}>
                    Avg current response: {formatNumber(avgCurrentTime)} ms
                  </Text>
                </View>
              );
            })}
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
    backgroundColor: "#126B5D",
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
  statusRow: {
    alignItems: "center",
    borderBottomColor: "#e0e0e0",
    borderBottomWidth: 0,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    padding: 10
  },
  statusText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 3
  },
  deltaBox: {
    alignItems: "flex-end",
    marginLeft: 12
  },
  deltaValue: {
    fontSize: 18,
    fontWeight: "bold"
  },
  deltaPercent: {
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 2
  },
  stageBox: {
    alignItems: "center",
    backgroundColor: "#F4FBFA",
    borderRadius: 10,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    marginBottom: 12,
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
  barSection: {
    gap: 8,
    marginBottom: 12
  },
  barRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  barLabel: {
    color: "#555",
    fontSize: 13,
    width: 62
  },
  barTrack: {
    backgroundColor: "#E8E8E8",
    borderRadius: 8,
    flex: 1,
    height: 10,
    overflow: "hidden"
  },
  previousBar: {
    backgroundColor: "#777",
    height: "100%"
  },
  nowBar: {
    height: "100%"
  },
  barValue: {
    color: "#555",
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "right",
    width: 76
  },
  typeBlock: {
    borderBottomColor: "#e0e0e0",
    borderBottomWidth: 1,
    marginBottom: 10,
    paddingBottom: 10
  }
});
