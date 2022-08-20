import EventEmitter from "events";

export interface DataFrame {
  Received: string;
  Time: string | null;
  Total: number | null;
  Power: number | null;
  ApparentPower: number | null;
  ReactivePower: number | null;
  Factor: number | null;
  Voltage: number | null;
  Current: number | null;
}

export type Classification = "unknown" | "off" | "on";

export interface StatusFrame {
  Classification: Classification;
  Icon: string;
  Message: string;
}

export function runSSE(
  req: any,
  res: any,
  eventEmitter: EventEmitter,
  eventName: string,
  firstEvent?: string
) {
  res.set({
    "Cache-Control": "no-cache",
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  res.write("retry: 5000\n\n");

  if (firstEvent) {
    res.write(`data: ${firstEvent}\n\n`);
  }

  let onMessage = (stringMessage: string) => {
    res.write(`data: ${stringMessage}\n\n`);
  };

  eventEmitter.addListener(eventName, onMessage);
  req.on("close", () => {
    eventEmitter.removeListener(eventName, onMessage);
  });
}

export function classify(currentStatus: DataFrame[]): Classification {
  let sum = 0;
  let count = 0;

  for (let row of currentStatus) {
    let power = row?.Power;

    if (isNumber(power)) sum += power;
    count += 1;
  }

  if (count <= 0) return "unknown";
  return sum / count >= 18 ? "on" : "off";
}

function isNumber(n: any): boolean {
  return typeof n === "number" && !isNaN(n - n);
}

export function createClassificationFrame(
  classification: Classification
): StatusFrame {
  let icon = "";
  let message = "";

  switch (classification) {
    case "on":
      icon = "😄";
      message = "Yay, die Maschine ist an!";
      break;
    case "off":
      icon = "😕";
      message = "Ohh, die Maschine ist aus!";
      break;
    case "unknown":
      icon = "😮";
      message = "Mhh, was ist hier los?";
      break;
  }

  return {
    Classification: classification,
    Icon: icon,
    Message: message,
  };
}
