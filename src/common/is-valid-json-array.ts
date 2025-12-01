export const isValidJSONArray = (value: string | undefined | null) => {
  try {
    return Array.isArray(JSON.parse(value ?? ''));
  } catch (e) {
    return false;
  }
};
