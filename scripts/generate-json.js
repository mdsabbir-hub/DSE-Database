/**
 * generate-json.js
 *
 * Takes ./tmp-data/raw.json (output of numbers-parser.py) and writes the
 * final, app-facing files into /data.
 *
 * Strategy:
 *  - Only CORE DATA sheets are synced (see EXCLUDED_SLUGS below). Dashboards,
 *    calculators, and reports are computed live in the app from core data
 *    instead of being synced as stale static files.
 *  - Each core sheet becomes a folder under /data (slugified sheet name).
 *  - Inside that folder:
 *      - all.json           -> full list, all fields (for search/filtering)
 *      - records/<key>.json -> one file per row, keyed by a primary key
 *                              (single column, e.g. Symbol) OR a composite
 *                              key (e.g. Symbol + Date) when a single column
 *                              isn't unique on its own - enables fast
 *                              single-record fetches without loading the
 *                              whole sheet.
 *  - A top-level /data/manifest.json lists every dataset + row counts, so the
 *    frontend can discover what's available without hardcoding sheet names.
 *
 * Usage: node scripts/generate-json.js
 */

import fs from "fs";
import path from "path";

const RAW_INPUT = "./tmp-data/raw.json";
const DATA_DIR = "./data";

// Dashboards / calculators / reports - computed live in the app from the
// core tables below instead of being synced as static (and quickly stale)
// JSON. Add/remove slugs here as the workbook evolves.
const EXCLUDED_SLUGS = [
  "01-dashboard",
  "08-performance",
  "09-allocation",
  "10-roi-calculator",
  "11-sip-calculator",
  "12-break-even-calculator",
  "13-reports",
  "14-settings",
  "15-formula-engine",
];

// Per-sheet key configuration. A single column name = simple key
// (e.g. Symbol, unique per row). An array = composite key, used when no
// single column is unique on its own (e.g. Transactions has many rows per
// Symbol, so we key on Symbol + Date instead).
// Sheets not listed here fall back to auto-detection via KEY_CANDIDATES.
const SHEET_KEY_CONFIG = {
  "02-portfolio": "Symbol",
  "03-transactions": ["Symbol", "Date"],
  "04-database": "Symbol",
  "05-watchlist": "Symbol",
  "06-dividend-tracker": ["Symbol", "Payment Date"],
  "07-cash-ledger": null, // no natural key -> all.json only
  "16-lookup-tables": null, // parallel reference columns, not row records
};

// Fallback for any sheet not covered by SHEET_KEY_CONFIG above.
const KEY_CANDIDATES = ["id", "ID", "symbol", "Symbol", "ticker", "Ticker", "code", "Code"];

function log(msg) {
  console.log(`[generate-json] ${msg}`);
}

function fail(msg) {
  console.error(`[generate-json] ERROR: ${msg}`);
  process.exit(1);
}

function slugify(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function resolveKeyColumns(slug, columns) {
  if (Object.prototype.hasOwnProperty.call(SHEET_KEY_CONFIG, slug)) {
    const configured = SHEET_KEY_CONFIG[slug];
    if (configured === null) return null;
    return Array.isArray(configured) ? configured : [configured];
  }
  const fallback = KEY_CANDIDATES.find((c) => columns.includes(c));
  return fallback ? [fallback] : null;
}

function buildFileKey(row, keyColumns) {
  const parts = keyColumns.map((col) => {
    const val = row[col];
    if (val === null || val === undefined) return null;
    return slugify(String(val));
  });
  if (parts.some((p) => p === null || p === "")) return null;
  return parts.join("_");
}

function ensureCleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function main() {
  if (!fs.existsSync(RAW_INPUT)) {
    fail(`${RAW_INPUT} not found. Run "npm run parse" first.`);
  }

  const raw = JSON.parse(fs.readFileSync(RAW_INPUT, "utf-8"));
  ensureCleanDir(DATA_DIR);

  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceFile: raw.sourceFile,
    excludedSheets: EXCLUDED_SLUGS,
    datasets: [],
  };

  for (const [sheetName, sheet] of Object.entries(raw.sheets)) {
    const slug = slugify(sheetName);

    if (EXCLUDED_SLUGS.includes(slug)) {
      log(`"${sheetName}": skipped (computed in-app, not synced as data)`);
      continue;
    }

    const sheetDir = path.join(DATA_DIR, slug);
    fs.mkdirSync(sheetDir, { recursive: true });

    const keyColumns = resolveKeyColumns(slug, sheet.columns);

    // For keyed sheets, drop "ghost" template rows: rows where the key
    // column(s) are blank but other columns still hold formula-cached
    // values (e.g. Market Value = 0). These are leftover template rows,
    // not real records, and would otherwise pollute both all.json and the
    // per-record files.
    let usableRows = sheet.rows;
    let ghostRows = 0;
    if (keyColumns) {
      usableRows = sheet.rows.filter((row) => buildFileKey(row, keyColumns) !== null);
      ghostRows = sheet.rows.length - usableRows.length;
    }

    // Full list, all fields (ghost rows excluded for keyed sheets)
    fs.writeFileSync(
      path.join(sheetDir, "all.json"),
      JSON.stringify(usableRows, null, 2)
    );

    if (keyColumns) {
      const recordsDir = path.join(sheetDir, "records");
      fs.mkdirSync(recordsDir, { recursive: true });

      let written = 0;
      let duplicates = 0;
      const seenKeys = new Set();

      for (const row of usableRows) {
        const fileKey = buildFileKey(row, keyColumns);
        if (seenKeys.has(fileKey)) {
          duplicates++;
          continue;
        }
        seenKeys.add(fileKey);
        fs.writeFileSync(
          path.join(recordsDir, `${fileKey}.json`),
          JSON.stringify(row, null, 2)
        );
        written++;
      }

      const keyLabel = keyColumns.join(" + ");
      let msg = `"${sheetName}": ${written} per-record files written (key: ${keyLabel})`;
      if (duplicates) msg += `, ${duplicates} duplicate keys skipped (⚠ check if the key is really unique)`;
      if (ghostRows) msg += `, ${ghostRows} blank template rows dropped`;
      log(msg);
    } else {
      log(`"${sheetName}": no per-record key configured - only all.json written`);
    }

    manifest.datasets.push({
      name: sheetName,
      slug,
      rowCount: usableRows.length,
      skippedRows: sheet.skippedRows + ghostRows,
      columns: sheet.columns,
      keyColumns,
      hasPerRecordFiles: Boolean(keyColumns),
    });
  }

  fs.writeFileSync(
    path.join(DATA_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  log(`Manifest written with ${manifest.datasets.length} dataset(s) (${EXCLUDED_SLUGS.length} excluded).`);
  log("Done. Run \"npm run validate\" next.");
}

main();
