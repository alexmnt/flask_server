type MdTabs = HTMLElement & { activeTab?: HTMLElement };
type MdTextField = HTMLElement & { value: string; focus: () => void };

type HealthResponse = {
  server_time: string;
};

type EchoResponse = {
  message: string;
  length: number;
};

type FetchOptions = RequestInit & {
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 8000;

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
const menuGrid = document.querySelector<HTMLElement>(".menu-grid");
const menuDrawer = document.querySelector<HTMLElement>("[data-menu-drawer]");
const menuPanel = menuDrawer?.querySelector<HTMLElement>("[data-menu-panel]");
const menuToggles = menuDrawer?.querySelectorAll<HTMLElement>("[data-menu-toggle]") ?? [];
const menuToggleText = menuDrawer?.querySelector<HTMLElement>("[data-menu-toggle-text]");
const menuMore = menuDrawer?.querySelector<HTMLElement>("[data-menu-more]");
const menuMoreText = menuDrawer?.querySelector<HTMLElement>("[data-menu-more-text]");
const menuReopen = document.querySelector<HTMLElement>("[data-menu-reopen]");
const topstack = document.querySelector<HTMLElement>(".topstack");
const topbar = topstack?.querySelector<HTMLElement>(".topbar");
const root = document.documentElement;

const STATUS_LABELS: Record<string, string> = {
  ok: "Online",
  error: "Offline",
  loading: "Checking",
};

const hasStatusUI = Boolean(statusPill && statusText && statusTime && statusLatency);

const syncTopstackHeight = () => {
  if (!topstack) {
    return;
  }
  const height = Math.ceil(topstack.getBoundingClientRect().height);
  root.style.setProperty("--topstack-height", `${height}px`);
  if (topbar) {
    const barHeight = Math.ceil(topbar.getBoundingClientRect().height);
    root.style.setProperty("--topbar-height", `${barHeight}px`);
  }
};

const fetchJson = async <T>(input: RequestInfo | URL, options: FetchOptions = {}) => {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...init } = options;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    if (!response.ok) {
      let message = `Request failed: ${response.status}`;
      try {
        const errorData = (await response.json()) as { error?: string };
        if (errorData?.error) {
          message = errorData.error;
        }
      } catch {
        // Ignore JSON parse errors for non-JSON responses.
      }
      throw new Error(message);
    }
    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const showPageLoader = () => {
  try {
    sessionStorage.setItem("page-loader-intent", "1");
  } catch {
    // Ignore storage errors (private mode, disabled storage).
  }
  if (window.pageLoader?.show) {
    window.pageLoader.show();
    return;
  }
  root.dataset.pageLoading = "true";
};

const hidePageLoader = () => {
  if (window.pageLoader?.hide) {
    window.pageLoader.hide();
    return;
  }
  delete root.dataset.pageLoading;
};

type MenuState = "open" | "closed";

const setMenuState = (state: MenuState) => {
  if (!menuDrawer) {
    return;
  }
  menuDrawer.dataset.state = state;
  root.dataset.menuState = state;
  const expanded = state === "open";
  menuPanel?.setAttribute("aria-hidden", expanded ? "false" : "true");
  menuToggles.forEach((toggle) => {
    toggle.setAttribute("aria-expanded", String(expanded));
  });
  menuMore?.setAttribute("aria-expanded", String(expanded));
  if (menuReopen) {
    menuReopen.setAttribute("aria-expanded", String(expanded));
    menuReopen.setAttribute("aria-hidden", String(expanded));
    menuReopen.tabIndex = expanded ? -1 : 0;
  }
  if (menuToggleText) {
    menuToggleText.textContent = expanded ? "Hide menu" : "Show menu";
  }
  if (menuMoreText) {
    menuMoreText.textContent = expanded ? "Less" : "More";
  }
  syncTopstackHeight();
};

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
    const data = await fetchJson<HealthResponse>("/api/health");
    const latency = Math.round(performance.now() - start);
    const timeValue = new Date(data.server_time).toLocaleString();

    statusTime.textContent = timeValue;
    statusLatency.textContent = `${latency} ms`;
    setStatus("ok", "Server healthy and responding.");
  } catch (error) {
    statusTime.textContent = "--";
    statusLatency.textContent = "--";
    const message =
      error instanceof Error ? error.message : "Server unreachable or offline.";
    setStatus("error", message);
  }
}

async function sendEcho(message: string) {
  if (!echoResult) {
    return;
  }
  echoResult.textContent = "Sending...";
  try {
    const data = await fetchJson<EchoResponse>("/api/echo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });
    echoResult.textContent = `Received: "${data.message}" (${data.length} chars)`;
  } catch (error) {
    echoResult.textContent =
      error instanceof Error ? error.message : "Request failed. Check the server logs.";
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
    showPageLoader();
    window.location.assign(href);
  });
}

