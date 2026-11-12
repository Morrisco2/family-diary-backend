const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const MAX_SEARCH_LENGTH = 100;

// Escape special regex characters to prevent regex injection
const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Validate and normalize pagination values
const getPositiveInteger = (value, defaultValue, name) => {
  if (value === undefined || value === "") {
    return defaultValue;
  }

  const parsedValue = Number(value);

  if (
    !Number.isSafeInteger(parsedValue) ||
    parsedValue < 1
  ) {
    const error = new Error(`Invalid ${name} value.`);
    error.statusCode = 400;
    throw error;
  }

  return parsedValue;
};

// Validate configured MongoDB field paths
const validateSearchFields = (fields) => {
  if (!Array.isArray(fields)) {
    throw new Error("searchFields must be an array.");
  }

  return fields.map((field) => {
    if (
      typeof field !== "string" ||
      !/^[a-zA-Z0-9_.]+$/.test(field) ||
      field.startsWith(".") ||
      field.endsWith(".") ||
      field.includes("..")
    ) {
      throw new Error(`Invalid search field: ${field}`);
    }

    return field;
  });
};

// Build MongoDB search conditions
const buildSearchFilter = ({
  search,
  searchFields,
  filters = {},
}) => {
  const conditions = [];

  // Preserve other endpoint-specific filters
  if (Object.keys(filters).length > 0) {
    conditions.push(filters);
  }

  // Add search conditions when a search term exists
  if (search && searchFields.length > 0) {
    const regex = new RegExp(
      escapeRegex(search),
      "i"
    );

    const searchConditions = searchFields.map((field) => ({
      [field]: regex,
    }));

    conditions.push({
      $or: searchConditions,
    });
  }

  if (conditions.length === 0) return {};

  if (conditions.length === 1) {
    return conditions[0];
  }

  return {
    $and: conditions,
  };
};

/**
 * @param {Object} options
 * @param {Object} options.model Mongoose model
 * @param {Object} options.query Express req.query
 * @param {Array} options.searchFields Allowed searchable fields
 * @param {Object} options.filters Additional trusted MongoDB filters
 * @param {Object} options.sort MongoDB sorting configuration
 * @param {Number} options.defaultLimit Default records per page
 * @param {Number} options.maxLimit Maximum records per page
 * @param {String|Object} options.select Optional selected fields
 * @param {String|Object} options.populate Optional Mongoose population
 * @param {Boolean} options.lean Whether to return plain objects
 */

const searchAndPaginate = async ({
  model,
  query = {},
  searchFields = [],
  filters = {},
  sort = { createdAt: -1 },
  defaultLimit = DEFAULT_LIMIT,
  maxLimit = MAX_LIMIT,
  select,
  populate,
  lean = false,
}) => {
  if (!model || typeof model.find !== "function") {
    throw new Error("A valid Mongoose model is required.");
  }

  // Read search query
  const search =
    typeof query.search === "string"
      ? query.search.trim()
      : "";

  if (search.length > MAX_SEARCH_LENGTH) {
    const error = new Error(
      `Search term cannot exceed ${MAX_SEARCH_LENGTH} characters.`
    );
    error.statusCode = 400;
    throw error;
  }

  // Read pagination values
  const currentPage = getPositiveInteger(
    query.page,
    1,
    "page"
  );

  const requestedLimit = getPositiveInteger(
    query.limit,
    defaultLimit,
    "limit"
  );

  const limit = Math.min(requestedLimit, maxLimit);

  // Validate searchable fields
  const allowedFields = validateSearchFields(searchFields);

  // Calculate database offset
  const skip = (currentPage - 1) * limit;

  // Build MongoDB query
  const mongoFilter = buildSearchFilter({
    search,
    searchFields: allowedFields,
    filters,
  });

  // Prepare database query
  let dataQuery = model
    .find(mongoFilter)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  if (select) {
    dataQuery = dataQuery.select(select);
  }

  if (populate) {
    dataQuery = dataQuery.populate(populate);
  }

  if (lean) {
    dataQuery = dataQuery.lean();
  }

  // Fetch records and total matching records concurrently
  const [data, totalItems] = await Promise.all([
    dataQuery.exec(),
    model.countDocuments(mongoFilter),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return {
    data,

    pagination: {
      currentPage,
      totalPages,
      totalItems,
      limit,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    },
  };
};

export default searchAndPaginate;
