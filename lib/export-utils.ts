export interface ExportData {
  sNo: number
  customerId: string
  customerName: string
  serialNumber: string
  devEui: string
  numberOfUnits: number
  receivedDate: string
}

export const generateCSVContent = (data: ExportData[], language = "en"): string => {
  const translations = {
    en: {
      companyName: "Lotus Pacific Technologies",
      latestReadings: "Latest Readings",
      generatedOn: "Generated on",
      sNo: "SNo",
      customerId: "Customer ID",
      customerName: "Customer Name",
      serialNumber: "Serial Number",
      devEui: "DevEui",
      numberOfUnits: "Number Of Units",
      receivedDate: "Received Date",
    },
    es: {
      companyName: "Lotus Pacific Technologies",
      latestReadings: "Últimas Lecturas",
      generatedOn: "Generado el",
      sNo: "No.",
      customerId: "ID Cliente",
      customerName: "Nombre Cliente",
      serialNumber: "Número Serie",
      devEui: "DevEui",
      numberOfUnits: "Número de Unidades",
      receivedDate: "Fecha Recibida",
    },
    fr: {
      companyName: "Lotus Pacific Technologies",
      latestReadings: "Dernières Lectures",
      generatedOn: "Généré le",
      sNo: "No.",
      customerId: "ID Client",
      customerName: "Nom Client",
      serialNumber: "Numéro Série",
      devEui: "DevEui",
      numberOfUnits: "Nombre d'Unités",
      receivedDate: "Date Reçue",
    },
    de: {
      companyName: "Lotus Pacific Technologies",
      latestReadings: "Neueste Messwerte",
      generatedOn: "Erstellt am",
      sNo: "Nr.",
      customerId: "Kunden-ID",
      customerName: "Kundenname",
      serialNumber: "Seriennummer",
      devEui: "DevEui",
      numberOfUnits: "Anzahl Einheiten",
      receivedDate: "Empfangsdatum",
    },
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  // Format timestamp like dd/MM/yyyy HH:mm:ss
  const now = new Date();
  const timestamp = now
    .toLocaleDateString("en-GB") + " " + now.toLocaleTimeString("en-GB");

  // Metadata section
  let csv = `${t.companyName}\n`;
  csv += `${t.latestReadings}\n`;
  csv += `${t.generatedOn}: ${timestamp}\n\n`; // blank line after metadata

  // Headers
  csv += `${t.sNo},${t.customerId},${t.customerName},${t.serialNumber},${t.devEui},${t.numberOfUnits},${t.receivedDate}\n`;

  // Data rows
  data.forEach((row) => {
    csv += `${row.sNo},${row.customerId},"${row.customerName}",${row.serialNumber},${row.devEui},${row.numberOfUnits},${row.receivedDate}\n`;
  });

  // Add UTF-8 BOM so Excel opens correctly
  return "\uFEFF" + csv;
};


export const generateJSONContent = (data: ExportData[], language = "en"): string => {
  const translations = {
    en: {
      companyName: "Lotus Pacific Technologies",
      latestReadings: "Latest Readings",
      generatedOn: "Generated on",
    },
    es: {
      companyName: "Lotus Pacific Technologies",
      latestReadings: "Últimas Lecturas",
      generatedOn: "Generado el",
    },
    fr: {
      companyName: "Lotus Pacific Technologies",
      latestReadings: "Dernières Lectures",
      generatedOn: "Généré le",
    },
    de: {
      companyName: "Lotus Pacific Technologies",
      latestReadings: "Neueste Messwerte",
      generatedOn: "Erstellt am",
    },
  }

  const t = translations[language as keyof typeof translations] || translations.en
  const timestamp = new Date().toISOString()

  return JSON.stringify(
    {
      metadata: {
        company: t.companyName,
        title: t.latestReadings,
        generatedOn: timestamp,
        language: language,
        totalRecords: data.length,
      },
      data: data,
    },
    null,
    2,
  )
}

export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Sample data for demonstration
export const sampleExportData: ExportData[] = [
  {
    sNo: 1,
    customerId: "3012663",
    customerName: "Trường Đình Xuân",
    serialNumber: "250815000014",
    devEui: "250815000014",
    numberOfUnits: 2.565,
    receivedDate: "28/8/2025 12:39:45",
  },
  {
    sNo: 2,
    customerId: "3012653",
    customerName: "Minh Phạm Thị Hồng",
    serialNumber: "250815000002",
    devEui: "250815000002",
    numberOfUnits: 26.134,
    receivedDate: "28/8/2025 12:39:43",
  },
  {
    sNo: 3,
    customerId: "3012682",
    customerName: "Quang Cty CPDT Đăng",
    serialNumber: "250815000034",
    devEui: "250815000034",
    numberOfUnits: 3.116,
    receivedDate: "28/8/2025 12:39:41",
  },
  {
    sNo: 4,
    customerId: "3012660",
    customerName: "Hưng Đỗ Ngọc",
    serialNumber: "250815000009",
    devEui: "250815000009",
    numberOfUnits: 3.179,
    receivedDate: "28/8/2025 12:39:41",
  },
  {
    sNo: 5,
    customerId: "3012699",
    customerName: "Huy Bùi Quang",
    serialNumber: "250815000019",
    devEui: "250815000019",
    numberOfUnits: 25.782,
    receivedDate: "28/8/2025 12:39:40",
  },
]
