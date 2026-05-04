const express = require("express");
const router = express.Router();
const connection = require("../database");

// GET dashboard data
router.get("/", (req, res) => {
  const query = "SELECT * FROM projects_dashboard";

  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err });
    }

    res.json(results);
  });
});

// GET total projects
router.get("/count", (req, res) => {
  const query = "SELECT COUNT(*) AS total_projects FROM projects_dashboard";

  connection.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err });

    res.json(results[0]);
  });
});

// GET performance stats
router.get("/performance", (req, res) => {
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

// GET average stats
router.get("/gains", (req, res) => {
  const query = `
    SELECT
        AVG(avg_complexity_before - avg_complexity_after) AS avg_complexity_gain,
        AVG(avg_maintainability_after - avg_maintainability_before) AS avg_maintainability_gain,
        AVG(performance_before - performance_after) AS avg_performance_gain
    FROM projects_dashboard
    `;

  connection.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results[0]);
  });
});

module.exports = router;
