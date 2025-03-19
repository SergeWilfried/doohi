import { decimalRules } from "@/types/payments/pawapay";


/**
 * Validates if the amount matches the decimal place rule of the correspondent.
 * @param amount - The transaction amount as a string.
 * @param correspondent - The correspondent identifier.
 * @returns Boolean indicating whether the amount is valid.
 */
export function validateTransactionAmount(amount: string, correspondent: string): boolean {
  const decimalRule = decimalRules[correspondent];

  // If the correspondent is not found, throw an error
  if (decimalRule === undefined) {
    throw new Error(`Unknown correspondent: ${correspondent}`);
  }


  const amountParts = amount.split('.');
   // Ensure amountParts is a valid array
   if (!amountParts || amountParts.length === 0) {
    throw new Error(`Invalid amount format: ${amount}`);
  }

  // If decimal places are not supported, the amount must be a whole number
  if (decimalRule === null) {
    return amountParts.length === 1;
  }

  // If decimal places are supported, validate their count
  return amountParts.length === 1 || (amountParts.length === 2 && amountParts[1]!.length <= decimalRule);
}