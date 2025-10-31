import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Current USD to INR conversion rate (you may want to use an API for real-time rates)
const USD_TO_INR_RATE = 83.5;

export const convertUSDtoINR = (usdAmount) => {
  return Math.round(usdAmount * USD_TO_INR_RATE);
};

export const formatCurrency = (amount, currency = 'USD') => {
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};
