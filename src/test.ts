import fs from "fs";
import { Classification, classify, DataFrame } from "./utils";

export function test_classification() {
  const logs = fs.readdirSync("logs/");
  for (let log of logs) {
    if (!log.endsWith(".log")) continue;

    let filename = "logs/" + log;
    console.log(filename);
    test_classification_for_file(filename);
    console.log();
  }
}

export function test_classification_for_file(filename: string) {
  // read contents of the file
  const data = fs.readFileSync(filename, "utf-8");

  // split the contents by new line
  const lines = data.split(/\r?\n/);

  const BUFFER_LENGTH = 6;
  let dataFrameBuffer: DataFrame[] = [];
  let latestClassification: Classification = "unknown";
  let lastClassificationTimestamp = 0;

  // print all lines
  for (let l of lines) {
    let line = l.trim();
    if (line.length <= 0) return;

    let frame = JSON.parse(line);
    dataFrameBuffer.push(frame);
    if (dataFrameBuffer.length > BUFFER_LENGTH) {
      dataFrameBuffer.splice(0, dataFrameBuffer.length - BUFFER_LENGTH);
    }

    let [classification, timestamp] = classify(
      latestClassification,
      lastClassificationTimestamp,
      frame,
      dataFrameBuffer
    );

    if (classification !== latestClassification) {
      latestClassification = classification;
      lastClassificationTimestamp = timestamp;
      console.log(`  ${frame.Time} - ${classification}`);
    }
  }
}

test_classification();
