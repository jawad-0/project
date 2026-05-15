const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Import routes
const dashboardRoutes = require("./routes/dashboardRoutes");
const metricsRoutes = require("./routes/metricsRoutes");
const comparisonRoutes = require("./routes/comparisonRoutes");
const performanceRoutes = require("./routes/performanceRoutes");
const historyRoutes = require("./routes/historyRoutes");

// Use routes
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/comparison", comparisonRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/history", historyRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("API is running...");
});


// Start server
app.listen(5000, "0.0.0.0", () => {
  console.log("Server running on port 5000");
});
