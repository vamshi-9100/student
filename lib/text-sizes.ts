// Global text size configuration
export const textSizes = {
  // Headings
  h1: "text-2xl sm:text-3xl lg:text-4xl",
  h2: "text-xl sm:text-2xl lg:text-3xl",
  h3: "text-lg sm:text-xl lg:text-2xl",
  h4: "text-base sm:text-lg lg:text-xl",
  h5: "text-sm sm:text-base lg:text-lg",
  h6: "text-xs sm:text-sm lg:text-base",

  // Body text
  body: "text-sm sm:text-base",
  bodySmall: "text-xs sm:text-sm",
  caption: "text-xs",

  // Interactive elements
  button: "text-xs sm:text-sm",
  buttonLarge: "text-sm sm:text-base",
  input: "text-sm sm:text-base",
  label: "text-xs sm:text-sm",

  // Navigation
  navItem: "text-sm sm:text-base",
  navLabel: "text-xs sm:text-sm",

  // Components
  cardTitle: "text-base sm:text-lg",
  cardText: "text-xs sm:text-sm",
  badge: "text-xs",
  tableHeader: "text-xs sm:text-sm",
  tableCell: "text-xs sm:text-sm",

  // Dashboard specific
  statValue: "text-lg sm:text-xl lg:text-2xl",
  statLabel: "text-xs sm:text-sm",
  widgetTitle: "text-sm sm:text-base lg:text-lg",
  widgetText: "text-xs sm:text-sm",

  // Form specific
  formTitle: "text-xl sm:text-2xl",
  formDescription: "text-sm sm:text-base",
  formLabel: "text-xs sm:text-sm",
  formInput: "text-sm sm:text-base",
  formError: "text-xs sm:text-sm",
  formHelp: "text-xs",
}

export const getTextSize = (key: keyof typeof textSizes): string => {
  return textSizes[key] || textSizes.body
}
