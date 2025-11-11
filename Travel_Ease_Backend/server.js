import express from "express";
import cors from "cors";
import {
  travel_plan_routes,
  user_routes,
  config_routes,
  utils_routes,
} from "./routes/index.js";
const app = express();

app.use(express.json()); // parse application/json

app.use(cors()); //for testing

//routes

app.use("/api/travel_plan", travel_plan_routes);

app.use("/api/user", user_routes);

app.use("/api/utils", utils_routes);

app.use("/api/config", config_routes);

//server

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
