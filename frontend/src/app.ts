type MdTabs = HTMLElement & { activeTab?: HTMLElement };
type MdTextField = HTMLElement & { value: string; focus: () => void };
type LottieAnimation = {
  setSpeed: (value: number) => void;
  play: () => void;
  pause: () => void;
};

type LottiePlayer = {
  loadAnimation: (config: {
    container: Element;
    renderer: "svg";
    loop: boolean;
    autoplay: boolean;
    path?: string;
    animationData?: Record<string, unknown>;
    rendererSettings: {
      preserveAspectRatio: string;
    };
  }) => LottieAnimation;
};

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

type ParsedSseEvent = {
  event: string;
  data: string;
};

const DEFAULT_TIMEOUT_MS = 8000;
const CLIPPY_STREAM_ENDPOINT = "/api/clippy/stream";
const CLIPPY_TRIGGER_LOTTIE_URL =
  "https://assets-v2.lottiefiles.com/a/b1ec3274-329e-498f-a89f-ee60b1523594/qOIKTITppT.json";
const CLIPPY_WHITE_LAYER_NAMES = new Set([
  "Ellipse 25",
  "Ellipse 26",
  "Ellipse 27",
  "Ellipse 29",
  "Ellipse 30",
  "Ellipse 13",
]);
const CLIPPY_WHITE_TONE_THRESHOLD = 0.94;
const SPA_MAIN_SELECTOR = "[data-spa-main]";

const navTabs = document.querySelector<MdTabs>('md-tabs[data-nav="primary"]');
const assetHealth = document.querySelector<HTMLElement>('[data-asset-health]');
const assetCss = assetHealth?.querySelector<HTMLElement>('[data-asset="css"]');
const assetJs = assetHealth?.querySelector<HTMLElement>('[data-asset="js"]');
const menuGrid = document.querySelector<HTMLElement>(".menu-grid");
const menuDrawer = document.querySelector<HTMLElement>("[data-menu-drawer]");
const menuPanel = menuDrawer?.querySelector<HTMLElement>("[data-menu-panel]");
const menuToggles = document.querySelectorAll<HTMLElement>("[data-menu-toggle]");
const menuToggleText = menuDrawer?.querySelector<HTMLElement>("[data-menu-toggle-text]");
const menuMore = menuDrawer?.querySelector<HTMLElement>("[data-menu-more]");
const menuMoreText = menuDrawer?.querySelector<HTMLElement>("[data-menu-more-text]");
const menuReopen = document.querySelector<HTMLElement>("[data-menu-reopen]");
const topstack = document.querySelector<HTMLElement>(".topstack");
const topbar = topstack?.querySelector<HTMLElement>(".topbar");
const clippyRoot = document.querySelector<HTMLElement>("[data-clippy-root]");
const clippyToggle = clippyRoot?.querySelector<HTMLElement>("[data-clippy-toggle]");
const clippyPanel = clippyRoot?.querySelector<HTMLElement>("[data-clippy-panel]");
const clippyClose = clippyRoot?.querySelector<HTMLElement>("[data-clippy-close]");
const clippyForm = clippyRoot?.querySelector<HTMLFormElement>("[data-clippy-form]");
const clippyInput = clippyRoot?.querySelector<HTMLTextAreaElement>("[data-clippy-input]");
const clippySend = clippyRoot?.querySelector<HTMLButtonElement>("[data-clippy-send]");
const clippyLog = clippyRoot?.querySelector<HTMLElement>("[data-clippy-log]");
const clippyTriggerAnimation = clippyRoot?.querySelector<HTMLElement>(
  "[data-clippy-trigger-animation]"
);
const root = document.documentElement;

const STATUS_LABELS: Record<string, string> = {
  ok: "Online",
  error: "Offline",
  loading: "Checking",
};

type StatusElements = {
  pill: HTMLElement;
  text: HTMLElement;
  time: HTMLElement;
  latency: HTMLElement;
};

