import { ZodError } from 'zod'

export function validate(schema, location = 'body') {
  return (req, res, next) => {
    try {
      const data = location === 'body' ? req.body : location === 'query' ? req.query : req.params
      const parsed = schema.parse(data)
      if (location === 'body') {
        req.body = parsed
      } else if (location === 'query') {
        // mutate existing object to avoid overwriting getter-based property
        Object.keys(req.query).forEach(k => { delete req.query[k] })
        Object.assign(req.query, parsed)
      } else {
        Object.keys(req.params).forEach(k => { delete req.params[k] })
        Object.assign(req.params, parsed)
      }
      next()
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
        return res.status(400).json({ message: 'Validation failed', errors: issues })
      }
      return res.status(400).json({ message: err.message || 'Invalid request' })
    }
  }
}

// New validation middleware that accepts multiple schemas for different locations
export function validateRequest(schemas) {
  return (req, res, next) => {
    try {
      // Validate body if schema provided
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      // Validate query if schema provided
      if (schemas.query) {
        const parsedQuery = schemas.query.parse(req.query);
        Object.keys(req.query).forEach(k => { delete req.query[k] });
        Object.assign(req.query, parsedQuery);
      }
      // Validate params if schema provided
      if (schemas.params) {
        const parsedParams = schemas.params.parse(req.params);
        Object.keys(req.params).forEach(k => { delete req.params[k] });
        Object.assign(req.params, parsedParams);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map(i => ({ path: i.path.join('.'), message: i.message }));
        return res.status(400).json({ message: 'Validation failed', errors: issues });
      }
      return res.status(400).json({ message: err.message || 'Invalid request' });
    }
  };
}
