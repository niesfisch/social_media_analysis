import {
  normalizeRows,
  computeOverview,
  averageMinutesPerDayPerYear,
  hoursPerMonth,
  averageMinutesPerDayPerMonth,
  percentageDistributionPerHour,
  avgMinutesPerHour,
  minutesPerWeekdayBubbles,
  minutesPerHourBubbles,
  filterRowsByYearAndMonth,
  topShows,
  streamTimePerShowByMonth,
  showStats,
  toCsv
} from "./analysis.js";
import { t, setLocale, getCurrentLocale, initLocale } from "./i18n.js";

const fileInput = document.getElementById("jsonFile");
const analyzeBtn = document.getElementById("analyzeBtn");
const sampleBtn = document.getElementById("sampleBtn");
const yearSelect = document.getElementById("yearSelect");
const monthSelect = document.getElementById("monthSelect");
const statusEl = document.getElementById("status");
const overviewEl = document.getElementById("overview");
const downloadCsvBtn = document.getElementById("downloadCsvBtn");
const showStatsBody = document.querySelector("#showStatsTable tbody");
const showFilterCard = document.getElementById("showFilterCard");
const showFilterSearch = document.getElementById("showFilterSearch");
const showFilterList = document.getElementById("showFilterList");
const showFilterSummary = document.getElementById("showFilterSummary");
const selectAllShowsBtn = document.getElementById("selectAllShowsBtn");
const clearAllShowsBtn = document.getElementById("clearAllShowsBtn");
const whyCard = document.getElementById("whyCard");
const hideWhyBtn = document.getElementById("hideWhyBtn");
const infoCard = document.getElementById("infoCard");
const hideInfoBtn = document.getElementById("hideInfoBtn");
const langBtn = document.getElementById("langBtn");

const chartSectionIds = [
  "sectionOverview", "sectionAvgPerDay", "sectionHoursPerMonth",
  "sectionAvgMinutesPerMonth", "sectionHourDistribution", "sectionAvgMinutesPerHour",
  "sectionWeekdayBubbles", "sectionHourBubbles", "sectionTopShows",
  "sectionStreamTimePerShow", "sectionShowStats"
];

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const charts = {};
let normalizedRows = [];
let filteredRows = [];
let allShowNames = [];
let selectedShowNames = new Set();
let cachedShowStats = [];

function escapeHtml(value) {
   return String(value)
     .replaceAll("&", "&amp;")
     .replaceAll("<", "&lt;")
     .replaceAll(">", "&gt;")
     .replaceAll('"', "&quot;")
     .replaceAll("'", "&#39;");
 }

 function formatDate(date) {
   const year = date.getFullYear();
   const month = String(date.getMonth() + 1).padStart(2, "0");
   const day = String(date.getDate()).padStart(2, "0");
   return `${year}-${month}-${day}`;
 }

function setChartHeadingWithInfo(elementId, titleText, tooltipText) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const safeTitle = escapeHtml(titleText);
  const safeTip = escapeHtml(tooltipText);
  el.innerHTML = `${safeTitle} <span class="info-icon" tabindex="0" aria-label="Info" data-tooltip="${safeTip}">i</span>`;
}

function getScopeSuffix(yearScope = "all", monthScope = "all") {
  if (yearScope === "all") {
    return ` (${t("allYears")})`;
  }
  if (monthScope === "all") {
    return ` (${yearScope})`;
  }
  return ` (${monthScope})`;
}

function updateChartHeadlinesForScope(yearScope = "all", monthScope = "all") {
  const suffix = getScopeSuffix(yearScope, monthScope);
  setChartHeadingWithInfo("avgPerDayPerYearTitle", `${t("avgPerDayPerYear")}${suffix}`, t("tipAvgPerDayPerYear"));
  setChartHeadingWithInfo("hoursPerMonthTitle", `${t("hoursPerMonth")}${suffix}`, t("tipHoursPerMonth"));
  setChartHeadingWithInfo("avgMinutesPerMonthTitle", `${t("avgMinutesPerMonth")}${suffix}`, t("tipAvgMinutesPerMonth"));
  setChartHeadingWithInfo("percentageDistributionTitle", `${t("percentageDistribution")}${suffix}`, t("tipPercentageDistribution"));
  setChartHeadingWithInfo("avgMinutesPerHourTitle", `${t("avgMinutesPerHourChart")}${suffix}`, t("tipAvgMinutesPerHour"));
  setChartHeadingWithInfo("minutesPerWeekdayTitle", `${t("minutesPerWeekday")}${suffix}`, t("tipMinutesPerWeekday"));
  setChartHeadingWithInfo("minutesPerHourTitle", `${t("minutesPerHour")}${suffix}`, t("tipMinutesPerHour"));
  setChartHeadingWithInfo("topShowsTitle", `${t("topShowsInYear")}${suffix}`, t("tipTopShows"));
  setChartHeadingWithInfo("streamTimePerShowTitle", `${t("streamTimePerShow")}${suffix}`, t("tipStreamTimePerShow"));
}

