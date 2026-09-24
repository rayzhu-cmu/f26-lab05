import type { Room } from './types';

const PREMIUM_RATE_MULTIPLIER = 1.15;
const LONG_BOOKING_CUTOFF = 180;
const LONG_BOOKING_RATE_MULTIPLIER = 0.9;
const EVENING_CUTOFF = 17 * 60;
const EVENING_RATE_MULTIPLIER = 0.95;

/** Calculates the price shared by booking creation and revenue reporting. */
export function calculateReservationPrice(room: Room, start: number, end: number): number {
  const minutes = end - start;
  let cents = Math.round((minutes / 60) * room.hourlyRateCents);
  if (room.premium === true) {
    cents = Math.round(cents * PREMIUM_RATE_MULTIPLIER);
  }
  if (minutes >= LONG_BOOKING_CUTOFF) {
    cents = Math.round(cents * LONG_BOOKING_RATE_MULTIPLIER);
  }
  if (start >= EVENING_CUTOFF) {
    cents = Math.round(cents * EVENING_RATE_MULTIPLIER);
  }
  return cents;
}