const getStatusElements = (): StatusElements | null => {
  const pill = document.querySelector<HTMLElement>('[data-status="pill"]');
  const text = document.querySelector<HTMLElement>('[data-status="text"]');
  const time = document.querySelector<HTMLElement>('[data-status="time"]');
  const latency = document.querySelector<HTMLElement>('[data-status="latency"]');
  if (!pill || !text || !time || !latency) {
    return null;
  }
  return { pill, text, time, latency };
};

const getEchoField = (scope: ParentNode = document): MdTextField | null =>
  scope.querySelector<MdTextField>('md-outlined-text-field');

const getEchoResult = (): HTMLElement | null => document.querySelector<HTMLElement>('[data-echo="result"]');

const isSpaMainTarget = (target: HTMLElement | null): boolean =>
  Boolean(target?.matches(SPA_MAIN_SELECTOR));

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

const showPageLoader = (persistIntent = true) => {
  if (persistIntent) {
    try {
      sessionStorage.setItem("page-loader-intent", "1");
    } catch {
      // Ignore storage errors (private mode, disabled storage).
    }
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

let clippyAbortController: AbortController | null = null;
let clippyTriggerPlayerPromise: Promise<LottiePlayer | null> | null = null;
let clippyTriggerDataPromise: Promise<Record<string, unknown> | null> | null = null;
let clippyTriggerLottie: LottieAnimation | null = null;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const loadClippyTriggerPlayer = async (): Promise<LottiePlayer | null> => {
  if (prefersReducedMotion) {
    return null;
  }
  if (!clippyTriggerPlayerPromise) {
    clippyTriggerPlayerPromise = import("lottie-web/build/player/lottie_light")
      .then((module) => {
        const resolved = module as unknown as { default?: unknown };
        if (!resolved.default) {
          return null;
        }
        return resolved.default as LottiePlayer;
      })
      .catch(() => null);
  }
  return clippyTriggerPlayerPromise;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

const isNumericArray = (value: unknown, minLength: number): value is number[] =>
  Array.isArray(value) &&
  value.length >= minLength &&
  value.every((entry) => typeof entry === "number");

const isNearWhiteRgb = (value: unknown): boolean => {
  if (!isNumericArray(value, 3)) {
    return false;
  }
  return (
    value[0] >= CLIPPY_WHITE_TONE_THRESHOLD &&
    value[1] >= CLIPPY_WHITE_TONE_THRESHOLD &&
    value[2] >= CLIPPY_WHITE_TONE_THRESHOLD
  );
};

const colorPropertyIsNearWhite = (value: unknown): boolean => {
  if (isNearWhiteRgb(value)) {
    return true;
  }
  if (!Array.isArray(value)) {
    return false;
  }
  return value.some((entry) => {
    if (!isRecord(entry)) {
      return false;
    }
    return isNearWhiteRgb(entry.s) || isNearWhiteRgb(entry.e);
  });
};

const opacityPropertyValue = (value: unknown): number | null => {
  if (typeof value === "number") {
    return value;
  }
  if (!Array.isArray(value)) {
    return null;
  }
  for (const frame of value) {
    if (!isRecord(frame)) {
      continue;
    }
    const start = frame.s;
    if (typeof start === "number") {
      return start;
    }
    if (isNumericArray(start, 1)) {
      return start[0];
    }
  }
  return null;
};

const nodeContainsNearWhitePaint = (node: Record<string, unknown>): boolean => {
  if (node.ty !== "fl" && node.ty !== "st") {
    return false;
  }
  const colorValue = isRecord(node.c) ? node.c.k : undefined;
  if (!colorPropertyIsNearWhite(colorValue)) {
    return false;
  }
  const opacityValue = opacityPropertyValue(isRecord(node.o) ? node.o.k : undefined);
  return opacityValue === null || opacityValue >= 70;
};

const shouldRemoveWhiteLayer = (layer: unknown): boolean => {
  if (!isRecord(layer)) {
    return false;
  }
  const name = layer.nm;
  return typeof name === "string" && CLIPPY_WHITE_LAYER_NAMES.has(name.trim());
};

const forcePaintOpacityToZero = (paintNode: Record<string, unknown>) => {
  if (!isRecord(paintNode.o)) {
    paintNode.o = { a: 0, k: 0 };
    return;
  }

  const keyframes = paintNode.o.k;
  if (typeof keyframes === "number") {
    paintNode.o.k = 0;
    return;
  }

  if (!Array.isArray(keyframes)) {
    paintNode.o.k = 0;
    return;
  }

  keyframes.forEach((frame) => {
    if (!isRecord(frame)) {
      return;
    }
    if (typeof frame.s === "number") {
      frame.s = 0;
    } else if (isNumericArray(frame.s, 1)) {
      frame.s[0] = 0;
    }
    if (typeof frame.e === "number") {
      frame.e = 0;
    } else if (isNumericArray(frame.e, 1)) {
      frame.e[0] = 0;
    }
  });
};

const sanitizeWhiteLayersDeep = (node: unknown): void => {
  if (!isRecord(node)) {
    return;
  }

  const layers = node.layers;
  if (Array.isArray(layers)) {
    node.layers = layers.filter((layer) => !shouldRemoveWhiteLayer(layer));
  }

  if (nodeContainsNearWhitePaint(node)) {
    forcePaintOpacityToZero(node);
  }

  Object.values(node).forEach((value) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => sanitizeWhiteLayersDeep(entry));
      return;
    }
    sanitizeWhiteLayersDeep(value);
  });
};

