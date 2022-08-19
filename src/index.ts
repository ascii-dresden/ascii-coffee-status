import express from "express";
import fs from "fs";

let currentStatus: any[] = [];
const BUFFER_LENGTH = 5;

const app = express();
app.use(express.json());
app.set("view engine", "ejs");

app.post("/status", (req, res) => {
  currentStatus.push(req.body);
  if (currentStatus.length > BUFFER_LENGTH) {
    currentStatus.splice(0, currentStatus.length - BUFFER_LENGTH);
  }

  fs.appendFile("logs/data.log", JSON.stringify(req.body) + "\n", (err) => {
    if (err) {
      console.error(err);
    }
  });

  res.send("ok");
});

app.get("/status", (_, res) => {
  res.send(classify());
});

app.get("/", (_, res) => {
  let status = classify();
  let current = currentStatus[currentStatus.length - 1];

  res.render("index", {
    status: status,
    current: {
      Time: current?.StatusSNS?.Time ?? null,
      Total: current?.StatusSNS?.ENERGY?.Total ?? null,
      Power: current?.StatusSNS?.ENERGY?.Power ?? null,
      ApparentPower: current?.StatusSNS?.ENERGY?.ApparentPower ?? null,
      ReactivePower: current?.StatusSNS?.ENERGY?.ReactivePower ?? null,
      Factor: current?.StatusSNS?.ENERGY?.Factor ?? null,
      Voltage: current?.StatusSNS?.ENERGY?.Voltage ?? null,
      Current: current?.StatusSNS?.ENERGY?.Current ?? null,
    },
  });
});

app.get("/body", (_, res) => {
  let status = classify();
  let current = currentStatus[currentStatus.length - 1];

  res.render("body", {
    status: status,
    current: {
      Time: current?.StatusSNS?.Time ?? null,
      Total: current?.StatusSNS?.ENERGY?.Total ?? null,
      Power: current?.StatusSNS?.ENERGY?.Power ?? null,
      ApparentPower: current?.StatusSNS?.ENERGY?.ApparentPower ?? null,
      ReactivePower: current?.StatusSNS?.ENERGY?.ReactivePower ?? null,
      Factor: current?.StatusSNS?.ENERGY?.Factor ?? null,
      Voltage: current?.StatusSNS?.ENERGY?.Voltage ?? null,
      Current: current?.StatusSNS?.ENERGY?.Current ?? null,
    },
  });
});

app.get("/log", (_, res) => {
  res.sendFile("/usr/src/app/logs/data.log");
});

app.listen(3000, () => {
  console.log("The application is listening on port 3000!");
});

function classify(): boolean {
  let sum = 0;
  let count = 0;

  for (let row of currentStatus) {
    let power = row?.StatusSNS?.ENERGY?.Power;

    if (isNumber(power)) sum += power;
    count += 1;
  }

  if (count <= 0) return false;
  return sum / count >= 18 ? true : false;
}

function isNumber(n: any): boolean {
  return typeof n == "number" && !isNaN(n - n);
}
