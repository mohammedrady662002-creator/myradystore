import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { arEG } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م`;
}

export function formatDate(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'd MMMM yyyy - h:mm', { locale: arEG }).replace('AM', 'ص').replace('PM', 'م');
}

// Improved date formatter for Arabic locale with English numbers
export function formatArabicDate(dateString: string) {
  const date = new Date(dateString);
  const formatter = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
  
  return formatter.format(date);
}

export function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

export async function sendWhatsAppOTP(phoneNumber: string, otp: string) {
  // Utilizing a common WhatsApp Gateway API pattern
  const API_URL = import.meta.env.VITE_WHATSAPP_API_URL; // e.g. https://api.ultramsg.com/instanceID/messages/chat
  const TOKEN = import.meta.env.VITE_WHATSAPP_TOKEN;
  
  if (!API_URL || !TOKEN) {
    console.warn('WhatsApp API configuration missing. Printing OTP to console for dev.');
    console.log(`[DEV OTP]: ${otp} for ${phoneNumber}`);
    return true; // Simulate success if not configured for easy testing
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        token: TOKEN,
        to: phoneNumber,
        body: `رمز التحقق الخاص بك لمتجر Rady Store هو: ${otp}. برجاء عدم مشاركة هذا الرمز مع أي شخص.`
      })
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to send WhatsApp OTP:', error);
    return false;
  }
}