function updateAllTextContent() {
  document.getElementById("pageTitle").textContent = t("title");
  document.getElementById("pageSubtitle").textContent = t("subtitle");
  document.getElementById("videoPodcastHint").textContent = t("videoPodcastHint");
  document.getElementById("whyTitle").textContent = t("whyTitle");
  document.getElementById("whyText1").textContent = t("whyText1");
  document.getElementById("whyText2").textContent = t("whyText2");
  document.getElementById("whyParentHint").textContent = t("whyParentHint");
  document.getElementById("hideWhyBtn").textContent = t("hideWhyButton");
  document.getElementById("howToTitle").textContent = t("howToGetStarted");
  document.getElementById("spotifySettingsLink").textContent = t("openSpotifySettings");
  document.getElementById("privacyStep").innerHTML = `${t("goToPrivacy")}`;
  document.getElementById("downloadStep").innerHTML = `${t("clickDownloadData")}`;
  document.getElementById("extendedHistoryStep").innerHTML = `${t("selectExtendedHistory")}`;
  document.getElementById("emailStep").textContent = t("spotifyWillSendEmail");
  document.getElementById("extractStep").textContent = t("extractZipAndFind");
  document.getElementById("uploadStep").textContent = t("uploadHere");
  document.getElementById("privacyNote").textContent = t("allAnalysisInBrowser");
  document.getElementById("sampleDataHint").textContent = t("sampleDataHint");
  document.getElementById("downloadVisualsTitle").textContent = t("downloadVisualsTitle");
  document.getElementById("hideInfoBtn").textContent = t("hideButton");
  document.getElementById("jsonFileLabel").textContent = t("podcastHistoryJson");
  document.getElementById("yearSelectLabel").textContent = t("yearScopeForShows");
  document.getElementById("monthSelectLabel").textContent = t("monthScopeForShows");
  document.getElementById("yearSelectHint").textContent = t("yearScopeHint");
  document.getElementById("analyzeBtn").textContent = t("analyzeButton");
  document.getElementById("sampleBtn").textContent = t("sampleButton");
  document.getElementById("downloadCsvBtn").textContent = t("downloadCsvButton");
  document.getElementById("filterTitle").textContent = t("showFilter");
  document.getElementById("filterSubtitle").textContent = t("uncheckShowsToExclude");
  document.getElementById("filterSortHint").textContent = t("filterSortHint");
  document.getElementById("searchShowsLabel").textContent = t("searchShows");
  document.getElementById("selectAllShowsBtn").textContent = t("selectAllButton");
  document.getElementById("clearAllShowsBtn").textContent = t("clearAllButton");
  document.getElementById("overviewTitle").textContent = t("overview");
  updateChartHeadlinesForScope(yearSelect.value || "all", monthSelect.value || "all");
  document.getElementById("showStatsTitle").textContent = t("showStats");
  renderShowStatsTable(cachedShowStats);
  document.getElementById("footerImprintLink").textContent = t("footerImprint");
  document.getElementById("footerPrivacyLink").textContent = t("footerPrivacy");
  document.getElementById("footerAllLocal").textContent = t("footerAllLocal");
  document.getElementById("footerSourceText").textContent = t("footerSourceCode");
  document.getElementById("topImprintLink").textContent = t("footerImprint");
  document.getElementById("topPrivacyLink").textContent = t("footerPrivacy");
  document.getElementById("topSourceText").textContent = t("footerSourceCode");
  langBtn.textContent = `${getCurrentLocale()} / ${getCurrentLocale() === "DE" ? "EN" : "DE"}`;
  // Refresh dynamic selects if data is already loaded so "all" labels update.
  if (normalizedRows.length) {
    const currentYear = yearSelect.value || "all";
    const currentMonth = monthSelect.value || "all";
    const allYearOption = yearSelect.querySelector("option[value='all']");
    if (allYearOption) allYearOption.textContent = t("allYears");
    renderMonthSelect(currentYear, currentMonth);
  }
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#b91c1c" : "";
}

