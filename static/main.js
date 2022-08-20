function setupStatusSource() {
  const eventSource = new EventSource("/api/stream/status");
  eventSource.onmessage = (message) => {
    let status = JSON.parse(message.data);

    document.getElementById("body").className = status.Classification;
    document.getElementById("status-Icon").innerText = status.Icon;
    document.getElementById("status-Message").innerText = status.Message;
  };

  eventSource.onerror = () => {
    eventSource.close();

    setTimeout(() => {
      setupStatusSource();
    }, 3000);
  };
}

function setupDataFrameSource() {
  const eventSource = new EventSource("/api/stream/dataframe");
  eventSource.onmessage = (message) => {
    let frame = JSON.parse(message.data);

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
    }, 3000);
  };
}

window.addEventListener("load", () => {
  setupStatusSource();
  setupDataFrameSource();
});
