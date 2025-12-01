/**
 * Converts Excel number-date into a JavaScript Date object.
 * For example:
 *    44663 -> 2022-04-12T00:00:00.000Z
 *    44665 -> 2022-04-14T00:00:00.000Z
 * @param excelDate
 */
export function excelDateToJsDate(excelDate: number): Date {
  return new Date(Math.round((excelDate - (25567 + 2)) * 86400 * 1000));
}
