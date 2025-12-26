// Utility functions for time format conversion based on Railway Time setting

/**
 * Convert 24-hour format to 12-hour format
 * @param time24 - Time in 24-hour format (HH:mm)
 * @returns Time in 12-hour format (HH:mm AM/PM)
 */
export const convertTo12Hour = (time24: string): string => {
  if (!time24) return "";
  try {
    // Handle incomplete time strings (e.g., "12:", "12:3")
    if (!time24.includes(":")) return time24;
    
    const parts = time24.split(":");
    const hoursStr = parts[0] || "0";
    const minutesStr = parts[1] || "00";
    
    // Check if hours or minutes are invalid
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    
    if (isNaN(hours) || hours < 0 || hours > 23) return time24;
    if (isNaN(minutes) || minutes < 0 || minutes > 59) {
      // If minutes are incomplete, return as is (don't format)
      if (minutesStr.length < 2) return time24;
      return time24;
    }
    
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${String(hours12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
  } catch (e) {
    return time24;
  }
};

/**
 * Convert 12-hour format to 24-hour format
 * @param time12 - Time in 12-hour format (HH:mm AM/PM)
 * @returns Time in 24-hour format (HH:mm)
 */
export const convertTo24Hour = (time12: string): string => {
  if (!time12) return "";
  try {
    const timeStr = time12.trim();
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return time12; // If already in 24-hour format, return as is
    
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();
    
    if (period === "PM" && hours !== 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }
    
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  } catch (e) {
    return time12;
  }
};

/**
 * Get Railway Time setting from Global Options
 * @returns boolean - true if Railway Time is enabled (24-hour format), false for 12-hour format
 */
export const getRailwayTimeSetting = (): boolean => {
  try {
    // Try to get from localStorage if cached
    const cached = localStorage.getItem("globalOptions");
    if (cached) {
      const options = JSON.parse(cached);
      return options.RailwayTime === true || options.RailwayTime === "true" || options.RailwayTime === 1;
    }
    // Default to false (12-hour format) if not found
    return false;
  } catch (e) {
    return false;
  }
};

/**
 * Format time for display based on Railway Time setting
 * @param time - Time in any format
 * @param isRailwayTime - Whether Railway Time is enabled
 * @returns Formatted time string
 */
export const formatTimeForDisplay = (time: string, isRailwayTime: boolean): string => {
  if (!time) return "";
  if (isRailwayTime) {
    // Return in 24-hour format (ensure it's in 24-hour)
    return time.includes("AM") || time.includes("PM") ? convertTo24Hour(time) : time;
  } else {
    // Return in 12-hour format
    return time.includes("AM") || time.includes("PM") ? time : convertTo12Hour(time);
  }
};

/**
 * Format time for API submission (always 24-hour format)
 * @param time - Time in any format
 * @returns Time in 24-hour format
 */
export const formatTimeForAPI = (time: string): string => {
  if (!time) return "";
  return time.includes("AM") || time.includes("PM") ? convertTo24Hour(time) : time;
};

