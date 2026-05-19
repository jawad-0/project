import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  type DimensionValue,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import Svg, { Circle } from "react-native-svg";

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

type ProjectAnalysis = ProjectComparison & {
  analysisScore: number;
  positiveChanges: number;
  negativeChanges: number;
  stableChanges: number;
  strongestMetric: ComparisonMetric | null;
  weakestMetric: ComparisonMetric | null;
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

const getMetricWeight = (metric: ComparisonMetric) => {
  const baseline = Math.max(Math.abs(metric.previous), 1);
  return (metric.delta / baseline) * 100;
};

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
  const [openProjects, setOpenProjects] = useState<string[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const projectPositions = useRef<Record<string, number>>({});

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

  const analysedComparisons = useMemo<ProjectAnalysis[]>(
    () =>
      comparisons
        .map((project) => {
          const sortedMetrics = [...project.metrics].sort(
            (a, b) => getMetricWeight(b) - getMetricWeight(a)
          );
          const positiveChanges = project.metrics.filter(
            (metric) => metric.delta > 0
          ).length;
          const negativeChanges = project.metrics.filter(
            (metric) => metric.delta < 0
          ).length;
          const stableChanges = project.metrics.length - positiveChanges - negativeChanges;

          return {
            ...project,
            analysisScore: project.metrics.reduce(
              (total, metric) => total + getMetricWeight(metric),
              0
            ),
            positiveChanges,
            negativeChanges,
            stableChanges,
            strongestMetric: sortedMetrics[0] ?? null,
            weakestMetric: sortedMetrics[sortedMetrics.length - 1] ?? null
          };
        })
        .sort((a, b) => b.analysisScore - a.analysisScore),
    [comparisons]
  );

  const summary = useMemo(() => {
    const allMetrics = analysedComparisons.flatMap((project) => project.metrics);
    const improvedProjects = analysedComparisons.filter(
      (project) => project.negativeChanges === 0 && project.positiveChanges > 0
    ).length;
    const mixedProjects = analysedComparisons.filter(
      (project) => project.positiveChanges > 0 && project.negativeChanges > 0
    ).length;
    const regressedProjects = analysedComparisons.filter(
      (project) => project.positiveChanges === 0 && project.negativeChanges > 0
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
      totalProjects: analysedComparisons.length,
      sprintRecords: historyRecords.length,
      improvedProjects,
      mixedProjects,
      regressedProjects,
      completedSprints: analysedComparisons.reduce(
        (total, project) => total + project.completedSprints,
        0
      ),
      complexityReduction: averageDelta("Cyclomatic Complexity"),
      maintainabilityGain: averageDelta("Maintainability Index"),
      smellReduction: averageDelta("Code Smells"),
      topProject: analysedComparisons[0] ?? null,
      watchProject: [...analysedComparisons].sort(
        (a, b) => a.analysisScore - b.analysisScore
      )[0] ?? null
    };
  }, [analysedComparisons, historyRecords.length]);

  const typeStats = useMemo(() => {
    const grouped = analysedComparisons.reduce<
      Record<
        string,
        {
          type: string;
          count: number;
          complexityReduction: number;
          maintainabilityGain: number;
          smellReduction: number;
          analysisScore: number;
          mixedProjects: number;
        }
      >
    >((groups, project) => {
      const type = project.projectType || "Unknown";
      groups[type] = groups[type] ?? {
        type,
        count: 0,
        complexityReduction: 0,
        maintainabilityGain: 0,
        smellReduction: 0,
        analysisScore: 0,
        mixedProjects: 0
      };
      groups[type].count += 1;
      groups[type].analysisScore += project.analysisScore;
      groups[type].mixedProjects += project.negativeChanges > 0 ? 1 : 0;
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
  }, [analysedComparisons]);

  const frameworkDistribution = useMemo(() => {
    const getStats = (typeName: string) => {
      const projects = analysedComparisons.filter(
        (project) => project.projectType === typeName
      );
      const averageScore =
        projects.reduce((total, project) => total + project.analysisScore, 0) /
        (projects.length || 1);

      return {
        count: projects.length,
        averageScore
      };
    };
    const django = getStats("Django");
    const flask = getStats("Flask");
    const total = django.count + flask.count;

    return {
      django,
      flask,
      total,
      djangoPercent: total ? (django.count / total) * 100 : 0,
      flaskPercent: total ? (flask.count / total) * 100 : 0
    };
  }, [analysedComparisons]);

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

  const renderMetricPill = (metric: ComparisonMetric | null, label: string) => {
    if (!metric) {
      return (
        <View style={styles.metricPill}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.insightDetail}>No metric data</Text>
        </View>
      );
    }

    const color =
      metric.delta > 0 ? "#126B5D" : metric.delta < 0 ? "#9B1C1C" : "#555";

    return (
      <View style={styles.metricPill}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.metricValue, { color }]}>
          {metric.label}: {metric.delta >= 0 ? "+" : ""}
          {formatNumber(metric.delta)}
          {metric.unit ?? ""}
        </Text>
      </View>
    );
  };

  const toggleProject = (projectName: string) => {
    const isOpen = openProjects.includes(projectName);

    setOpenProjects((currentProjects) =>
      isOpen
        ? currentProjects.filter((name) => name !== projectName)
        : [...currentProjects, projectName]
    );

    if (!isOpen) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          y: Math.max((projectPositions.current[projectName] ?? 0) - 12, 0),
          animated: true
        });
      }, 100);
    }
  };

  const renderAnalysisCard = (project: ProjectAnalysis, index: number) => {
    const isOpen = openProjects.includes(project.projectName);
    const status =
      project.negativeChanges > 0
        ? project.positiveChanges > 0
          ? "Mixed Result"
          : "Needs Attention"
        : project.positiveChanges > 0
          ? "Consistent Improvement"
          : "Stable";
    const color =
      project.negativeChanges > 0
        ? project.positiveChanges > 0
          ? "#B45309"
          : "#9B1C1C"
        : project.positiveChanges > 0
          ? "#126B5D"
          : "#555";
    const backgroundColor =
      project.negativeChanges > 0
        ? project.positiveChanges > 0
          ? "#FEF3C7"
          : "#FDE8E8"
        : project.positiveChanges > 0
          ? "#E4F7EF"
          : "#F4F4F4";

    return (
      <View
        style={styles.projectCard}
        key={project.projectName}
        onLayout={(event) => {
          projectPositions.current[project.projectName] = event.nativeEvent.layout.y;
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: isOpen }}
          onPress={() => toggleProject(project.projectName)}
          style={styles.rankHeader}
        >
          <Text style={styles.rankBadge}>#{index + 1}</Text>
          <View style={styles.metricText}>
            <Text style={styles.projectTitle}>
              <MaterialCommunityIcons
                name={project.projectType === "Django" ? "language-python" : "flask"}
                size={24}
                color={project.projectType === "Django" ? "#000000" : "#F05A28"}
                style={{ marginRight: 8 }}
              />{" "}
              {project.projectName}
            </Text>
            <Text style={styles.insightDetail}>
              {project.records.length} records, sprint {project.completedSprints}/
              {project.totalSprints || project.completedSprints}
            </Text>
          </View>
          <View style={styles.projectListMeta}>
            <View style={[styles.statusBadge, { backgroundColor }]}>
              <Text style={[styles.statusBadgeText, { color }]}>{status}</Text>
            </View>
            <MaterialCommunityIcons
              name={isOpen ? "chevron-up" : "chevron-down"}
              size={24}
              color="#123B36"
            />
          </View>
        </Pressable>

        {isOpen && (
          <View style={styles.projectDetailPanel}>
            <View style={styles.scoreRow}>
              <View>
                <Text style={styles.label}>Analytical Score</Text>
                <Text style={[styles.value, { color }]}>
                  {project.analysisScore >= 0 ? "+" : ""}
                  {formatNumber(project.analysisScore)}%
                </Text>
              </View>
              <View style={styles.metricResult}>
                <Text style={styles.label}>Metric Movement</Text>
                <Text style={styles.projectDetails}>
                  {project.positiveChanges} up, {project.negativeChanges} down,{" "}
                  {project.stableChanges} flat
                </Text>
              </View>
            </View>

            {renderMetricPill(project.strongestMetric, "Strongest Movement")}
            {renderMetricPill(project.weakestMetric, "Weakest Movement")}
          </View>
        )}
      </View>
    );
  };

  const renderFrameworkPie = () => {
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const djangoDash = (frameworkDistribution.djangoPercent / 100) * circumference;

    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Django vs Flask Projects</Text>
        <View style={styles.pieWidget}>
          <View style={styles.pieChartWrap}>
            <Svg width={112} height={112} viewBox="0 0 112 112">
              <Circle
                cx="56"
                cy="56"
                r={radius}
                stroke={frameworkDistribution.total ? "#F05A28" : "#E5E7EB"}
                strokeWidth="20"
                fill="none"
              />
              <Circle
                cx="56"
                cy="56"
                r={radius}
                stroke="#126B5D"
                strokeWidth="20"
                fill="none"
                strokeDasharray={`${djangoDash} ${circumference}`}
                strokeLinecap="butt"
                transform="rotate(-90 56 56)"
              />
            </Svg>
            <View style={styles.pieCenter}>
              <Text style={styles.pieTotal}>{frameworkDistribution.total}</Text>
              <Text style={styles.pieCaption}>projects</Text>
            </View>
          </View>

          <View style={styles.pieLegend}>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: "#126B5D" }]} />
              <View style={styles.metricText}>
                <Text style={styles.projectDetails}>
                  Django {frameworkDistribution.django.count}
                </Text>
                <Text style={styles.insightDetail}>
                  {formatNumber(frameworkDistribution.djangoPercent, 1)}% share,{" "}
                  {formatNumber(frameworkDistribution.django.averageScore)}% avg score
                </Text>
              </View>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: "#F05A28" }]} />
              <View style={styles.metricText}>
                <Text style={styles.projectDetails}>
                  Flask {frameworkDistribution.flask.count}
                </Text>
                <Text style={styles.insightDetail}>
                  {formatNumber(frameworkDistribution.flaskPercent, 1)}% share,{" "}
                  {formatNumber(frameworkDistribution.flask.averageScore)}% avg score
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderTypeBar = (
    label: string,
    value: number,
    maxValue: number,
    unit = "",
    preferPositive = true
  ) => {
    const width: DimensionValue = `${Math.max(
      (Math.abs(value) / Math.max(Math.abs(maxValue), 1)) * 100,
      5
    )}%`;
    const improved = preferPositive ? value >= 0 : value <= 0;
    const color = improved ? "#126B5D" : "#9B1C1C";

    return (
      <View style={styles.typeBarRow} key={label}>
        <View style={styles.typeBarHeader}>
          <Text style={styles.typeBarLabel}>{label}</Text>
          <Text style={[styles.typeBarValue, { color }]}>
            {value >= 0 ? "+" : ""}
            {formatNumber(value)}
            {unit}
          </Text>
        </View>
        <View style={styles.typeBarTrack}>
          <View style={[styles.typeBarFill, { backgroundColor: color, width }]} />
        </View>
      </View>
    );
  };

  const renderTypeComparison = () => {
    if (typeStats.length === 0) return null;

    const averages = typeStats.map((type) => ({
      ...type,
      avgScore: type.analysisScore / type.count,
      avgComplexity: type.complexityReduction / type.count,
      avgMaintainability: type.maintainabilityGain / type.count,
      avgSmells: type.smellReduction / type.count
    }));
    const maxScore = Math.max(...averages.map((type) => Math.abs(type.avgScore)), 1);
    const maxComplexity = Math.max(
      ...averages.map((type) => Math.abs(type.avgComplexity)),
      1
    );
    const maxMaintainability = Math.max(
      ...averages.map((type) => Math.abs(type.avgMaintainability)),
      1
    );
    const maxSmells = Math.max(...averages.map((type) => Math.abs(type.avgSmells)), 1);

    return (
      <>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title" style={{ fontSize: 25 }}>
            TYPE COMPARISON
          </ThemedText>
        </ThemedView>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Framework Comparison Bars</Text>
          {averages.map((type) => (
            <View style={styles.typeBlock} key={type.type}>
              <View style={styles.typeHeaderRow}>
                <Text style={styles.projectTitle}>{type.type}</Text>
                <Text style={styles.insightDetail}>
                  {type.count} projects, {type.mixedProjects} needing review
                </Text>
              </View>
              {renderTypeBar("Analytical score", type.avgScore, maxScore, "%")}
              {renderTypeBar(
                "Complexity reduction",
                type.avgComplexity,
                maxComplexity
              )}
              {renderTypeBar(
                "Maintainability gain",
                type.avgMaintainability,
                maxMaintainability
              )}
              {renderTypeBar("Smells removed", type.avgSmells, maxSmells)}
            </View>
          ))}
        </View>
      </>
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
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
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
          "check-decagram",
          "Clean Improvements",
          `${summary.improvedProjects}/${summary.totalProjects}`,
          "Projects with positive movement and no metric regression"
        )}
        {renderInsight(
          "alert-circle",
          "Mixed or Regressed",
          summary.mixedProjects + summary.regressedProjects,
          "Projects with at least one metric moving the wrong way"
        )}
        {renderInsight(
          "trophy",
          "Best Overall",
          summary.topProject?.projectName ?? "No data",
          summary.topProject
            ? `${formatNumber(summary.topProject.analysisScore)}% combined movement`
            : "Add sprint records to rank projects"
        )}
        {renderInsight(
          "magnify",
          "Needs Review",
          summary.watchProject?.projectName ?? "No data",
          summary.watchProject
            ? `${formatNumber(summary.watchProject.analysisScore)}% combined movement`
            : "Add sprint records to reveal risk"
        )}
      </View>

      {renderFrameworkPie()}

      {renderTypeComparison()}

      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={{ fontSize: 25 }}>
          PROJECT RANKING
        </ThemedText>
      </ThemedView>

      {analysedComparisons.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.projectTitle}>No comparison records found</Text>
          <Text style={styles.projectDetails}>
            Add sprint history records to compare previous sprint metrics with now.
          </Text>
        </View>
      ) : (
        analysedComparisons.map(renderAnalysisCard)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#0E2A25", flex: 1, padding: 16, paddingTop: 28 },
  scrollContent: {
    paddingBottom: 96
  },
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
  metricPill: {
    backgroundColor: "#F4FBFA",
    borderRadius: 10,
    marginTop: 8,
    padding: 10
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
  rankHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    padding: 12
  },
  rankBadge: {
    backgroundColor: "#123B36",
    borderRadius: 8,
    color: "#F4FBFA",
    fontSize: 16,
    fontWeight: "bold",
    minWidth: 38,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 6,
    textAlign: "center"
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center"
  },
  projectListMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  projectDetailPanel: {
    borderTopColor: "#e0e0e0",
    borderTopWidth: 1,
    padding: 12,
    paddingTop: 8
  },
  scoreRow: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    padding: 10
  },
  label: { fontSize: 16, color: "#555" },
  value: { fontSize: 20, fontWeight: "bold", marginTop: 5 },
  projectCard: {
    backgroundColor: "white",
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
  pieWidget: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14
  },
  pieChartWrap: {
    height: 112,
    justifyContent: "center",
    position: "relative",
    width: 112
  },
  pieCenter: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  pieTotal: {
    color: "#123B36",
    fontSize: 22,
    fontWeight: "bold"
  },
  pieCaption: {
    color: "#555",
    fontSize: 12,
    fontWeight: "bold"
  },
  pieLegend: {
    flex: 1,
    gap: 10
  },
  legendRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  legendDot: {
    borderRadius: 6,
    height: 12,
    width: 12
  },
  typeHeaderRow: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    marginBottom: 6
  },
  typeBarRow: {
    marginBottom: 9
  },
  typeBarHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4
  },
  typeBarLabel: {
    color: "#555",
    flex: 1,
    fontSize: 13,
    fontWeight: "bold",
    paddingRight: 8
  },
  typeBarValue: {
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "right"
  },
  typeBarTrack: {
    backgroundColor: "#E8E8E8",
    borderRadius: 8,
    height: 10,
    overflow: "hidden"
  },
  typeBarFill: {
    borderRadius: 8,
    height: "100%"
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
