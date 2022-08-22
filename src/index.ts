#!/usr/bin/env node
import EventEmitter from "events";
import express from "express";
import fs from "fs";
import {
  StatusFrame,
  classify,
  createStatusFrame,
  DataFrame,
  runSSE,
} from "./utils";
var serveIndex = require("serve-index");

const BUFFER_LENGTH = 6;
let GlobalDataFrameBuffer: DataFrame[] = [];
let GlobalStatus: StatusFrame = createStatusFrame("unknown", "");

const GlobalEmitter = new EventEmitter();

const app = express();
app.use(express.json());
app.set("view engine", "ejs");

app.post("/status", (req, res) => {
  let frame = {
    Received: new Date().toISOString(),
    Time: req.body?.StatusSNS?.Time ?? null,
    Total: req.body?.StatusSNS?.ENERGY?.Total ?? null,
    Power: req.body?.StatusSNS?.ENERGY?.Power ?? null,
    ApparentPower: req.body?.StatusSNS?.ENERGY?.ApparentPower ?? null,
    ReactivePower: req.body?.StatusSNS?.ENERGY?.ReactivePower ?? null,
    Factor: req.body?.StatusSNS?.ENERGY?.Factor ?? null,
    Voltage: req.body?.StatusSNS?.ENERGY?.Voltage ?? null,
    Current: req.body?.StatusSNS?.ENERGY?.Current ?? null,
  };

  GlobalEmitter.emit("OnDataFrame", frame);
  GlobalEmitter.emit("OnDataFrameString", JSON.stringify(frame));

  res.send("ok");
});

app.get("/api/status", (_, res) => {
  res.send(GlobalStatus);
});

app.get("/api/dataframe", (_, res) => {
  let DataFrame =
    GlobalDataFrameBuffer[GlobalDataFrameBuffer.length - 1] ?? null;
  res.send(DataFrame);
});

app.get("/api/stream/status", (req, res) => {
  runSSE(
    req,
    res,
    GlobalEmitter,
    "OnStatusString",
    JSON.stringify(GlobalStatus)
  );
});

app.get("/api/stream/dataframe", async function (req, res) {
  let DataFrame =
    GlobalDataFrameBuffer[GlobalDataFrameBuffer.length - 1] ?? null;
  runSSE(
    req,
    res,
    GlobalEmitter,
    "OnDataFrameString",
    JSON.stringify(DataFrame)
  );
});

app.get("/", (_, res) => {
  let DataFrame =
    GlobalDataFrameBuffer[GlobalDataFrameBuffer.length - 1] ?? null;

  res.render("index", {
    Status: GlobalStatus,
    DataFrame,
  });
});

app.use("/logs", express.static("./logs"), serveIndex("./logs"));

app.use("/", express.static("./static"));

let port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`The application is listening on port ${port}!`);
});

GlobalEmitter.addListener("OnDataFrameString", (frameString) => {
  let date = JSON.parse(frameString).Received.substring(0, 10);
  let logFile = `logs/data-${date}.log`;
  fs.appendFile(logFile, frameString + "\n", (err) => {
    if (err) {
      console.error(err);
    }
  });
});

GlobalEmitter.addListener("OnDataFrame", (frame) => {
  GlobalDataFrameBuffer.push(frame);
  if (GlobalDataFrameBuffer.length > BUFFER_LENGTH) {
    GlobalDataFrameBuffer.splice(
      0,
      GlobalDataFrameBuffer.length - BUFFER_LENGTH
    );
  }

  let classification = classify(
    GlobalStatus.Classification,
    frame,
    GlobalDataFrameBuffer
  );

  if (classification !== GlobalStatus.Classification) {
    GlobalStatus = createStatusFrame(
      classification,
      GlobalDataFrameBuffer[GlobalDataFrameBuffer.length - 1].Time
    );

    GlobalEmitter.emit("OnStatus", GlobalStatus);
    GlobalEmitter.emit("OnStatusString", JSON.stringify(GlobalStatus));
  }
});