if (menuDrawer) {
  const isSmallScreen = window.matchMedia("(max-width: 639px)").matches;
  const initialState = menuDrawer.dataset.state === "closed" ? "closed" : "open";
  const resolvedState = isSmallScreen ? "closed" : initialState;
  setMenuState(resolvedState);
}

if (topstack) {
  syncTopstackHeight();
  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(() => {
      syncTopstackHeight();
    });
    observer.observe(topstack);
  }
  window.addEventListener("resize", () => {
    syncTopstackHeight();
  });
  window.addEventListener("load", () => {
    syncTopstackHeight();
  });
}

if (menuToggles.length) {
  menuToggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const current = menuDrawer?.dataset.state === "closed" ? "closed" : "open";
      setMenuState(current === "open" ? "closed" : "open");
    });
  });
}

if (menuMore) {
  menuMore.addEventListener("click", () => {
    const current = menuDrawer?.dataset.state === "closed" ? "closed" : "open";
    setMenuState(current === "open" ? "closed" : "open");
  });
}

if (menuReopen) {
  menuReopen.addEventListener("click", () => {
    setMenuState("open");
  });
}

if (menuDrawer) {
  menuDrawer.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const link = target?.closest<HTMLElement>(
      'md-list-item[href][type="link"], a[href], md-filled-button[href], md-filled-tonal-button[href], md-outlined-button[href], md-text-button[href]'
    );
    if (!link) {
      return;
    }
    if (event instanceof MouseEvent) {
      if (event.defaultPrevented) {
        return;
      }
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
    }
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#")) {
      return;
    }
    let url: URL;
    try {
      url = new URL(href, window.location.origin);
    } catch {
      return;
    }
    if (url.origin !== window.location.origin) {
      return;
    }
    if (url.pathname === window.location.pathname && url.search === window.location.search) {
      return;
    }
    const targetAttr = link.getAttribute("target");
    if (targetAttr && targetAttr !== "_self") {
      return;
    }
    showPageLoader();
  });
}

const prefetchedDocs = new Set<string>();

const canPrefetch = () => {
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (connection?.saveData) {
    return false;
  }
  const effectiveType = connection?.effectiveType;
  if (effectiveType === "slow-2g" || effectiveType === "2g") {
    return false;
  }
  return true;
};

const prefetchDocument = (href: string) => {
  if (!canPrefetch()) {
    return;
  }
  if (!href || href.startsWith("#")) {
    return;
  }
  let url: URL;
  try {
    url = new URL(href, window.location.origin);
  } catch {
    return;
  }
  if (url.origin !== window.location.origin) {
    return;
  }
  if (url.pathname === window.location.pathname && url.search === window.location.search) {
    return;
  }
  if (prefetchedDocs.has(url.href)) {
    return;
  }
  prefetchedDocs.add(url.href);

  const prefetch = document.createElement("link");
  prefetch.rel = "prefetch";
  prefetch.href = url.href;
  prefetch.as = "document";
  document.head.appendChild(prefetch);
};

const menuPrefetchRoot = menuDrawer ?? menuGrid;

if (menuPrefetchRoot) {
  const onPrefetchIntent = (event: Event) => {
    const target = event.target as HTMLElement | null;
    const link = target?.closest<HTMLElement>(
      'md-list-item[href][type="link"], a[href], md-filled-button[href], md-filled-tonal-button[href], md-outlined-button[href], md-text-button[href]'
    );
    if (!link) {
      return;
    }
    const href = link.getAttribute("href");
    if (!href) {
      return;
    }
    const targetAttr = link.getAttribute("target");
    if (targetAttr && targetAttr !== "_self") {
      return;
    }
    prefetchDocument(href);
  };

  menuPrefetchRoot.addEventListener("pointerover", onPrefetchIntent, { passive: true });
  menuPrefetchRoot.addEventListener("focusin", onPrefetchIntent);
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

const setBusyState = (target: HTMLElement | null, isBusy: boolean) => {
  if (!target) {
    return;
  }
  if (isBusy) {
    target.setAttribute("aria-busy", "true");
  } else {
    target.removeAttribute("aria-busy");
  }
};

document.body.addEventListener("htmx:beforeRequest", (event) => {
  const target = (event as CustomEvent).detail?.target as HTMLElement | null;
  setBusyState(target, true);
});

document.body.addEventListener("htmx:afterRequest", (event) => {
  const target = (event as CustomEvent).detail?.target as HTMLElement | null;
  setBusyState(target, false);
});

document.body.addEventListener("htmx:responseError", (event) => {
  const target = (event as CustomEvent).detail?.target as HTMLElement | null;
  setBusyState(target, false);
});

window.addEventListener("pageshow", () => {
  hidePageLoader();
});