const sanitizeClippyTriggerData = (raw: Record<string, unknown>): Record<string, unknown> => {
  const copy = JSON.parse(JSON.stringify(raw)) as Record<string, unknown>;
  sanitizeWhiteLayersDeep(copy);
  return copy;
};

const loadClippyTriggerData = async (): Promise<Record<string, unknown> | null> => {
  if (!clippyTriggerDataPromise) {
    clippyTriggerDataPromise = fetch(CLIPPY_TRIGGER_LOTTIE_URL)
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }
        return (await response.json()) as Record<string, unknown>;
      })
      .then((raw) => {
        if (!raw) {
          return null;
        }
        return sanitizeClippyTriggerData(raw);
      })
      .catch(() => null);
  }
  return clippyTriggerDataPromise;
};

const initializeClippyTriggerAnimation = async () => {
  if (!clippyTriggerAnimation || clippyTriggerLottie || prefersReducedMotion) {
    return;
  }

  const player = await loadClippyTriggerPlayer();
  const animationData = await loadClippyTriggerData();
  if (!player || !animationData) {
    return;
  }

  clippyTriggerLottie = player.loadAnimation({
    container: clippyTriggerAnimation,
    renderer: "svg",
    loop: true,
    autoplay: true,
    animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid meet",
    },
  });
  clippyTriggerLottie.setSpeed(1);
  syncClippyTriggerMotion();
};

const syncClippyTriggerMotion = () => {
  if (!clippyRoot || !clippyTriggerLottie || prefersReducedMotion) {
    return;
  }
  if (document.hidden || clippyRoot.dataset.state === "open") {
    clippyTriggerLottie.pause();
    return;
  }
  clippyTriggerLottie.play();
};

const setClippyState = (state: "open" | "closed") => {
  if (!clippyRoot || !clippyPanel || !clippyToggle) {
    return;
  }
  clippyRoot.dataset.state = state;
  const expanded = state === "open";
  clippyPanel.setAttribute("aria-hidden", String(!expanded));
  clippyToggle.setAttribute("aria-expanded", String(expanded));
  if (expanded) {
    window.setTimeout(() => {
      clippyInput?.focus();
    }, 40);
  }
  syncClippyTriggerMotion();
};

const setClippyBusy = (isBusy: boolean) => {
  if (clippySend) {
    clippySend.disabled = isBusy;
  }
  if (clippyInput) {
    clippyInput.disabled = isBusy;
  }
  if (clippyRoot) {
    clippyRoot.dataset.busy = String(isBusy);
  }
};

const scrollClippyLog = () => {
  if (!clippyLog) {
    return;
  }
  clippyLog.scrollTop = clippyLog.scrollHeight;
};

