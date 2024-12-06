import "reflect-metadata";
import express from "express";
import AppDataSource from "./config/ormconfig";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error during Data Source initialization:", error);
  });

app.get("/", (req, res) => {
  res.send("Hello, world!");
});
