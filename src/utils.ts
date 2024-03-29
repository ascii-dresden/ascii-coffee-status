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
  ClassificationTimestamp: number;
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
    "X-Accel-Buffering": "no",
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

function matchMost(window: DataFrame[], min: number, max: number): boolean {
  let all = true;
  let falseCount = 0;

  for (let row of window) {
    let power = row?.Power;

    if (isNumber(power)) {
      if (!(min <= power && power <= max)) {
        all = false;
        falseCount += 1;
      }
    }
  }

  if (falseCount <= window.length / 3) {
    return true;
  }

  return all;
}

export function classify(
  lastClassification: Classification,
  lastClassificationTimestamp: number,
  currentFrame: DataFrame,
  window: DataFrame[]
): [Classification, number] {
  const SHUTDOWN_OFFSET = 15 * 60 * 1000;
  let currentTimestamp = new Date(currentFrame.Time).getTime();

  let power = currentFrame.Power;
  if (!isNumber(power))
    return [lastClassification, lastClassificationTimestamp];

  switch (lastClassification) {
    case "startup":
      if (matchMost(window, 35, 5000)) {
        return ["startup", lastClassificationTimestamp];
      }
      break;
    case "on":
      if (matchMost(window, 35, 50)) {
        return ["shutdown", currentTimestamp];
      }
      break;
    case "shutdown":
      if (
        matchMost(window, 22, 5000) ||
        currentTimestamp < lastClassificationTimestamp + SHUTDOWN_OFFSET
      ) {
        return ["shutdown", lastClassificationTimestamp];
      }
      if (
        isNumber(window[window.length - 1].Power) &&
        window[window.length - 1].Power < 18
      ) {
        return ["off", currentTimestamp];
      }
      break;
    case "off":
      if (!matchMost(window, 0, 17)) {
        window.splice(0, window.length - 1);
        return ["startup", currentTimestamp];
      }
      break;
    case "unknown":
      return power < 18 ? ["off", currentTimestamp] : ["on", currentTimestamp];
  }

  let result: Classification = matchMost(window, 0, 17) ? "off" : "on";
  return [
    result,
    result === lastClassification
      ? lastClassificationTimestamp
      : currentTimestamp,
  ];
}

function isNumber(n: any): boolean {
  return typeof n === "number" && !isNaN(n - n);
}

export function createStatusFrame(
  classification: Classification,
  classificationTimestamp: number,
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
    ClassificationTimestamp: classificationTimestamp,
  };
}
