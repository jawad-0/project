const express = require("express");
const router = express.Router();
const connection = require("../database");

// GET all metrics (before vs after averages)
router.get("/", (req, res) => {
  const query = `
    SELECT
      AVG(avg_complexity_before) AS complexity_before,
      AVG(avg_complexity_after) AS complexity_after,
      AVG(avg_maintainability_before) AS maintainability_before,
      AVG(avg_maintainability_after) AS maintainability_after,
      SUM(code_smells_before) AS smells_before,
      SUM(code_smells_after) AS smells_after
    FROM projects_dashboard
  `;

  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err });
    }

    res.json(results[0]);
  });
});

// GET metrics per project
router.get("/projects", (req, res) => {
  const query = `
    SELECT
      project_name,
      project_type,
      avg_complexity_before,
      avg_complexity_after,
      avg_maintainability_before,
      avg_maintainability_after,
      code_smells_before,
      code_smells_after
    FROM projects_dashboard
  `;

  connection.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err });

    res.json(results);
  });
});

module.exports = router;
