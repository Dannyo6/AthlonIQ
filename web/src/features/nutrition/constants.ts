import { MealSlot } from "@/types";

export interface MealSlotOption {
  id: MealSlot;
  label: string;
}

export const MEAL_SLOTS: readonly MealSlotOption[] = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "snack", label: "Snack" },
];

export const QUANTITY_OPTIONS: readonly number[] = [0.5, 1, 1.5, 2, 2.5, 3];
