<<<<<<< Updated upstream
import { type ClassValue, clsx } from "clsx";
=======
import { clsx, type ClassValue } from "clsx";
>>>>>>> Stashed changes
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
