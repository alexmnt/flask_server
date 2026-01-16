type MdTabs = HTMLElement & { activeTab?: HTMLElement };
type MdTextField = HTMLElement & { value: string; focus: () => void };

const navTabs = document.querySelector<MdTabs>('md-tabs[data-nav="primary"]');
const statusPill = document.querySelector<HTMLElement>('[data-status="pill"]');
const statusText = document.querySelector<HTMLElement>('[data-status="text"]');
const statusTime = document.querySelector<HTMLElement>('[data-status="time"]');
const statusLatency = document.querySelector<HTMLElement>('[data-status="latency"]');
const healthButton = document.querySelector<HTMLElement>('[data-action="health"]');
const seedButton = document.querySelector<HTMLElement>('[data-action="seed"]');
const form = document.querySelector<HTMLFormElement>('[data-form="echo"]');
const clearButton = document.querySelector<HTMLElement>('[data-action="clear"]');
const echoResult = document.querySelector<HTMLElement>('[data-echo="result"]');
const messageField = form?.querySelector<MdTextField>('md-outlined-text-field');
const assetHealth = document.querySelector<HTMLElement>('[data-asset-health]');
const assetCss = assetHealth?.querySelector<HTMLElement>('[data-asset="css"]');
const assetJs = assetHealth?.querySelector<HTMLElement>('[data-asset="js"]');

const STATUS_LABELS: Record<string, string> = {
  ok: "Online",
  error: "Offline",
  loading: "Checking",
};

const hasStatusUI = Boolean(statusPill && statusText && statusTime && statusLatency);

function setStatus(state?: string, text?: string) {
  if (!hasStatusUI || !statusPill || !statusText) {
    return;
  }
  statusPill.classList.remove("ok", "error", "loading");
  if (state) {
    statusPill.classList.add(state);
    statusPill.textContent = STATUS_LABELS[state] || "Status";
  }
  if (text) {
    statusText.textContent = text;
  }
}

function updateAssetHealth() {
  if (!assetHealth || !assetCss || !assetJs) {
    return;
  }
  const cssCheck = getComputedStyle(document.documentElement)
    .getPropertyValue("--asset-css-check")
    .trim();
  assetCss.setAttribute("data-status", cssCheck === "1" ? "ok" : "fail");
  assetJs.setAttribute("data-status", "ok");
}

async function checkHealth() {
  if (!hasStatusUI || !statusTime || !statusLatency) {
    return;
  }
  setStatus("loading", "Contacting /api/health...");
  const start = performance.now();
  try {
    const response = await fetch("/api/health");
    if (!response.ok) {
      throw new Error("Health check failed");
    }
    const data = await response.json();
    const latency = Math.round(performance.now() - start);
    const timeValue = new Date(data.server_time).toLocaleString();

    statusTime.textContent = timeValue;
    statusLatency.textContent = `${latency} ms`;
    setStatus("ok", "Server healthy and responding.");
  } catch (error) {
    statusTime.textContent = "--";
    statusLatency.textContent = "--";
    setStatus("error", "Server unreachable or offline.");
  }
}

async function sendEcho(message: string) {
  if (!echoResult) {
    return;
  }
  echoResult.textContent = "Sending...";
  try {
    const response = await fetch("/api/echo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });
    if (!response.ok) {
      throw new Error("Echo failed");
    }
    const data = await response.json();
    echoResult.textContent = `Received: "${data.message}" (${data.length} chars)`;
  } catch (error) {
    echoResult.textContent = "Request failed. Check the server logs.";
  }
}

if (navTabs) {
  navTabs.addEventListener("change", (event) => {
    const tabs = event.currentTarget as MdTabs | null;
    const activeTab = tabs?.activeTab;
    const href = activeTab?.dataset?.href;
    if (!href || href === "#" || href === window.location.pathname) {
      return;
    }
    window.location.assign(href);
  });
}

if (healthButton) {
  healthButton.addEventListener("click", () => {
    checkHealth();
  });
}

if (seedButton && messageField) {
  seedButton.addEventListener("click", () => {
    messageField.value = "Quick sanity check from the MD3 UI";
    messageField.focus();
  });
}

if (form && messageField) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = (messageField.value || "").trim();
    if (!message) {
      if (echoResult) {
        echoResult.textContent = "Please add a message before sending.";
      }
      return;
    }
    sendEcho(message);
  });
}

if (clearButton && messageField) {
  clearButton.addEventListener("click", () => {
    messageField.value = "";
    if (echoResult) {
      echoResult.textContent = "Nothing yet.";
    }
  });
}

if (healthButton) {
  checkHealth();
}

updateAssetHealth();
setTimeout(updateAssetHealth, 250);
