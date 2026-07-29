// Reusable pagination helper used by all list endpoints
// Reads page and limit from query string, clamps them to safe values
// Example: GET /events?page=2&limit=9
export const getPagination = (query) => {
  // Math.max(1, ...) ensures page is never 0 or negative
  const page = Math.max(1, parseInt(query.page) || 1);

  // Math.min(50, ...) caps limit at 50 - prevents fetching 99999 records at once
  // Math.max(1, ...) ensures limit is never 0 or negative
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 10));

  // skip = how many records to jump over in the database
  // Page 1: skip 0, Page 2: skip 9, Page 3: skip 18 (if limit=9)
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};
