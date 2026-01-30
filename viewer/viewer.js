const pdfjsScript = document.createElement("script");
pdfjsScript.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.js";
document.head.appendChild(pdfjsScript);

const workerScript = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.js";

const canvas = document.getElementById("pdfCanvas");
const ctx = canvas.getContext("2d");

const docTitle = document.getElementById("docTitle");
const pageLabel = document.getElementById("pageLabel");
const hint = document.getElementById("hint");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const zoomInBtn = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");

const params = new URLSearchParams(window.location.search);
const fileParam = params.get("file");
const titleParam = params.get("title");

if (titleParam) docTitle.textContent = decodeURIComponent(titleParam);

if (!fileParam) {
  hint.textContent = "The viewer needs a file parameter in the URL.";
}

let pdfDoc = null;
let pageNum = 1;
let scale = 1.2;
let renderBusy = false;

function safeFilePath(file) {
  return "../" + file.replace(/^\/+/, "");
}

function updateLabel() {
  if (!pdfDoc) return;
  pageLabel.textContent = `Page ${pageNum} of ${pdfDoc.numPages}`;
}

async function renderPage() {
  if (!pdfDoc || renderBusy) return;
  renderBusy = true;

  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  await page.render({ canvasContext: ctx, viewport }).promise;

  updateLabel();
  renderBusy = false;
}

function clampPage(n) {
  if (!pdfDoc) return 1;
  if (n < 1) return 1;
  if (n > pdfDoc.numPages) return pdfDoc.numPages;
  return n;
}

async function loadPdf() {
  await new Promise((resolve) => { pdfjsScript.onload = resolve; });

  // eslint-disable-next-line no-undef
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerScript;

  const url = safeFilePath(fileParam);

  // eslint-disable-next-line no-undef
  pdfDoc = await pdfjsLib.getDocument(url).promise;

  pageNum = clampPage(1);
  hint.textContent = "Use the controls to navigate pages and zoom level.";
  await renderPage();
}

prevBtn.addEventListener("click", async () => {
  pageNum = clampPage(pageNum - 1);
  await renderPage();
});

nextBtn.addEventListener("click", async () => {
  pageNum = clampPage(pageNum + 1);
  await renderPage();
});

zoomInBtn.addEventListener("click", async () => {
  scale = Math.min(scale + 0.2, 3.0);
  await renderPage();
});

zoomOutBtn.addEventListener("click", async () => {
  scale = Math.max(scale - 0.2, 0.6);
  await renderPage();
});

if (fileParam) loadPdf();
