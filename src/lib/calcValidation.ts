import { z } from "zod";

/**
 * Validation rules for calculator geometry.
 * Length / Height: meters, accepts any positive number (no upper limit) —
 * we only require the user to enter a value so the BoQ can be computed.
 * Waste: integer percent 0–20 (UI is a slider, but we still guard the value).
 */
const numericString = (label: string) =>
  z
    .string()
    .trim()
    .min(1, { message: `Enter ${label.toLowerCase()} to calculate BoQ` })
    .regex(/^\d+(\.\d+)?$/, { message: `${label} must be a number` });

export const lengthSchema = numericString("Length")
  .refine((v) => +v > 0, { message: "Length must be greater than 0 m" });

export const heightSchema = numericString("Height")
  .refine((v) => +v > 0, { message: "Height must be greater than 0 m" });

export const wasteSchema = z
  .number({ message: "Waste must be a number" })
  .int({ message: "Waste must be a whole percent" })
  .min(0,  { message: "Waste cannot be negative" })
  .max(20, { message: "Waste cannot exceed 20%" });

export type FieldError = string | null;

export function validateLength(v: string): FieldError {
  const r = lengthSchema.safeParse(v);
  return r.success ? null : r.error.issues[0].message;
}
export function validateHeight(v: string): FieldError {
  const r = heightSchema.safeParse(v);
  return r.success ? null : r.error.issues[0].message;
}
export function validateWaste(v: number): FieldError {
  const r = wasteSchema.safeParse(v);
  return r.success ? null : r.error.issues[0].message;
}

export function validateGeometry(length: string, height: string, waste: number) {
  return {
    length: validateLength(length),
    height: validateHeight(height),
    waste:  validateWaste(waste),
  };
}

export function hasErrors(errs: Record<string, FieldError>) {
  return Object.values(errs).some(Boolean);
}