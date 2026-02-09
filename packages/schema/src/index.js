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

export function validate(schemaName, data) {
  if (typeof schemaName !== 'string' || !schemaName.trim()) {
    throw new Error('Schema name must be a non-empty string');
  }
  
  const schema = schemas.get(schemaName);
  if (!schema) {
    throw new Error(`Schema '${schemaName}' not found`);
  }
  
  return validateData(data, schema);
}

function validateData(data, schema) {
  const errors = [];
  
  // Check type
  if (schema.type) {
    const dataType = Array.isArray(data) ? 'array' : typeof data;
    if (dataType !== schema.type) {
      errors.push(`Expected type '${schema.type}', but got '${dataType}'`);
    }
  }
  
  // Check object properties
  if (schema.type === 'object' && schema.properties && typeof data === 'object' && data !== null) {
    const properties = schema.properties;
    
    // Check required properties
    if (schema.required) {
      for (const requiredProp of schema.required) {
        if (!(requiredProp in data)) {
          errors.push(`Required property '${requiredProp}' is missing`);
        }
      }
    }
    
    // Validate each property
    for (const [propName, propSchema] of Object.entries(properties)) {
      if (propName in data) {
        const propValidation = validateData(data[propName], propSchema);
        errors.push(...propValidation.errors.map(err => `${propName}: ${err}`));
      }
    }
  }
  
  // Check array items
  if (schema.type === 'array' && Array.isArray(data)) {
    if (schema.items) {
      data.forEach((item, index) => {
        const itemValidation = validateData(item, schema.items);
        errors.push(...itemValidation.errors.map(err => `[${index}]: ${err}`));
      });
    }
  }
  
  // Check enum values
  if (schema.enum && !schema.enum.includes(data)) {
    errors.push(`Value must be one of: ${schema.enum.join(', ')}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}