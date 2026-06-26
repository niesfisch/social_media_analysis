import {
  normalizeRows,
  computeOverview,
  topShows,
  averageMinutesPerDayPerYear,
  toCsv
} from "./analysis.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const sample = [
  {
    endTime: "2025-06-23 05:36",
    podcastName: "Show A",
    episodeName: "Episode 1",
    msPlayed: 600000
  },
  {
    endTime: "2025-06-23 06:30",
    podcastName: "Show A",
    episodeName: "Episode 2",
    msPlayed: 1200000
  },
  {
    endTime: "2024-01-03 12:15",
    podcastName: "Show B",
    episodeName: "Episode X",
    msPlayed: 300000
  }
];

const rows = normalizeRows(sample);
assert(rows.length === 3, "Expected 3 normalized rows");

const overview = computeOverview(rows);
assert(overview.streams === 3, "Overview stream count mismatch");
assert(overview.showCount === 2, "Overview show count mismatch");

const top = topShows(rows, 10);
assert(top[0].showName === "Show A", "Top show should be Show A");

const yearly = averageMinutesPerDayPerYear(rows);
assert(yearly.length === 2, "Expected two years in yearly averages");

const csv = toCsv(top.map((entry) => ({
  showName: entry.showName,
  hoursPlayed: entry.hoursPlayed,
  minutesPlayed: Math.round(entry.msPlayed / 1000 / 60 * 100) / 100,
  numStreams: 1,
  avgMinutesPerStream: 1
})));
assert(csv.includes("show_name"), "CSV header missing");

console.log("selftest passed");

