const AU_STATES =
  "QLD|Queensland|NSW|New South Wales|VIC|Victoria|SA|South Australia|WA|Western Australia|TAS|Tasmania|ACT|NT";

const STREET_WORD =
  /\b(rd|road|st|street|ave|avenue|drive|dr|way|blvd|boulevard|parade|pde|court|ct|lane|ln|crescent|cres|highway|hwy|terrace|tce|shop|unit|suite|level|lot)\b/i;

function titleCaseSuburb(name) {
  return String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Derive display suburb from full address stored in DB (or legacy suburb-only text).
 * @param {string} storedAddress
 * @returns {string}
 */
function extractSuburbLabel(storedAddress) {
  const t = String(storedAddress ?? "").trim();
  if (!t) return "";

  const parts = t.split(",").map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    const m = part.match(
      new RegExp(
        `^([A-Za-z][A-Za-z\\s'\\-]+?)\\s+(?:${AU_STATES})\\s+(\\d{4})\\b`,
        "i",
      ),
    );
    if (m) {
      const name = m[1].trim();
      if (name && !STREET_WORD.test(name)) {
        return titleCaseSuburb(name);
      }
    }
  }

  const matches = [
    ...t.matchAll(
      new RegExp(
        `\\b([A-Za-z][A-Za-z\\s'\\-]+?)\\s+(?:${AU_STATES})\\s+(\\d{4})\\b`,
        "gi",
      ),
    ),
  ];
  for (const m of matches) {
    const name = m[1].trim();
    if (name && !STREET_WORD.test(name)) {
      return titleCaseSuburb(name);
    }
  }

  if (!/,/.test(t) && !STREET_WORD.test(t) && t.length <= 40) {
    return titleCaseSuburb(t.replace(/\s+(QLD|Queensland)\s*$/i, "").trim());
  }

  return titleCaseSuburb(parts[0] || t);
}

module.exports = {
  extractSuburbLabel,
  titleCaseSuburb,
};
