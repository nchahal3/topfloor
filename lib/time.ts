export function timeToMinutes(time: string): number {
  const [timePart, period] = time.split(" ");
  const [h, m] = timePart.split(":").map(Number);
  let total = h * 60 + m;
  if (period === "PM" && h !== 12) total += 720;
  if (period === "AM" && h === 12) total -= 720;
  return total;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:${String(m).padStart(2, "0")} ${period}`;
}

export function sortByTimeEst<T extends { time_est: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => timeToMinutes(a.time_est) - timeToMinutes(b.time_est));
}

export function datetimeLocalToTimeEst(datetimeLocal: string): string {
  const timePart = datetimeLocal.split("T")[1];
  if (!timePart) return "";
  const [h, m] = timePart.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:${String(m).padStart(2, "0")} ${period}`;
}
