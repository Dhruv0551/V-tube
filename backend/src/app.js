import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "dotenv";

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.static("public"));
app.use(
  express.json({
    limit: "32kb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "32kb",
  })
);

app.use(cookieParser());

//routes
import userRouter from "./routes/user.route.js";

app.use("/api/v1/users", userRouter);

export default app;
