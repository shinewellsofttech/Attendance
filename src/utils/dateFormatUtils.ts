// Utility functions for date format conversion

/**
 * Convert date to DDMMYYYY format (DD-MM-YYYY for display)
 * @param dateString - Date in any format
 * @returns Date in DD-MM-YYYY format
 */
export const formatDateToDDMMYYYY = (dateString: string): string => {
  if (!dateString) return "";
  try {
    // If date is already in DD-MM-YYYY format, return as is
    if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
      return dateString;
    }
    // If date is in YYYY-MM-DD format, convert to DD-MM-YYYY
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split("-");
      return `${day}-${month}-${year}`;
    }
    // If date is in DDMMYYYY format (no separators), add separators
    if (dateString.match(/^\d{8}$/)) {
      const day = dateString.substring(0, 2);
      const month = dateString.substring(2, 4);
      const year = dateString.substring(4, 8);
      return `${day}-${month}-${year}`;
    }
    // Try to parse and format
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch (e) {
    // Ignore
  }
  return dateString;
};

/**
 * Convert date to YYYY-MM-DD format (for date input and API)
 * @param dateString - Date in any format
 * @returns Date in YYYY-MM-DD format
 */
export const formatDateToYYYYMMDD = (dateString: string): string => {
  if (!dateString) return "";
  try {
    // If date is already in YYYY-MM-DD format, return as is
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }
    // If date is in DD-MM-YYYY format, convert to YYYY-MM-DD
    if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const [day, month, year] = dateString.split("-");
      return `${year}-${month}-${day}`;
    }
    // If date is in DDMMYYYY format (no separators), convert to YYYY-MM-DD
    if (dateString.match(/^\d{8}$/)) {
      const day = dateString.substring(0, 2);
      const month = dateString.substring(2, 4);
      const year = dateString.substring(4, 8);
      return `${year}-${month}-${day}`;
    }
    // Try to parse and format
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    // Ignore
  }
  return dateString;
};

/**
 * Format date for date input (YYYY-MM-DD) from API response
 * @param dateString - Date from API
 * @returns Date in YYYY-MM-DD format for date input
 */
export const formatDateForInput = (dateString: string): string => {
  return formatDateToYYYYMMDD(dateString);
};

/**
 * Format date for display (DD-MM-YYYY) from API response
 * @param dateString - Date from API
 * @returns Date in DD-MM-YYYY format for display
 */
export const formatDateForDisplay = (dateString: string): string => {
  return formatDateToDDMMYYYY(dateString);
};

/**
 * Format date for API submission (YYYY-MM-DD)
 * @param dateString - Date from form
 * @returns Date in YYYY-MM-DD format for API
 */
export const formatDateForAPI = (dateString: string): string => {
  return formatDateToYYYYMMDD(dateString);
};

