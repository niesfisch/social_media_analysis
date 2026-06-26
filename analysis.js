const REQUIRED_KEYS = ["endTime", "podcastName", "episodeName", "msPlayed"];

function parseEndTime(value) {
  if (typeof value !== "string") return null;
  const [datePart, timePart] = value.trim().split(" ");
  if (!datePart || !timePart) return null;
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  if ([year, month, day, hour, minute].some((part) => Number.isNaN(part))) return null;
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function getMonthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getWeekdayMon0(date) {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

function daysInMonthFromKey(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

function daysInYear(year) {
  return new Date(year, 1, 29).getMonth() === 1 ? 366 : 365;
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function groupSum(rows, keyFn, valueFn) {
  const map = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    const nextValue = (map.get(key) ?? 0) + valueFn(row);
    map.set(key, nextValue);
  }
  return map;
}

function normalizeRows(rawRows) {
  if (!Array.isArray(rawRows)) {
    throw new Error("JSON payload must be an array of records.");
  }

  const rows = [];
  for (const item of rawRows) {
    const missing = REQUIRED_KEYS.filter((key) => !(key in item));
    if (missing.length) {
      throw new Error(`Record is missing required keys: ${missing.join(", ")}`);
    }

    const ts = parseEndTime(item.endTime);
    const msPlayed = Number(item.msPlayed);
    const showName = String(item.podcastName ?? "").trim();
    const episodeName = String(item.episodeName ?? "").trim();

    if (!ts || Number.isNaN(msPlayed) || !showName || !episodeName) {
      continue;
    }

    rows.push({
      ts,
      showName,
      episodeName,
      msPlayed,
      minutesPlayed: Math.round(msPlayed / 1000 / 60),
      hoursPlayed: round(msPlayed / 1000 / 60 / 60, 2),
      year: ts.getFullYear(),
      monthKey: getMonthKey(ts),
      hour: ts.getHours(),
      weekdayMon0: getWeekdayMon0(ts)
    });
  }

  rows.sort((a, b) => a.ts - b.ts);
  return rows;
}

function computeOverview(rows) {
  const totalMs = rows.reduce((sum, row) => sum + row.msPlayed, 0);
  const years = [...new Set(rows.map((row) => row.year))].sort((a, b) => a - b);
  const shows = new Set(rows.map((row) => row.showName));
  return {
    streams: rows.length,
    totalHours: round(totalMs / 1000 / 60 / 60, 2),
    totalMinutes: round(totalMs / 1000 / 60, 2),
    years,
    showCount: shows.size
  };
}

function averageMinutesPerDayPerYear(rows) {
  const byYear = groupSum(rows, (row) => row.year, (row) => row.msPlayed);
  const years = [...byYear.keys()].sort((a, b) => a - b);
  return years.map((year) => ({
    year,
    avgMinutesPerDay: round((byYear.get(year) / 1000 / 60) / daysInYear(year), 2)
  }));
}

function hoursPerMonth(rows) {
  const byMonth = groupSum(rows, (row) => row.monthKey, (row) => row.msPlayed);
  const months = [...byMonth.keys()].sort();
  return months.map((monthKey) => ({
    monthKey,
    hoursPlayed: round(byMonth.get(monthKey) / 1000 / 60 / 60, 2)
  }));
}

function averageMinutesPerDayPerMonth(rows) {
  const byMonth = groupSum(rows, (row) => row.monthKey, (row) => row.msPlayed);
  const months = [...byMonth.keys()].sort();
  return months.map((monthKey) => {
    const days = daysInMonthFromKey(monthKey);
    const avg = (byMonth.get(monthKey) / 1000 / 60) / days;
    return { monthKey, avgMinutesPerDay: round(avg, 2) };
  });
}

function percentageDistributionPerHour(rows) {
  const byHour = groupSum(rows, (row) => row.hour, (row) => row.msPlayed);
  const total = rows.reduce((sum, row) => sum + row.msPlayed, 0);
  const result = [];
  for (let hour = 0; hour < 24; hour += 1) {
    const ms = byHour.get(hour) ?? 0;
    result.push({ hour, percentage: total ? round((ms / total) * 100, 2) : 0 });
  }
  return result;
}

function avgMinutesPerHour(rows) {
  // Count how many distinct days each hour appears in, then compute avg minutes per such day.
  const msByHour = new Map();
  const daysByHour = new Map();
  for (const row of rows) {
    const dayKey = `${row.year}-${row.monthKey}-${row.ts.getDate()}`;
    msByHour.set(row.hour, (msByHour.get(row.hour) ?? 0) + row.msPlayed);
    if (!daysByHour.has(row.hour)) daysByHour.set(row.hour, new Set());
    daysByHour.get(row.hour).add(dayKey);
  }
  const result = [];
  for (let hour = 0; hour < 24; hour += 1) {
    const ms = msByHour.get(hour) ?? 0;
    const days = daysByHour.get(hour)?.size ?? 1;
    result.push({ hour, avgMinutes: round((ms / 1000 / 60) / days, 2) });
  }
  return result;
}

function minutesPerWeekdayBubbles(rows) {
  const counts = new Map();
  for (const row of rows) {
    const key = `${row.weekdayMon0}|${row.minutesPlayed}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const points = [];
  for (const [key, count] of counts.entries()) {
    const [weekday, minutes] = key.split("|").map(Number);
    points.push({ x: weekday, y: minutes, count, r: Math.max(2, Math.sqrt(count) * 2) });
  }
  return points;
}

function minutesPerHourBubbles(rows) {
  const counts = new Map();
  for (const row of rows) {
    const key = `${row.hour}|${row.minutesPlayed}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const points = [];
  for (const [key, count] of counts.entries()) {
    const [hour, minutes] = key.split("|").map(Number);
    points.push({ x: hour, y: minutes, count, r: Math.max(2, Math.sqrt(count) * 2) });
  }
  return points;
}

function filterRowsByYear(rows, year) {
  if (year === "all") return rows;
  return rows.filter((row) => row.year === Number(year));
}

function filterRowsByYearAndMonth(rows, year, month) {
  let result = filterRowsByYear(rows, year);
  if (month !== "all") {
    result = result.filter((row) => row.monthKey === month);
  }
  return result;
}

function topShows(rows, limit = 10) {
  const byShow = groupSum(rows, (row) => row.showName, (row) => row.msPlayed);
  return [...byShow.entries()]
    .map(([showName, msPlayed]) => ({
      showName,
      msPlayed,
      hoursPlayed: round(msPlayed / 1000 / 60 / 60, 2)
    }))
    .sort((a, b) => b.msPlayed - a.msPlayed)
    .slice(0, limit);
}

function streamTimePerShowByMonth(rows, limit = 10) {
  const top = topShows(rows, limit).map((entry) => entry.showName);
  const months = [...new Set(rows.map((row) => row.monthKey))].sort();
  const datasets = top.map((showName) => {
    const showRows = rows.filter((row) => row.showName === showName);
    const byMonth = groupSum(showRows, (row) => row.monthKey, (row) => row.msPlayed);
    const data = months.map((monthKey) => round((byMonth.get(monthKey) ?? 0) / 1000 / 60 / 60, 2));
    return { showName, data };
  });
  return { months, datasets };
}

function showStats(rows) {
  const byShow = new Map();
  for (const row of rows) {
    const current = byShow.get(row.showName) ?? {
      showName: row.showName,
      totalMs: 0,
      numStreams: 0
    };
    current.totalMs += row.msPlayed;
    current.numStreams += 1;
    byShow.set(row.showName, current);
  }

  return [...byShow.values()]
    .map((entry) => {
      const minutesPlayed = entry.totalMs / 1000 / 60;
      const hoursPlayed = entry.totalMs / 1000 / 60 / 60;
      return {
        showName: entry.showName,
        hoursPlayed: round(hoursPlayed, 2),
        minutesPlayed: round(minutesPlayed, 2),
        numStreams: entry.numStreams,
        avgMinutesPerStream: round(minutesPlayed / entry.numStreams, 2)
      };
    })
    .sort((a, b) => b.minutesPlayed - a.minutesPlayed);
}

function toCsv(statsRows) {
  const header = ["show_name", "hours_played", "minutes_played", "num_streams", "avg_minutes_per_stream"];
  const lines = [header.join(";")];
  for (const row of statsRows) {
    const escaped = String(row.showName).replaceAll("\"", "\"\"");
    lines.push([
      `"${escaped}"`,
      row.hoursPlayed,
      row.minutesPlayed,
      row.numStreams,
      row.avgMinutesPerStream
    ].join(";"));
  }
  return `${lines.join("\n")}\n`;
}

export {
  normalizeRows,
  computeOverview,
  averageMinutesPerDayPerYear,
  hoursPerMonth,
  averageMinutesPerDayPerMonth,
  percentageDistributionPerHour,
  avgMinutesPerHour,
  minutesPerWeekdayBubbles,
  minutesPerHourBubbles,
  filterRowsByYear,
  filterRowsByYearAndMonth,
  topShows,
  streamTimePerShowByMonth,
  showStats,
  toCsv
};

