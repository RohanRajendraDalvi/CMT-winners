import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import routes from "./routes";
import errorHandler from "./middleware/errorHandlers";
import homeController from "./controllers/home.controller";
import weatherRoutes from "./routes/weather.routes";
import slipRoutes from "./routes/slip.routes";


const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan("combined"));
app.use(errorHandler);
app.disable("x-powered-by");

// Routes

app.use("/api", routes);
app.use("/weather", weatherRoutes);
app.use("/slip", slipRoutes);
app.get("/", homeController.home)

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "OK", time: new Date() });
});

export default app;
