import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const API_IP = "172.20.10.6"; // Replace with your network IP
const API_BASE_URL = `http://${API_IP}:5000/api/dashboard`;

type ProjectDashboardItem = {
  id: number | string;
  project_name: string;
  project_type: string;
  performance_before: number | string | null;
  performance_after: number | string | null;
  avg_complexity_before: number | string | null;
  avg_complexity_after: number | string | null;
  avg_maintainability_before: number | string | null;
  avg_maintainability_after: number | string | null;
  code_smells_before: number | string | null;
  code_smells_after: number | string | null;
};

type Summary = {
  totalProjects: number;
  avgPerformanceGain: string;
  avgComplexityGain: string;
  avgMaintainabilityGain: string;
};

const toNumber = (value: number | string | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatNumber = (value: number, digits = 2) => value.toFixed(digits);

export default function Dashboard() {
  const [projects, setProjects] = useState<ProjectDashboardItem[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalProjects: 0,
    avgPerformanceGain: "0.00",
    avgComplexityGain: "0.00",
    avgMaintainabilityGain: "0.00"
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
              : "0.00",
          avgMaintainabilityGain:
            data.avg_maintainability_gain != null
              ? parseFloat(data.avg_maintainability_gain).toFixed(2)
              : "0.00",
          avgPerformanceGain:
            data.avg_performance_gain != null
              ? parseFloat(data.avg_performance_gain).toFixed(2)
              : "0.00"
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
              : "0.00"
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

  const analysedProjects = projects.map((project) => {
    const performanceGain =
      toNumber(project.performance_before) - toNumber(project.performance_after);
    const complexityGain =
      toNumber(project.avg_complexity_before) -
      toNumber(project.avg_complexity_after);
    const maintainabilityGain =
      toNumber(project.avg_maintainability_after) -
      toNumber(project.avg_maintainability_before);
    const smellReduction =
      toNumber(project.code_smells_before) - toNumber(project.code_smells_after);

    return {
      ...project,
      performanceGain,
      complexityGain,
      maintainabilityGain,
      smellReduction,
      totalImprovement:
        performanceGain + complexityGain + maintainabilityGain + smellReduction
    };
  });

  const totalCodeSmellsBefore = analysedProjects.reduce(
    (total, project) => total + toNumber(project.code_smells_before),
    0
  );
  const totalCodeSmellsAfter = analysedProjects.reduce(
    (total, project) => total + toNumber(project.code_smells_after),
    0
  );
  const improvedProjects = analysedProjects.filter(
    (project) =>
      project.performanceGain > 0 ||
      project.complexityGain > 0 ||
      project.maintainabilityGain > 0 ||
      project.smellReduction > 0
  ).length;
  const bestOverallProject = analysedProjects.reduce(
    (best, project) =>
      !best || project.totalImprovement > best.totalImprovement ? project : best,
    null as (typeof analysedProjects)[number] | null
  );
  const bestMaintainabilityProject = analysedProjects.reduce(
    (best, project) =>
      !best || project.maintainabilityGain > best.maintainabilityGain
        ? project
        : best,
    null as (typeof analysedProjects)[number] | null
  );
  const typeStats = Object.values(
    analysedProjects.reduce(
      (groups, project) => {
        const type = project.project_type || "Unknown";
        groups[type] = groups[type] ?? {
          type,
          count: 0,
          performanceGain: 0,
          complexityGain: 0,
          maintainabilityGain: 0
        };
        groups[type].count += 1;
        groups[type].performanceGain += project.performanceGain;
        groups[type].complexityGain += project.complexityGain;
        groups[type].maintainabilityGain += project.maintainabilityGain;
        return groups;
      },
      {} as Record<
        string,
        {
          type: string;
          count: number;
          performanceGain: number;
          complexityGain: number;
          maintainabilityGain: number;
        }
      >
    )
  );

  const averageBeforeAfter = [
    {
      label: "Performance",
      before:
        analysedProjects.reduce(
          (total, project) => total + toNumber(project.performance_before),
          0
        ) / (analysedProjects.length || 1),
      after:
        analysedProjects.reduce(
          (total, project) => total + toNumber(project.performance_after),
          0
        ) / (analysedProjects.length || 1)
    },
    {
      label: "Complexity",
      before:
        analysedProjects.reduce(
          (total, project) => total + toNumber(project.avg_complexity_before),
          0
        ) / (analysedProjects.length || 1),
      after:
        analysedProjects.reduce(
          (total, project) => total + toNumber(project.avg_complexity_after),
          0
        ) / (analysedProjects.length || 1)
    },
    {
      label: "Maintainability",
      before:
        analysedProjects.reduce(
          (total, project) =>
            total + toNumber(project.avg_maintainability_before),
          0
        ) / (analysedProjects.length || 1),
      after:
        analysedProjects.reduce(
          (total, project) =>
            total + toNumber(project.avg_maintainability_after),
          0
        ) / (analysedProjects.length || 1)
    }
  ];

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

  const getChangeBadgeStyle = (value: number) => ({
    backgroundColor: value > 0 ? "#E4F7EF" : value < 0 ? "#FDE8E8" : "#F4F4F4",
    color: value > 0 ? "#126B5D" : value < 0 ? "#9B1C1C" : "#555"
  });

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

      <View style={styles.statsGrid}>
        {renderInsight(
          "speedometer",
          "Avg Performance Gain",
          `${summary.avgPerformanceGain}%`,
          "Average performance improvement after refactoring"
        )}
        {renderInsight(
          "source-branch",
          "Avg Complexity Gain",
          `${summary.avgComplexityGain}%`,
          "Lower complexity means simpler code paths"
        )}
        {renderInsight(
          "shield-check",
          "Avg Maintainability Gain",
          `${summary.avgMaintainabilityGain}%`,
          "Higher maintainability means easier future changes"
        )}
      </View>

      <View style={styles.analysisSection}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title" style={{ fontSize: 25 }}>
            ANALYSIS
          </ThemedText>
        </ThemedView>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Project Health Overview</Text>
          <View style={styles.metricRow}>
            <Text style={styles.label}>Projects with improvements</Text>
            <Text style={styles.metricValue}>
              {improvedProjects}/{projects.length}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.label}>Total code smells removed</Text>
            <Text style={styles.metricValue}>
              {totalCodeSmellsBefore - totalCodeSmellsAfter}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.label}>Code smells before vs after</Text>
            <Text style={styles.metricValue}>
              {totalCodeSmellsBefore} to {totalCodeSmellsAfter}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Top Findings</Text>
          <Text style={styles.projectDetails}>
            Best overall refactoring:{" "}
            <Text style={styles.boldText}>
              {bestOverallProject?.project_name ?? "No project data"}
            </Text>
          </Text>
          <Text style={styles.projectDetails}>
            Strongest maintainability gain:{" "}
            <Text style={styles.boldText}>
              {bestMaintainabilityProject?.project_name ?? "No project data"}
            </Text>
          </Text>
          <Text style={styles.projectDetails}>
            Biggest smell reduction:{" "}
            <Text style={styles.boldText}>
              {analysedProjects
                .slice()
                .sort((a, b) => b.smellReduction - a.smellReduction)[0]
                ?.project_name ?? "No project data"}
            </Text>
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Average Before / After</Text>
          {averageBeforeAfter.map((metric) => (
            <View style={styles.metricRow} key={metric.label}>
              <Text style={styles.label}>{metric.label}</Text>
              <Text style={styles.metricValue}>
                {formatNumber(metric.before)} to {formatNumber(metric.after)}
              </Text>
            </View>
          ))}
        </View>

        {typeStats.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Analysis by Project Type</Text>
            {typeStats.map((type) => (
              <View style={styles.typeBlock} key={type.type}>
                <Text style={styles.projectTitle}>{type.type}</Text>
                <Text style={styles.projectDetails}>
                  Projects analysed: {type.count}
                </Text>
                <Text style={styles.projectDetails}>
                  Avg performance gain:{" "}
                  {formatNumber(type.performanceGain / type.count)}%
                </Text>
                <Text style={styles.projectDetails}>
                  Avg complexity gain:{" "}
                  {formatNumber(type.complexityGain / type.count)}%
                </Text>
                <Text style={styles.projectDetails}>
                  Avg maintainability gain:{" "}
                  {formatNumber(type.maintainabilityGain / type.count)}%
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

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
        {analysedProjects.map((project) => (
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
            <Text></Text>
            <Text
              style={[
                styles.projectDetails,
                styles.changeBadge,
                getChangeBadgeStyle(project.performanceGain)
              ]}
            >
              - Performance Gain: {formatNumber(project.performanceGain)}%
            </Text>
            <Text
              style={[
                styles.projectDetails,
                styles.changeBadge,
                getChangeBadgeStyle(project.complexityGain)
              ]}
            >
              - Complexity Gain: {formatNumber(project.complexityGain)}%
            </Text>
            <Text
              style={[
                styles.projectDetails,
                styles.changeBadge,
                getChangeBadgeStyle(project.maintainabilityGain)
              ]}
            >
              - Maintainability Gain: {formatNumber(project.maintainabilityGain)}%
            </Text>
            <Text
              style={[
                styles.projectDetails,
                styles.changeBadge,
                getChangeBadgeStyle(project.smellReduction)
              ]}
            >
              - Code Smells Removed: {project.smellReduction}
            </Text>
          </View>
        ))}
      </View>
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
  analysisSection: {
    marginTop: 5
  },
  sectionTitle: {
    color: "#123B36",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10
  },
  metricRow: {
    alignItems: "center",
    borderBottomColor: "#e0e0e0",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 12,
    textAlign: "right"
  },
  typeBlock: {
    borderBottomColor: "#e0e0e0",
    borderBottomWidth: 1,
    marginBottom: 10,
    paddingBottom: 10
  },
  boldText: {
    fontWeight: "bold"
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
  changeBadge: {
    borderRadius: 8,
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 6
  }
});
