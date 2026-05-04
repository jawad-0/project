const express = require("express");
const router = express.Router();
const connection = require("../database");

// GET performance for all projects
router.get("/", (req, res) => {
  const query = `
    SELECT
      project_name,
      project_type,
      performance_before,
      performance_after,
      (performance_before - performance_after) AS improvement_ms
    FROM projects_dashboard
  `;

  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err });
    }

    res.json(results);
  });
});

// GET average performance improvement
router.get("/average", (req, res) => {
  const query = `
    SELECT
      AVG(performance_before - performance_after) AS avg_performance_gain
    FROM projects_dashboard
  `;

  connection.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err });

    res.json(results[0]);
  });
});

// GET performance by project type (Django vs Flask)
router.get("/type", (req, res) => {
  const query = `
    SELECT
      project_type,
      AVG(performance_before - performance_after) AS avg_performance_gain
    FROM projects_dashboard
    GROUP BY project_type
  `;

  connection.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err });

    res.json(results);
  });
});

module.exports = router;