function destroyChart(chartId) {
  if (charts[chartId]) {
    charts[chartId].destroy();
    delete charts[chartId];
  }
}

function renderOverview(summary) {
  const firstYear = summary.years[0] ?? "-";
  const lastYear = summary.years.at(-1) ?? "-";
  overviewEl.innerHTML = `
    <div class="metric"><span>${t("streams")}</span><strong>${summary.streams}</strong></div>
    <div class="metric"><span>${t("totalHours")}</span><strong>${summary.totalHours}</strong></div>
    <div class="metric"><span>${t("totalMinutes")}</span><strong>${summary.totalMinutes}</strong></div>
    <div class="metric"><span>${t("shows")}</span><strong>${summary.showCount}</strong></div>
    <div class="metric"><span>${t("range")}</span><strong>${firstYear} - ${lastYear}</strong></div>
  `;
}

function renderYearSelect(years, preferredValue = "all", preferredMonth = "all") {
  yearSelect.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = t("allYears");
  yearSelect.append(allOption);

  for (const year of years) {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = String(year);
    yearSelect.append(option);
  }

  yearSelect.disabled = false;
  document.getElementById("yearSelectHint").textContent = "";
  const available = new Set(["all", ...years.map((year) => String(year))]);
  yearSelect.value = available.has(String(preferredValue)) ? String(preferredValue) : "all";
  renderMonthSelect(yearSelect.value, preferredMonth);
}

function renderMonthSelect(selectedYear, preferredMonth = "all") {
  monthSelect.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = t("allMonths");
  monthSelect.append(allOption);

  const months = selectedYear === "all"
    ? []
    : [...new Set(filteredRows
        .filter((row) => row.year === Number(selectedYear))
        .map((row) => row.monthKey))]
          .sort();

  for (const monthKey of months) {
    const option = document.createElement("option");
    option.value = monthKey;
    option.textContent = monthKey;
    monthSelect.append(option);
  }

  monthSelect.disabled = selectedYear === "all";
  const available = new Set(["all", ...months]);
  monthSelect.value = available.has(preferredMonth) ? preferredMonth : "all";
}

function renderShowFilterSummary() {
  const selected = selectedShowNames.size;
  const total = allShowNames.length;
  showFilterSummary.textContent = `${selected} ${t("acrossShows")} ${total} ${t("showsText")} ${t("selectAllButton").toLowerCase()}`;
}

function updateShowFilterOptionsForScope(yearScope, monthScope, initialize = false) {
  const scopedRows = filterRowsByYearAndMonth(normalizedRows, yearScope, monthScope);
  const msByShow = new Map();
  for (const row of scopedRows) {
    msByShow.set(row.showName, (msByShow.get(row.showName) ?? 0) + row.msPlayed);
  }

  allShowNames = [...msByShow.keys()].sort((a, b) => msByShow.get(b) - msByShow.get(a));

  if (initialize) {
    selectedShowNames = new Set(allShowNames);
  } else {
    selectedShowNames = new Set([...selectedShowNames].filter((name) => msByShow.has(name)));
  }

  renderShowFilterList();
  renderShowFilterSummary();
}

function renderShowFilterList() {
  const term = showFilterSearch.value.trim().toLowerCase();
  showFilterList.innerHTML = "";

  const visibleShows = allShowNames.filter((showName) => showName.toLowerCase().includes(term));
  for (const [index, showName] of visibleShows.entries()) {
    const id = `show-filter-${index}`;
    const wrapper = document.createElement("label");
    wrapper.className = "show-filter-item";
    wrapper.setAttribute("for", id);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = id;
    checkbox.checked = selectedShowNames.has(showName);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        selectedShowNames.add(showName);
      } else {
        selectedShowNames.delete(showName);
      }
      renderShowFilterSummary();
      applyShowFiltersAndRecalculate();
    });

    const labelText = document.createElement("span");
    labelText.textContent = showName;
    wrapper.append(checkbox, labelText);
    showFilterList.append(wrapper);
  }
}

