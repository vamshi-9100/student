import * as XLSX from "xlsx"

export interface ExportData {
  id: number | string
  dateTime: string
  temperature: string | number
  humidity: string | number
  battery: string | number
  pm25: string | number
  pm10: string | number
  pressure: string | number
  co2: string | number
  tvoc: string | number
  hcho: string | number
  pir: string
  light: string | number
  leakage: string | number
}

export interface ExportOptions {
  companyName?: string
  title?: string
  timestamp?: string
  language?: string
  totalCount?: number
}

export function generateFormattedExcel(data: ExportData[], options: ExportOptions = {}): XLSX.WorkBook {
  const {
    companyName = "Drop By Drop",
    title = "Latest Readings",
    // Use US 12-hour format to match example: 12/2/2025, 6:14:00 PM
    timestamp = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    }),
    totalCount,
  } = options

  // Create a new workbook
  const wb = XLSX.utils.book_new()

  // Create worksheet data
  const wsData: any[][] = []

  // Calculate number of columns (14 columns: ID, Date & Time, Temperature, Humidity, Battery, PM2.5, PM10, Pressure, CO2, TVOC, HCHO, PIR, Light, Leakage)
  const numCols = 14

  // Row 1: Company Name (merged across columns)
  wsData.push(Array(numCols).fill(""))
  wsData[0][0] = companyName

  // Row 2: Empty
  wsData.push(Array(numCols).fill(""))

  // Row 3: Title (centered, column D)
  wsData.push(Array(numCols).fill(""))
  wsData[2][3] = title

  // Row 4: Timestamp (centered, column D)
  wsData.push(Array(numCols).fill(""))
  wsData[3][3] = timestamp

  // Row 5: Empty
  wsData.push(Array(numCols).fill(""))

  // Row 6: Section Header "Readings"
  wsData.push(Array(numCols).fill(""))
  wsData[5][0] = "Readings"

  // Row 7: Section Subheader "Latest Readings"
  wsData.push(Array(numCols).fill(""))
  wsData[6][0] = "Latest Readings"

  // Row 8: Total readings info (if available)
  wsData.push(Array(numCols).fill(""))
  wsData[7][0] = `Total Readings: ${totalCount ?? data.length}`

  // Row 9: Table Headers (matching UI table exactly)
  wsData.push([
    "ID",
    "Date & Time",
    "Temperature",
    "Humidity",
    "Battery",
    "PM2.5",
    "PM10",
    "Pressure",
    "CO2",
    "TVOC",
    "HCHO",
    "PIR",
    "Light",
    "Leakage",
  ])

  // Rows 10+: Data (matching UI table exactly)
  data.forEach((row) => {
    wsData.push([
      row.id,
      row.dateTime,
      row.temperature ?? "-",
      row.humidity ?? "-",
      row.battery ?? "-",
      row.pm25 ?? "-",
      row.pm10 ?? "-",
      row.pressure ?? "-",
      row.co2 ?? "-",
      row.tvoc ?? "-",
      row.hcho ?? "-",
      row.pir ?? "-",
      row.light ?? "-",
      row.leakage ?? "-",
    ])
  })

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Set column widths (matching UI table columns)
  ws["!cols"] = [
    { wch: 10 }, // ID
    { wch: 20 }, // Date & Time
    { wch: 15 }, // Temperature
    { wch: 12 }, // Humidity
    { wch: 12 }, // Battery
    { wch: 12 }, // PM2.5
    { wch: 12 }, // PM10
    { wch: 12 }, // Pressure
    { wch: 12 }, // CO2
    { wch: 12 }, // TVOC
    { wch: 12 }, // HCHO
    { wch: 12 }, // PIR
    { wch: 12 }, // Light
    { wch: 12 }, // Leakage
  ]

  // Merge cells for company name (A1:N1)
  if (!ws["!merges"]) ws["!merges"] = []
  ws["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } })

  // Merge cells for title (D3)
  ws["!merges"].push({ s: { r: 2, c: 3 }, e: { r: 2, c: 3 } })

  // Merge cells for timestamp (D4)
  ws["!merges"].push({ s: { r: 3, c: 3 }, e: { r: 3, c: 3 } })

  // Style the company name (A1)
  if (!ws["A1"]) ws["A1"] = { t: "s", v: companyName }
  ws["A1"].s = {
    font: { name: "Calibri", sz: 18, bold: true, color: { rgb: "4472C4" } },
    alignment: { horizontal: "left", vertical: "center" },
  }

  // Style the title (D3)
  if (!ws["D3"]) ws["D3"] = { t: "s", v: title }
  ws["D3"].s = {
    font: { name: "Calibri", sz: 16, bold: true },
    alignment: { horizontal: "center", vertical: "center" },
  }

  // Style the timestamp (D4)
  if (!ws["D4"]) ws["D4"] = { t: "s", v: timestamp }
  ws["D4"].s = {
    font: { name: "Calibri", sz: 12 },
    alignment: { horizontal: "center", vertical: "center" },
  }

  // Style "Readings" header (A6)
  if (!ws["A6"]) ws["A6"] = { t: "s", v: "Readings" }
  ws["A6"].s = {
    font: { name: "Calibri", sz: 11, bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "5B9BD5" } },
    alignment: { horizontal: "left", vertical: "center" },
  }

  // Style "Latest Readings" subheader (A7)
  if (!ws["A7"]) ws["A7"] = { t: "s", v: "Latest Readings" }
  ws["A7"].s = {
    font: { name: "Calibri", sz: 11 },
    alignment: { horizontal: "left", vertical: "center" },
  }

  // Style table headers (row 9) - all 14 columns
  const headerCols = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"]
  headerCols.forEach((col) => {
    const cell = `${col}9`
    if (ws[cell]) {
      ws[cell].s = {
        font: { name: "Calibri", sz: 11, bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "5B9BD5" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      }
    }
  })

  // Style data rows (starting from row 10)
  const dataStartRow = 10
  for (let i = 0; i < data.length; i++) {
    const rowNum = dataStartRow + i
    headerCols.forEach((col) => {
      const cell = `${col}${rowNum}`
      if (ws[cell]) {
        ws[cell].s = {
          font: { name: "Calibri", sz: 11 },
          alignment: { horizontal: "left", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "D9D9D9" } },
            bottom: { style: "thin", color: { rgb: "D9D9D9" } },
            left: { style: "thin", color: { rgb: "D9D9D9" } },
            right: { style: "thin", color: { rgb: "D9D9D9" } },
          },
        }
      }
    })

    // Alternate row colors
    if (i % 2 === 0) {
      headerCols.forEach((col) => {
        const cell = `${col}${rowNum}`
        if (ws[cell] && ws[cell].s) {
          ws[cell].s.fill = { fgColor: { rgb: "F2F2F2" } }
        }
      })
    }
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Sensor Readings")

  return wb
}

export function downloadExcel(workbook: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(workbook, filename)
}

export function formatTimestamp(date: Date = new Date()): string {
  return date
    .toLocaleString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    })
    // Safe filename fragment: remove slashes/colons and replace comma+space
    .replace(/\//g, "-")
    .replace(/:/g, "-")
    .replace(/, /g, "_")
}
