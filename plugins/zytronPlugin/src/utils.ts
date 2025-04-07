export const isValidNumber = (input?: string): boolean => {
  if (typeof input !== "string") return false;
  return /^[0-9]+(\.[0-9]+)?$/.test(input);
}
