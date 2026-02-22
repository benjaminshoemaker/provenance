export function getAIPercentageColor(percentage: number): {
  bg: string;
  tailwind: string;
  hex: string;
} {
  if (percentage <= 25) {
    return { bg: "bg-emerald-600", tailwind: "emerald", hex: "#059669" };
  }
  if (percentage <= 50) {
    return { bg: "bg-amber-500", tailwind: "amber", hex: "#f59e0b" };
  }
  if (percentage <= 75) {
    return { bg: "bg-orange-500", tailwind: "orange", hex: "#f97316" };
  }
  return { bg: "bg-red-500", tailwind: "red", hex: "#ef4444" };
}
