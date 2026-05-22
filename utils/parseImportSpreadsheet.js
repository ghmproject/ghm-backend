const { Readable } = require("stream");
const csv = require("csv-parser");
const XLSX = require("xlsx");

const REQUIRED_CSV_COLUMNS = [
  "restaurantName",
  "suburb",
  "dishName",
  "cuisine",
  "price",
  "image",
];

const CSV_HEADER_ALIASES = {
  restaurantname: "restaurantName",
  restaurantn: "restaurantName",
  restaurant: "restaurantName",
  name: "restaurantName",
  suburb: "suburb",
  suburbs: "suburb",
  address: "suburb",
  location: "suburb",
  dishname: "dishName",
  dish: "dishName",
  meal: "dishName",
  cuisine: "cuisine",
  type: "cuisine",
  price: "price",
  cost: "price",
  image: "image",
  imageurl: "image",
  photo: "image",
  picture: "image",
};

const stripBom = (value) =>
  typeof value === "string"
    ? value.replace(/^\uFEFF/, "").trim()
    : value;

const canonicalizeCsvHeader = (header) => {
  const raw = stripBom(String(header ?? ""));
  if (!raw) {
    return "";
  }

  const compact = raw.toLowerCase().replace(/[\s_-]+/g, "");

  return CSV_HEADER_ALIASES[compact] || raw;
};

/** Modern Excel .xlsx (ZIP / OOXML). */
const isXlsxBuffer = (buffer) =>
  Buffer.isBuffer(buffer) &&
  buffer.length >= 4 &&
  buffer[0] === 0x50 &&
  buffer[1] === 0x4b &&
  buffer[2] === 0x03 &&
  buffer[3] === 0x04;

/** Legacy Excel .xls (OLE compound document). */
const isXlsBuffer = (buffer) =>
  Buffer.isBuffer(buffer) &&
  buffer.length >= 8 &&
  buffer[0] === 0xd0 &&
  buffer[1] === 0xcf &&
  buffer[2] === 0x11 &&
  buffer[3] === 0xe0;

const isExcelBuffer = (buffer) => isXlsxBuffer(buffer) || isXlsBuffer(buffer);

const detectCsvSeparator = (buffer) => {
  const firstLine =
    buffer
      .toString("utf8")
      .split(/\r?\n/)
      .find((line) => line.trim().length > 0) ?? "";

  const commas = (firstLine.match(/,/g) || []).length;
  const semicolons = (firstLine.match(/;/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;

  if (tabs > commas && tabs > semicolons) {
    return "\t";
  }

  return semicolons > commas ? ";" : ",";
};

const normalizeCsvKeys = (row) => {
  const normalized = {};

  for (const [key, value] of Object.entries(row)) {
    const cleanKey = canonicalizeCsvHeader(key);

    if (!cleanKey) {
      continue;
    }

    const rawValue =
      value === undefined || value === null ? "" : value;

    normalized[cleanKey] =
      typeof rawValue === "string"
        ? rawValue.trim()
        : String(rawValue).trim();
  }

  return normalized;
};

const parseCsvBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    const separator = detectCsvSeparator(buffer);
    const rows = [];

    Readable.from(buffer)
      .pipe(
        csv({
          separator,
          mapHeaders: ({ header }) => canonicalizeCsvHeader(header),
        }),
      )
      .on("data", (row) => rows.push(normalizeCsvKeys(row)))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });

const parseExcelBuffer = (buffer) => {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    return [];
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
    raw: false,
  });

  return rawRows
    .map((row) => normalizeCsvKeys(row))
    .filter((row) => Object.keys(row).length > 0);
};

const parseImportSpreadsheet = async (buffer) => {
  if (isExcelBuffer(buffer)) {
    return parseExcelBuffer(buffer);
  }

  return parseCsvBuffer(buffer);
};

const getCsvHeaderReport = (rows) => {
  if (!rows.length) {
    return { ok: false, headers: [], missing: [...REQUIRED_CSV_COLUMNS] };
  }

  const headers = Object.keys(rows[0]);
  const missing = REQUIRED_CSV_COLUMNS.filter(
    (column) => !headers.includes(column),
  );

  return {
    ok: missing.length === 0,
    headers,
    missing,
  };
};

const normalizeImportRow = (row) => {
  const clean = normalizeCsvKeys(row);

  const restaurantName = clean.restaurantName;
  const address = clean.suburb;
  const dishName = clean.dishName;
  const cuisine = clean.cuisine || null;
  const price = Number(clean.price);
  const image = clean.image || null;

  if (!restaurantName || !address || !dishName || !cuisine) {
    return null;
  }

  if (Number.isNaN(price) || price < 0) {
    return null;
  }

  return {
    restaurantName,
    address,
    dishName,
    cuisine,
    price,
    image,
  };
};

const escapeCsvCell = (value) => {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

const buildCsvExportBuffer = (rows) => {
  const lines = [
    REQUIRED_CSV_COLUMNS.join(","),
    ...rows.map((row) =>
      [
        row.restaurantName,
        row.suburb,
        row.dishName,
        row.cuisine,
        row.price,
        row.image,
      ]
        .map(escapeCsvCell)
        .join(","),
    ),
  ];
  return Buffer.from(`${lines.join("\n")}\n`, "utf8");
};

module.exports = {
  REQUIRED_CSV_COLUMNS,
  isExcelBuffer,
  parseImportSpreadsheet,
  getCsvHeaderReport,
  normalizeImportRow,
  buildCsvExportBuffer,
};
