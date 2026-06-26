# Spotify Web Analyzer

A small browser-based analysis tool for Spotify podcast history JSON files.

## How it works

1. Upload a `StreamingHistory_podcast_0.json` file exported from your Spotify account.
2. The tool parses and validates the JSON, then generates aggregated statistics.
3. You can:
   - View overview metrics (streams, total hours, shows, year range).
   - Filter shows by name; all charts and tables recalculate live.
   - Scope top-10 show charts to a specific year.
   - Download show statistics as CSV.

All analysis happens in your browser. No data is sent to any server.

## Language support

The tool supports both **German (DE)** and **English (EN)** languages.
- German is the default language.
- Click the language button in the top-right corner to toggle between DE and EN.
- Selected language is saved in your browser's local storage.

## How to download your Spotify data

1. Open [Spotify Settings](https://www.spotify.com/account/) in your browser.
2. Go to <strong>Privacy</strong> section.
3. Click <strong>"Download your data"</strong> or <strong>"Request my personal data"</strong>.
4. Select <strong>"Extended Streaming History"</strong> (or <strong>"Download your extended streaming history"</strong>) if prompted. This includes podcast episode data.
5. Follow the link/instructions Spotify sends you (usually via email within a day or two).
6. Download the ZIP file Spotify provides.
7. Extract the ZIP.
8. Navigate to the folder `Spotify Account Data/`.
9. Copy the file `StreamingHistory_podcast_0.json` (or any `StreamingHistory_podcast_*.json` file).
10. Upload it into this analyzer using the file picker.

**Note:** Spotify may take a day or two to prepare your data export. The download link is temporary, so save it somewhere safe.

## What it supports

- Input format: `StreamingHistory_podcast_0.json` (new Spotify account data export)
- Required keys per record:
  - `endTime`
  - `podcastName`
  - `episodeName`
  - `msPlayed`

## Generated charts

- Average minutes per day per year
- Hours per month
- Average minutes per day per month
- Percentage distribution per hour
- Minutes per weekday (bubble)
- Minutes per hour (bubble)
- Top 10 shows in selected year
- Stream time per show by month (Top 10 in selected year)
- Show stats table + CSV download
- Show filter panel (select/unselect shows by name with live recalculation)

## Quick start

Run from this folder and open the shown URL in a browser.

```bash
python3 -m http.server 8000
```

Then open:

- `http://localhost:8000`

## Build (minified production version)

Requires [Node.js](https://nodejs.org/) (the project uses `esbuild` via `npx`).

```bash
npm run build
```

Output goes to `dist/` — three self-contained HTML files with inlined CSS and JS.

## Deploy (build + SFTP upload)

Builds the project and uploads all release files to the remote server.

Reads `FTP_HOST`, `FTP_USER`, and `FTP_PASSWORD` from `~/.env`:

```
FTP_HOST=your-server.com
FTP_USER=your_username
FTP_PASSWORD=your_password
```

```bash
npm run all
```

## Optional self test

```bash
node ./selftest.mjs
```

