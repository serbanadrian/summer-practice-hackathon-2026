import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import sportRoutes from "./routes/sportRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import matchingRoutes from "./routes/matchingRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "ShowUp2Move API is running 🚀" });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "ShowUp2Move",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/sports", sportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/availabilities", availabilityRoutes);
app.use("/api/matching", matchingRoutes);
app.use("/api/events", eventRoutes);
app.use("/api", messageRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});