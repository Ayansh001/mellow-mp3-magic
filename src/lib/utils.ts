
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds === Infinity) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Generates a random number within a range
 */
export function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Creates an array with a specified length filled with a map function
 */
export function createArray<T>(length: number, mapFn: (index: number) => T): T[] {
  return Array.from({ length }, (_, index) => mapFn(index));
}

/**
 * Creates floating hearts for animation
 */
export function createFloatingHearts(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: Math.random().toString(),
    x: 25 + Math.random() * 50, // Random position around the logo
    y: Math.random() * 20,
    size: 8 + Math.random() * 8, // Random size between 8-16px
    duration: 1 + Math.random() * 2,
    opacity: 0.6 + Math.random() * 0.4
  }));
}