function applyShowFiltersAndRecalculate() {
  const currentYear = yearSelect.value || "all";
  const currentMonth = monthSelect.value || "all";
  updateShowFilterOptionsForScope(currentYear, currentMonth, false);

  const scopedRows = filterRowsByYearAndMonth(normalizedRows, currentYear, currentMonth);
  filteredRows = scopedRows.filter((row) => selectedShowNames.has(row.showName));

   const summary = computeOverview(filteredRows);
   renderOverview(summary);
   const allYears = [...new Set(normalizedRows.map((row) => row.year))].sort((a, b) => a - b);
   renderYearSelect(allYears, currentYear, currentMonth);

   renderAllCharts(filteredRows, yearSelect.value || "all", monthSelect.value || "all");

    const firstDate = normalizedRows.length > 0 ? formatDate(normalizedRows[0].ts) : "—";
    const lastDate = normalizedRows.length > 0 ? formatDate(normalizedRows[normalizedRows.length - 1].ts) : "—";
    setStatus(
      t("statusResult")
        .replace("{count}", normalizedRows.length)
        .replace("{filtered}", filteredRows.length)
        .replace("{from}", firstDate)
        .replace("{to}", lastDate)
    );
}

function updateShowStatsForScope(rows) {
  cachedShowStats = showStats(rows);
  renderShowStatsTable(cachedShowStats);
  downloadCsvBtn.disabled = cachedShowStats.length === 0;
}

