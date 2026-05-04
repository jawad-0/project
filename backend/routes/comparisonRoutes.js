const express = require("express");
const router = express.Router();
const connection = require("../database");

// GET comparison (all projects)
router.get("/", (req, res) => {
  const query = `
    SELECT
      project_name,
      project_type,

      avg_complexity_before,
      avg_complexity_after,
      (avg_complexity_before - avg_complexity_after) AS complexity_improvement,

      avg_maintainability_before,
      avg_maintainability_after,
      (avg_maintainability_after - avg_maintainability_before) AS maintainability_improvement,

      code_smells_before,
      code_smells_after,
      (code_smells_before - code_smells_after) AS smells_reduction

    FROM projects_dashboard
  `;

  connection.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err });

    res.json(results);
  });
});

// GET comparison by project type (Django vs Flask)
router.get("/type", (req, res) => {
  const query = `
    SELECT
      project_type,
      AVG(avg_complexity_before - avg_complexity_after) AS avg_complexity_reduction,
      AVG(avg_maintainability_after - avg_maintainability_before) AS avg_maintainability_gain
    FROM projects_dashboard
    GROUP BY project_type
  `;

  connection.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err });

    res.json(results);
  });
});

module.exports = router;
