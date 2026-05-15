const express = require("express");
const router = express.Router();
const connection = require("../database");

// GET all historical project metric records
router.get("/", (req, res) => {
  const query = `
    SELECT
      id,
      project_name,
      project_type,
      cyclomatic_complexity,
      maintainability_index,
      code_smells,
      response_time_ms,
      total_sprints,
      completed_sprints,
      total_tasks,
      completed_tasks,
      measurement_stage,
      notes,
      measured_at
    FROM project_metrics_history
    ORDER BY measured_at DESC, id DESC
  `;

  connection.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err });

    res.json(results);
  });
});

// GET summary values for the history table
router.get("/summary", (req, res) => {
  const query = `
    SELECT
      COUNT(*) AS total_records,
      COUNT(DISTINCT project_name) AS total_projects,
      AVG(cyclomatic_complexity) AS avg_complexity,
      AVG(maintainability_index) AS avg_maintainability,
      AVG(response_time_ms) AS avg_response_time
    FROM project_metrics_history
  `;

  connection.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err });

    res.json(results[0]);
  });
});

// GET record counts grouped by refactoring stage
router.get("/stages", (req, res) => {
  const query = `
    SELECT
      COALESCE(measurement_stage, 'unknown') AS measurement_stage,
      COUNT(*) AS total_records
    FROM project_metrics_history
    GROUP BY measurement_stage
    ORDER BY total_records DESC
  `;

  connection.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err });

    res.json(results);
  });
});

module.exports = router;
