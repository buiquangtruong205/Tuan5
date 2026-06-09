const PROXY_ORIGIN = "http://127.0.0.1:5500";
const DEFAULT_BASE_URL = window.URLHosting || "/api";
const STORAGE_KEY = "aiot-api-base-url";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const baseInput = $("#baseUrl");
const healthState = $("#healthState");
const docsLink = $("#docsLink");
const demoLink = $("#demoLink");

function getBaseUrl() {
  return baseInput.value.trim().replace(/\/+$/, "");
}

function setOutput(target, value) {
  target.textContent = typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function endpointUrl(path) {
  const baseUrl = getBaseUrl();
  if (location.protocol === "file:" && baseUrl.startsWith("/")) {
    return `${PROXY_ORIGIN}${baseUrl}${path}`;
  }

  return `${baseUrl}${path}`;
}

function updateLinks() {
  docsLink.href = endpointUrl("/docs");
  demoLink.href = endpointUrl("/classify-image-demo");
}

async function readResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  if (contentType.startsWith("image/")) {
    return response.blob();
  }

  return response.text();
}

async function request(path, options = {}) {
  const response = await fetch(endpointUrl(path), options);
  const data = await readResponse(response);

  if (!response.ok) {
    const detail = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    throw new Error(`HTTP ${response.status} ${response.statusText}\n${detail}`);
  }

  return data;
}

async function withButtonState(button, label, action) {
  const oldLabel = button.textContent;
  button.disabled = true;
  button.textContent = label;
  try {
    await action();
  } finally {
    button.disabled = false;
    button.textContent = oldLabel;
  }
}

async function checkHealth() {
  const output = $("#healthOutput");
  await withButtonState($("#checkHealth"), "Đang gọi", async () => {
    try {
      const data = await request("/health");
      healthState.textContent = "Online";
      healthState.className = "ok";
      setOutput(output, data);
    } catch (error) {
      healthState.textContent = "Offline";
      healthState.className = "bad";
      setOutput(output, error.message);
    }
  });
}

async function loadModelInfo() {
  const output = $("#modelInfoOutput");
  await withButtonState($("#loadModelInfo"), "Đang tải", async () => {
    const [iot, vision] = await Promise.allSettled([
      request("/model-info"),
      request("/vision/model-info"),
    ]);
    setOutput(output, {
      iot: iot.status === "fulfilled" ? iot.value : iot.reason.message,
      vision: vision.status === "fulfilled" ? vision.value : vision.reason.message,
    });
  });
}

async function sendJson(card) {
  const button = $("[data-send-json]", card);
  const textarea = $("textarea", card);
  const output = $(".output", card);
  const path = card.dataset.endpoint;

  await withButtonState(button, "Đang gửi", async () => {
    try {
      const body = JSON.parse(textarea.value);
      const data = await request(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setOutput(output, data);
    } catch (error) {
      setOutput(output, error.message);
    }
  });
}

function selectedImage() {
  const file = $("#imageInput").files[0];
  if (!file) {
    throw new Error("Vui lòng chọn một ảnh trước.");
  }
  return file;
}

function makeImageForm(file) {
  const form = new FormData();
  form.append("file", file);
  form.append("image", file);
  return form;
}

async function classifyImage() {
  const output = $("#imageOutput");
  await withButtonState($("#sendImage"), "Đang gửi", async () => {
    try {
      const data = await request("/classify-image", {
        method: "POST",
        body: makeImageForm(selectedImage()),
      });
      setOutput(output, data);
    } catch (error) {
      setOutput(output, error.message);
    }
  });
}

async function classifyAnnotatedImage() {
  const output = $("#annotatedOutput");
  const result = $("#annotatedResult");

  await withButtonState($("#sendAnnotatedImage"), "Đang tạo", async () => {
    try {
      const data = await request("/classify-image-annotated", {
        method: "POST",
        body: makeImageForm(selectedImage()),
      });

      result.innerHTML = "";
      if (data instanceof Blob) {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(data);
        img.alt = "Ảnh đã annotate";
        result.appendChild(img);
        setOutput(output, "Đã nhận ảnh annotated.");
      } else {
        const imgUrl = data.annotated_image_url || data.image_url || data.url;
        if (imgUrl) {
          const img = document.createElement("img");
          img.src = imgUrl.startsWith("http") ? imgUrl : endpointUrl(imgUrl);
          img.alt = "Ảnh đã annotate";
          result.appendChild(img);
        } else {
          result.innerHTML = "<span>Endpoint trả JSON, không có URL ảnh.</span>";
        }
        setOutput(output, data);
      }
    } catch (error) {
      setOutput(output, error.message);
    }
  });
}

function bindTabs() {
  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".tab").forEach((item) => item.classList.remove("active"));
      $$(".panel").forEach((panel) => panel.classList.remove("active"));
      tab.classList.add("active");
      $(`#${tab.dataset.tab}`).classList.add("active");
    });
  });
}

function bindImagePreview() {
  $("#imageInput").addEventListener("change", (event) => {
    const file = event.target.files[0];
    const preview = $("#imagePreview");
    if (!file) {
      preview.classList.remove("has-image");
      preview.removeAttribute("src");
      return;
    }
    preview.src = URL.createObjectURL(file);
    preview.classList.add("has-image");
  });
}

function init() {
  const savedBaseUrl = localStorage.getItem(STORAGE_KEY);
  const legacyDirectApi =
    savedBaseUrl === "http://localhost:8000" ||
    savedBaseUrl === "http://127.0.0.1:8000";

  if (legacyDirectApi) {
    localStorage.setItem(STORAGE_KEY, DEFAULT_BASE_URL);
  }

  baseInput.value = legacyDirectApi ? DEFAULT_BASE_URL : savedBaseUrl || DEFAULT_BASE_URL;
  if (location.protocol === "file:" && baseInput.value.startsWith("/")) {
    baseInput.value = `${PROXY_ORIGIN}${baseInput.value}`;
  }
  updateLinks();
  bindTabs();
  bindImagePreview();

  $("#saveBaseUrl").addEventListener("click", () => {
    localStorage.setItem(STORAGE_KEY, getBaseUrl());
    baseInput.value = getBaseUrl();
    updateLinks();
  });

  baseInput.addEventListener("change", updateLinks);
  $("#checkHealth").addEventListener("click", checkHealth);
  $("#loadModelInfo").addEventListener("click", loadModelInfo);
  $("#sendImage").addEventListener("click", classifyImage);
  $("#sendAnnotatedImage").addEventListener("click", classifyAnnotatedImage);
  $$(".endpoint-card").forEach((card) => {
    $("[data-send-json]", card).addEventListener("click", () => sendJson(card));
  });

  checkHealth();
}

init();
