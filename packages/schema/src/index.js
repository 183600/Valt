const schemas = new Map();

export function registerSchema(name, schema) {
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Schema name must be a non-empty string');
  }
  
  if (!schema || typeof schema !== 'object') {
    throw new Error('Schema must be a valid object');
  }
  
  schemas.set(name, schema);
  return true;
}

export function getSchema(name) {
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Schema name must be a non-empty string');
  }
  
  return schemas.get(name);
}

export function getAllSchemas() {
  return Object.fromEntries(schemas);
}

export function hasSchema(name) {
  if (typeof name !== 'string' || !name.trim()) {
    return false;
  }
  
  return schemas.has(name);
}

export function clearAllSchemas() {
  schemas.clear();
}