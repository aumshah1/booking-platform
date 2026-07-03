/**
 * Formats a date string into IST and UTC representations.
 * Example: 10:30 AM (IST) / 05:00 AM (UTC)
 */ 
export function formatFlightTime(dateString: string | Date): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  
  const istTime = date.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const utcTime = date.toLocaleTimeString('en-US', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `${istTime} (IST) / ${utcTime} (UTC)`;
}

/**
 * Formats a date string into IST and UTC date representations.
 * Example: 07/03/2026 (IST/UTC)
 * Usually, for flights in similar timezones, the date might be the same.
 * But to be precise, we check if the dates differ.
 */
export function formatFlightDate(dateString: string | Date): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  
  const istDate = date.toLocaleDateString('en-US', {
    timeZone: 'Asia/Kolkata'
  });
  
  const utcDate = date.toLocaleDateString('en-US', {
    timeZone: 'UTC'
  });

  if (istDate === utcDate) {
    return `${istDate} (IST/UTC)`;
  }
  
  return `${istDate} (IST) / ${utcDate} (UTC)`;
}

/**
 * Formats a date string into a combined IST/UTC representation.
 */
export function formatFlightDateTime(dateString: string | Date): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  
  const istTime = date.toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const utcTime = date.toLocaleString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `${istTime} (IST) / ${utcTime} (UTC)`;
}
