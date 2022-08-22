function setupStatusSource() {
  let ignoreFirst = true;
  const eventSource = new EventSource("/api/stream/status");
  eventSource.onmessage = (message) => {
    let status = JSON.parse(message.data);
    if (!status) return;

    document.getElementById("body").className = status.Classification;
    document.getElementById("status-Icon").innerText = status.Icon;
    document.getElementById("status-Message").innerText = status.Message;

    if (ignoreFirst) {
      ignoreFirst = false;
    } else {
      notifyMe(status.Message);
    }
  };

  eventSource.onerror = () => {
    eventSource.close();

    setTimeout(() => {
      setupStatusSource();
    }, 1000);
  };
}

function setupDataFrameSource() {
  const eventSource = new EventSource("/api/stream/dataframe");
  eventSource.onmessage = (message) => {
    let frame = JSON.parse(message.data);
    if (!frame) return;

    document.getElementById("td-Received").innerText = frame.Received;
    document.getElementById("td-Time").innerText = frame.Time;
    document.getElementById("td-Power").innerText = frame.Power;
    document.getElementById("td-Current").innerText = frame.Current;
    document.getElementById("td-Voltage").innerText = frame.Voltage;
    document.getElementById("td-ApparentPower").innerText = frame.ApparentPower;
    document.getElementById("td-ReactivePower").innerText = frame.ReactivePower;
    document.getElementById("td-Factor").innerText = frame.Factor;
    document.getElementById("td-Total").innerText = frame.Total;
  };

  eventSource.onerror = () => {
    eventSource.close();

    setTimeout(() => {
      setupDataFrameSource();
    }, 1000);
  };
}

window.addEventListener("load", () => {
  setupStatusSource();
  setupDataFrameSource();
});

function notifyMe(message) {
  if (!("Notification" in window)) {
    console.error("This browser does not support desktop notification");
  } else if (Notification.permission === "granted") {
    buildNotification(message);
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        buildNotification(message);
      }
    });
  }
}

function buildNotification(message) {
  new Notification("ascii coffee machine", {
    body: message,
  });
}
