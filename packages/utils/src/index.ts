import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format number into Indian Rupee currency notation.
 * e.g. 1150000 -> Rs 11,50,000 or Rs 11.50 Lakh
 */
export function formatINR(
  amount: number,
  options?: { compact?: boolean; symbol?: boolean }
): string {
  const { compact = false, symbol = true } = options || {};
  const prefix = symbol ? "Rs " : "";

  if (compact) {
    if (amount >= 10000000) {
      return `${prefix}${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `${prefix}${(amount / 100000).toFixed(2)} Lakh`;
    }
    if (amount >= 1000) {
      return `${prefix}${(amount / 1000).toFixed(1)}k`;
    }
  }

  // Standard Indian numbering format: ##,##,###
  const numStr = Math.round(amount).toString();
  const lastThree = numStr.substring(numStr.length - 3);
  const otherNumbers = numStr.substring(0, numStr.length - 3);
  const formatted =
    otherNumbers !== ""
      ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
      : lastThree;

  return `${prefix}${formatted}`;
}

/**
 * Format ISO date string into readable Indian format.
 */
export function formatDate(
  dateString: string | null | undefined,
  includeTime = false
): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    const day = String(date.getDate()).padStart(2, "0");
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    if (includeTime) {
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
    }

    return `${day} ${month} ${year}`;
  } catch {
    return "-";
  }
}

/**
 * Truncate text cleanly with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