const appendClippyMessage = (
  role: "assistant" | "user" | "error",
  text: string,
  isStreaming = false
) => {
  if (!clippyLog) {
    return null;
  }
  const bubble = document.createElement("p");
  bubble.className = `clippy-message ${role}`;
  if (isStreaming) {
    bubble.classList.add("streaming");
  }
  bubble.textContent = text;
  clippyLog.append(bubble);
  scrollClippyLog();
  return bubble;
};

const parseSseBuffer = (buffer: string): { events: ParsedSseEvent[]; rest: string } => {
  const blocks = buffer.split(/\r?\n\r?\n/);
  const rest = blocks.pop() ?? "";
  const events: ParsedSseEvent[] = [];

  blocks.forEach((block) => {
    const lines = block.split(/\r?\n/);
    let eventName = "message";
    const payload: string[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return;
      }
      if (trimmed.startsWith("event:")) {
        eventName = trimmed.slice(6).trim();
        return;
      }
      if (trimmed.startsWith("data:")) {
        payload.push(trimmed.slice(5).trimStart());
      }
    });

    events.push({ event: eventName, data: payload.join("\n") });
  });

  return { events, rest };
};

const parseSseJson = (value: string): Record<string, unknown> | null => {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }
  return null;
};

const parseErrorResponse = async (response: Response): Promise<string> => {
  try {
    const payload = (await response.json()) as { error?: unknown };
    if (typeof payload.error === "string" && payload.error.trim()) {
      return payload.error;
    }
  } catch {
    // Ignore non-JSON error bodies.
  }
  return `Request failed with status ${response.status}.`;
};

const streamClippyReply = async (message: string) => {
  if (!clippyLog) {
    return;
  }

  if (clippyAbortController) {
    clippyAbortController.abort();
  }
  const controller = new AbortController();
  clippyAbortController = controller;
  setClippyBusy(true);

  const bubble =
    appendClippyMessage("assistant", "Thinking...", true) ??
    appendClippyMessage("assistant", "Thinking...");
  if (!bubble) {
    setClippyBusy(false);
    return;
  }

  let assistantText = "";
  try {
    const response = await fetch(CLIPPY_STREAM_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(await parseErrorResponse(response));
    }
    if (!response.body) {
      throw new Error("Streaming is unavailable in this browser.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let isDone = false;

    while (!isDone) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const { events, rest } = parseSseBuffer(buffer);
      buffer = rest;

      events.forEach((event) => {
        if (event.event === "token") {
          const parsed = parseSseJson(event.data);
          const token = parsed?.value;
          if (typeof token === "string" && token) {
            assistantText += token;
            bubble.textContent = assistantText;
            scrollClippyLog();
          }
          return;
        }
        if (event.event === "error") {
          const parsed = parseSseJson(event.data);
          const messageValue = parsed?.message;
          const reason =
            typeof messageValue === "string" && messageValue.trim()
              ? messageValue
              : "Assistant failed to fetch a response.";
          throw new Error(reason);
        }
        if (event.event === "done") {
          isDone = true;
        }
      });
    }

    if (!assistantText.trim()) {
      bubble.textContent = "No response content was returned.";
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      bubble.textContent = "Request canceled.";
      bubble.classList.remove("assistant");
      bubble.classList.add("error");
      return;
    }
    const messageValue =
      error instanceof Error ? error.message : "Assistant request failed unexpectedly.";
    bubble.textContent = messageValue;
    bubble.classList.remove("assistant");
    bubble.classList.add("error");
  } finally {
    bubble.classList.remove("streaming");
    if (clippyAbortController === controller) {
      clippyAbortController = null;
    }
    setClippyBusy(false);
    scrollClippyLog();
  }
};

function setStatus(state?: string, text?: string, elements: StatusElements | null = getStatusElements()) {
  if (!elements) {
    return;
  }
  const { pill, text: statusText } = elements;
  pill.classList.remove("ok", "error", "loading");
  if (state) {
    pill.classList.add(state);
    pill.textContent = STATUS_LABELS[state] || "Status";
  }
  if (typeof text === "string") {
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
  const statusElements = getStatusElements();
  if (!statusElements) {
    return;
  }
  setStatus("loading", "Contacting /api/health...", statusElements);
  const start = performance.now();
  try {
    const data = await fetchJson<HealthResponse>("/api/health");
    const latency = Math.round(performance.now() - start);
    const timeValue = new Date(data.server_time).toLocaleString();

    statusElements.time.textContent = timeValue;
    statusElements.latency.textContent = `${latency} ms`;
    setStatus("ok", "Server healthy and responding.", statusElements);
  } catch (error) {
    statusElements.time.textContent = "--";
    statusElements.latency.textContent = "--";
    const message =
      error instanceof Error ? error.message : "Server unreachable or offline.";
    setStatus("error", message, statusElements);
  }
}

async function sendEcho(message: string, echoResult: HTMLElement | null = getEchoResult()) {
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
    showPageLoader(false);
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

const normalizePath = (value: string): string => {
  const normalized = value.replace(/\/+$/, "");
  return normalized || "/";
};

const syncSpaNavState = () => {
  const currentPath = normalizePath(window.location.pathname);
  document.querySelectorAll<HTMLAnchorElement>("[data-spa-link]").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) {
      link.classList.remove("is-active");
      link.removeAttribute("aria-current");
      return;
    }
    let hrefPath = "";
    try {
      hrefPath = normalizePath(new URL(href, window.location.origin).pathname);
    } catch {
      hrefPath = "";
    }
    const isActive = hrefPath === currentPath;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

const bootstrapCurrentPage = () => {
  syncSpaNavState();
  if (getStatusElements()) {
    void checkHealth();
  }
  syncTopstackHeight();
};

if (clippyRoot) {
  setClippyState("closed");
  void initializeClippyTriggerAnimation();
  document.addEventListener("visibilitychange", () => {
    syncClippyTriggerMotion();
  });
}

if (clippyToggle) {
  clippyToggle.addEventListener("click", () => {
    const current = clippyRoot?.dataset.state === "open" ? "open" : "closed";
    setClippyState(current === "open" ? "closed" : "open");
  });
}

if (clippyClose) {
  clippyClose.addEventListener("click", () => {
    setClippyState("closed");
  });
}

if (clippyForm && clippyInput) {
  clippyForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = clippyInput.value.trim();
    if (!message || clippySend?.disabled) {
      return;
    }

    appendClippyMessage("user", message);
    clippyInput.value = "";
    void streamClippyReply(message);
  });
}

if (clippyInput) {
  clippyInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      clippyForm?.requestSubmit();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }
  if (clippyRoot?.dataset.state === "open") {
    setClippyState("closed");
  }
});