function renderShowStatsTable(statsRows) {
  showStatsBody.innerHTML = "";
  const thead = document.querySelector("#showStatsTable thead tr");
  if (thead) {
    thead.innerHTML = `
      <th>${t("showName")}</th>
      <th>${t("hoursPlayed")}</th>
      <th>${t("minutesPlayed")}</th>
      <th>${t("numStreams")}</th>
      <th>${t("avgMinutesPerStream")}</th>
    `;
  }

  for (const row of statsRows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.showName}</td>
      <td>${row.hoursPlayed}</td>
      <td>${row.minutesPlayed}</td>
      <td>${row.numStreams}</td>
      <td>${row.avgMinutesPerStream}</td>
    `;
    showStatsBody.append(tr);
  }
}

function renderAveragePerDayPerYear(rows) {
  const data = averageMinutesPerDayPerYear(rows);
  destroyChart("avgPerDayPerYearChart");
  charts.avgPerDayPerYearChart = new Chart(document.getElementById("avgPerDayPerYearChart"), {
    type: "bar",
    data: {
      labels: data.map((item) => item.year),
      datasets: [{
        label: "Avg minutes per day",
        data: data.map((item) => item.avgMinutesPerDay),
        backgroundColor: "rgba(112, 164, 120, 0.75)"
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

function renderHoursPerMonth(rows) {
  const data = hoursPerMonth(rows);
  destroyChart("hoursPerMonthChart");
  charts.hoursPerMonthChart = new Chart(document.getElementById("hoursPerMonthChart"), {
    type: "bar",
    data: {
      labels: data.map((item) => item.monthKey),
      datasets: [{
        label: "Hours",
        data: data.map((item) => item.hoursPlayed),
        backgroundColor: "rgba(16, 185, 129, 0.7)"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { x: { ticks: { maxRotation: 45, minRotation: 45 } } }
    }
  });
}

function renderAvgMinutesPerMonth(rows) {
  const data = averageMinutesPerDayPerMonth(rows);
  const labels = data.map((item) => item.monthKey);
  const base = data.map((item) => item.avgMinutesPerDay);
  const threshold30 = labels.map(() => 30);
  const threshold60 = labels.map(() => 60);
  const threshold120 = labels.map(() => 120);

  destroyChart("avgMinutesPerMonthChart");
  charts.avgMinutesPerMonthChart = new Chart(document.getElementById("avgMinutesPerMonthChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Avg minutes/day",
          data: base,
          backgroundColor: "rgba(245, 158, 11, 0.7)"
        },
        {
          type: "line",
          label: "30 minutes",
          data: threshold30,
          borderColor: "#16a34a",
          borderWidth: 1,
          pointRadius: 0
        },
        {
          type: "line",
          label: "60 minutes",
          data: threshold60,
          borderColor: "#ca8a04",
          borderWidth: 1,
          pointRadius: 0
        },
        {
          type: "line",
          label: "120 minutes",
          data: threshold120,
          borderColor: "#dc2626",
          borderWidth: 1,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { x: { ticks: { maxRotation: 45, minRotation: 45 } } }
    }
  });
}

function renderHourDistribution(rows) {
  const data = percentageDistributionPerHour(rows);
  destroyChart("hourDistributionChart");
  charts.hourDistributionChart = new Chart(document.getElementById("hourDistributionChart"), {
    type: "bar",
    data: {
      labels: data.map((item) => item.hour),
      datasets: [{
        label: "% of total stream time",
        data: data.map((item) => item.percentage),
        backgroundColor: "rgba(236, 72, 153, 0.7)"
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

function renderAvgMinutesPerHour(rows) {
  const data = avgMinutesPerHour(rows);
  destroyChart("avgMinutesPerHourChart");
  charts.avgMinutesPerHourChart = new Chart(document.getElementById("avgMinutesPerHourChart"), {
    type: "bar",
    data: {
      labels: data.map((item) => item.hour),
      datasets: [{
        label: t("avgMinutesPerHourLabel"),
        data: data.map((item) => item.avgMinutes),
        backgroundColor: "rgba(251, 146, 60, 0.7)"
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

function renderWeekdayBubbles(rows) {
  const points = minutesPerWeekdayBubbles(rows);
  destroyChart("weekdayBubbleChart");
  charts.weekdayBubbleChart = new Chart(document.getElementById("weekdayBubbleChart"), {
    type: "bubble",
    data: {
      datasets: [{
        label: "Streams",
        data: points,
        backgroundColor: "rgba(224, 170, 115, 0.45)",
        borderColor: "rgba(184, 132, 78, 0.9)"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "linear",
          min: 0,
          max: 6,
          ticks: {
            stepSize: 1,
            callback(value) {
              return weekdayLabels[value] ?? value;
            }
          }
        },
        y: { title: { display: true, text: "Minutes played" } }
      }
    }
  });
}

function renderHourBubbles(rows) {
  const points = minutesPerHourBubbles(rows);
  destroyChart("hourBubbleChart");
  charts.hourBubbleChart = new Chart(document.getElementById("hourBubbleChart"), {
    type: "bubble",
    data: {
      datasets: [{
        label: "Streams",
        data: points,
        backgroundColor: "rgba(20, 184, 166, 0.45)",
        borderColor: "rgba(20, 184, 166, 0.9)"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { type: "linear", min: 0, max: 23, ticks: { stepSize: 1 } },
        y: { title: { display: true, text: "Minutes played" } }
      }
    }
  });
}

function renderTopShows(rows, yearScope, monthScope) {
  const scopedRows = filterRowsByYearAndMonth(rows, yearScope, monthScope);
  const top = topShows(scopedRows, 10);

  destroyChart("topShowsChart");
  charts.topShowsChart = new Chart(document.getElementById("topShowsChart"), {
    type: "bar",
    data: {
      labels: top.map((item) => item.showName),
      datasets: [{
        label: "Hours",
        data: top.map((item) => item.hoursPlayed),
        backgroundColor: "rgba(95, 143, 106, 0.8)"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 } } }
    }
  });
}

function randomColor(index, alpha = 0.75) {
  const warmHues = [28, 38, 52, 76, 96, 122, 146, 164, 182, 206, 330];
  const hue = warmHues[index % warmHues.length];
  return `hsla(${hue}, 58%, 54%, ${alpha})`;
}

function renderStreamTimePerShow(rows, yearScope, monthScope) {
  const scopedRows = filterRowsByYearAndMonth(rows, yearScope, monthScope);
  const trend = streamTimePerShowByMonth(scopedRows, 10);

  destroyChart("streamTimePerShowChart");
  charts.streamTimePerShowChart = new Chart(document.getElementById("streamTimePerShowChart"), {
    type: "line",
    data: {
      labels: trend.months,
      datasets: trend.datasets.map((entry, index) => ({
        label: entry.showName,
        data: entry.data,
        borderColor: randomColor(index, 1),
        backgroundColor: randomColor(index, 0.2),
        fill: false,
        tension: 0.2
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { x: { ticks: { maxRotation: 45, minRotation: 45 } } }
    }
  });
}

function renderAllCharts(rows, yearScope, monthScope = "all") {
  updateChartHeadlinesForScope(yearScope, monthScope);
  const scopedRows = filterRowsByYearAndMonth(rows, yearScope, monthScope);
  renderAveragePerDayPerYear(scopedRows);
  renderHoursPerMonth(scopedRows);
  renderAvgMinutesPerMonth(scopedRows);
  renderHourDistribution(scopedRows);
  renderAvgMinutesPerHour(scopedRows);
  renderWeekdayBubbles(scopedRows);
  renderHourBubbles(scopedRows);
  updateShowStatsForScope(scopedRows);
  renderTopShows(rows, yearScope, monthScope);
  renderStreamTimePerShow(rows, yearScope, monthScope);
}

async function readJsonFile(file) {
  const text = await file.text();
  return JSON.parse(text);
}

function updateYearScopedCharts() {
  const yearScope = yearSelect.value || "all";
  const monthScope = monthSelect.value || "all";
  renderMonthSelect(yearScope, monthScope);
  applyShowFiltersAndRecalculate();
}

function downloadCsv() {
  const csv = toCsv(cachedShowStats);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "show_stats_sorted_by_minutes.csv";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function analyze() {
  try {
    const file = fileInput.files?.[0];
    if (!file) {
      setStatus(t("pleaseChooseFile"), true);
      return;
    }

    setStatus(t("readingFile"));
    const raw = await readJsonFile(file);
    normalizedRows = normalizeRows(raw);

    if (!normalizedRows.length) {
      setStatus(t("noValidRows"), true);
      return;
    }

    for (const id of chartSectionIds) {
      const el = document.getElementById(id);
      if (el) el.hidden = false;
    }
    selectedShowNames = new Set();
    showFilterSearch.value = "";
    showFilterCard.hidden = false;
    updateShowFilterOptionsForScope("all", "all", true);
    applyShowFiltersAndRecalculate();
  } catch (error) {
    setStatus(`${t("done")}: ${error.message}`, true);
  }
}

async function loadSampleData() {
  try {
    setStatus(t("loadingSampleData"));
    const resp = await fetch("sample_podcast_data.json");
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const raw = await resp.json();
    normalizedRows = normalizeRows(raw);

    if (!normalizedRows.length) {
      setStatus(t("noValidRows"), true);
      return;
    }

    for (const id of chartSectionIds) {
      const el = document.getElementById(id);
      if (el) el.hidden = false;
    }
    selectedShowNames = new Set();
    showFilterSearch.value = "";
    showFilterCard.hidden = false;
    updateShowFilterOptionsForScope("all", "all", true);
    applyShowFiltersAndRecalculate();
  } catch (error) {
    setStatus(`${t("sampleDataError")}: ${error.message}`, true);
  }
}

analyzeBtn.addEventListener("click", analyze);
sampleBtn.addEventListener("click", loadSampleData);
yearSelect.addEventListener("change", updateYearScopedCharts);
monthSelect.addEventListener("change", () => {
  updateYearScopedCharts();
});
downloadCsvBtn.addEventListener("click", downloadCsv);
showFilterSearch.addEventListener("input", renderShowFilterList);
selectAllShowsBtn.addEventListener("click", () => {
  selectedShowNames = new Set(allShowNames);
  renderShowFilterList();
  renderShowFilterSummary();
  applyShowFiltersAndRecalculate();
});
clearAllShowsBtn.addEventListener("click", () => {
  selectedShowNames = new Set();
  renderShowFilterList();
  renderShowFilterSummary();
  applyShowFiltersAndRecalculate();
});
hideInfoBtn.addEventListener("click", () => {
  infoCard.hidden = true;
});
hideWhyBtn.addEventListener("click", () => {
  whyCard.hidden = true;
});
langBtn.addEventListener("click", () => {
  const newLocale = getCurrentLocale() === "DE" ? "EN" : "DE";
  setLocale(newLocale);
  updateAllTextContent();
});

initLocale();
updateAllTextContent();

