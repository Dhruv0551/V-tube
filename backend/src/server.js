import dotenv from "dotenv";
import connectDB from "./db/connection.js";
import app from "./app.js";

dotenv.config({
  path: "./.env",
  quiet: true,
});

// console.log(process.env.MONGODB_ATLAS);

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8080, () => {
      console.log(`Server Running at port: ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDb connection Failed");
  });