document.addEventListener("click", (event) => {
  const target = event.target as HTMLElement | null;
  if (!target) {
    return;
  }

  const healthTrigger = target.closest<HTMLElement>('[data-action="health"]');
  if (healthTrigger) {
    event.preventDefault();
    void checkHealth();
    return;
  }

  const seedTrigger = target.closest<HTMLElement>('[data-action="seed"]');
  if (seedTrigger) {
    event.preventDefault();
    const formEl = document.querySelector<HTMLFormElement>('[data-form="echo"]');
    const field = formEl ? getEchoField(formEl) : null;
    if (!field) {
      return;
    }
    field.value = "Quick sanity check from the MD3 UI";
    field.focus();
    return;
  }

  const clearTrigger = target.closest<HTMLElement>('[data-action="clear"]');
  if (clearTrigger) {
    event.preventDefault();
    const formEl = document.querySelector<HTMLFormElement>('[data-form="echo"]');
    const field = formEl ? getEchoField(formEl) : null;
    if (field) {
      field.value = "";
    }
    const result = getEchoResult();
    if (result) {
      result.textContent = "Nothing yet.";
    }
  }
});

document.addEventListener("submit", (event) => {
  const submitted = event.target;
  if (!(submitted instanceof HTMLFormElement) || submitted.dataset.form !== "echo") {
    return;
  }
  event.preventDefault();

  const field = getEchoField(submitted);
  const result = getEchoResult();
  const message = (field?.value || "").trim();
  if (!message) {
    if (result) {
      result.textContent = "Please add a message before sending.";
    }
    return;
  }
  void sendEcho(message, result);
});

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
