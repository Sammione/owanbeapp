import { CLEANING_FEE, DELIVERY_FEE, OWNER_SHARE } from "./constants";
import { addDays } from "./format";

export function defaultDeposit(price: number) {
  return Math.max(5000, Math.round((price * 1.3) / 1000) * 1000);
}

export function lateFeePerDay(price: number) {
  return Math.max(1000, Math.round((price * 0.15) / 500) * 500);
}

export function quote(item: { price: number; deposit: number }, eventDate: string, delivery: boolean) {
  const rental_fee = item.price;
  const cleaning_fee = CLEANING_FEE;
  const delivery_fee = delivery ? DELIVERY_FEE : 0;
  const deposit = item.deposit > 0 ? item.deposit : defaultDeposit(item.price);
  return {
    start_date: addDays(eventDate, -1),
    end_date: addDays(eventDate, 1),
    rental_fee,
    cleaning_fee,
    delivery_fee,
    deposit,
    total: rental_fee + cleaning_fee + delivery_fee + deposit,
  };
}

export function ownerEarning(rentalFee: number) {
  return Math.round(rentalFee * OWNER_SHARE);
}

export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart <= bEnd && bStart <= aEnd;
}
