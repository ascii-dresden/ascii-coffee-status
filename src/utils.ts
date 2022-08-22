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

export type Classification = "unknown" | "off" | "on" | "startup" | "shutdown";

export interface StatusFrame {
  Classification: Classification;
  Icon: string;
  Message: string;
  Time: string;
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

function matchAll(
  currentStatus: DataFrame[],
  min: number,
  max: number
): boolean {
  let all = true;
  let falseCount = 0;

  for (let row of currentStatus) {
    let power = row?.Power;

    if (isNumber(power)) {
      if (!(min <= power && power <= max)) {
        all = false;
        falseCount += 1;
      }
    }
  }

  if (falseCount <= 2) {
    return true;
  }

  return all;
}

export function classify(
  lastClassification: Classification,
  currentStatus: DataFrame[]
): Classification {
  if (currentStatus.length <= 0) return "unknown";

  switch (lastClassification) {
    case "startup":
      if (matchAll(currentStatus, 35, 5000)) {
        return "startup";
      }
      break;
    case "on":
      if (matchAll(currentStatus, 35, 50)) {
        return "shutdown";
      }
      break;
    case "shutdown":
      if (matchAll(currentStatus, 22, 5000)) {
        return "shutdown";
      }
      if (
        isNumber(currentStatus[currentStatus.length - 1].Power) &&
        currentStatus[currentStatus.length - 1].Power < 18
      ) {
        return "off";
      }
      break;
    case "off":
      if (!matchAll(currentStatus, 0, 17)) {
        return "startup";
      }
      break;
  }

  return matchAll(currentStatus, 0, 17) ? "off" : "on";
}

function isNumber(n: any): boolean {
  return typeof n === "number" && !isNaN(n - n);
}

export function createStatusFrame(
  classification: Classification,
  time: string
): StatusFrame {
  let icon = "";
  let message = "";

  switch (classification) {
    case "startup":
      icon = "😄";
      message = "Yay, die Maschine wird angeschaltet!";
      break;
    case "on":
      icon = "😄";
      message = "Yay, die Maschine ist an!";
      break;
    case "shutdown":
      icon = "😕";
      message = "Ohh, die Maschine wird ausgeschaltet!";
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
    Time: time,
  };
}
