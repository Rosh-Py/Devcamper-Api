module.exports = advancedResults =
  (model, populate) => async (req, res, next) => {
    let query;
    let bootcamps;
    const reqQuery = { ...req.query };
    const removeFields = ["select", "sort", "page", "limit"];

    //remove select field
    removeFields.forEach((param) => delete reqQuery[param]);

    //fields to exclude
    let queryStr = JSON.stringify(reqQuery);

    //create operatos for querying
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/,
      (match) => `$${match}`
    );

    //find bootcamps
    query = model.find(JSON.parse(queryStr));

    //select specific fields
    if (req.query.select) {
      const fields = req.query.select.split(",").join(" ");
      query = query.select(fields);
    }
    //sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    //pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await model.countDocuments();

    query = query.skip(startIndex).limit(limit);

    if (populate) {
      query = query.populate(populate);
    }
    //executing query
    results = await query;

    //pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = { page: page + 1, limit };
    }

    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    res.advancedResults = {
      success: true,
      count: results.length,
      pagination,
      data: results,
    };
    return next();
  };
