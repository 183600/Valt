import { describe, it, expect, beforeEach } from 'vitest';
import { registerSchema, getSchema, getAllSchemas, hasSchema, clearAllSchemas, validate } from './index.js';

describe('Schema Registry', () => {
  beforeEach(() => {
    // Clear all schemas before each test
    clearAllSchemas();
  });

  it('should register a schema successfully', () => {
    const userSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      }
    };
    
    const result = registerSchema('user', userSchema);
    expect(result).toBe(true);
    expect(hasSchema('user')).toBe(true);
  });

  it('should get a registered schema', () => {
    const userSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' }
      }
    };
    
    registerSchema('user', userSchema);
    const retrieved = getSchema('user');
    expect(retrieved).toEqual(userSchema);
  });

  it('should return undefined for non-existent schema', () => {
    const result = getSchema('nonexistent');
    expect(result).toBeUndefined();
  });

  it('should throw error for invalid schema name', () => {
    expect(() => registerSchema('', {})).toThrow('Schema name must be a non-empty string');
    expect(() => registerSchema(null, {})).toThrow('Schema name must be a non-empty string');
    expect(() => registerSchema(123, {})).toThrow('Schema name must be a non-empty string');
  });

  it('should throw error for invalid schema object', () => {
    expect(() => registerSchema('test', null)).toThrow('Schema must be a valid object');
    expect(() => registerSchema('test', 'string')).toThrow('Schema must be a valid object');
    expect(() => registerSchema('test')).toThrow('Schema must be a valid object');
  });

  it('should throw error when getting schema with invalid name', () => {
    expect(() => getSchema('')).toThrow('Schema name must be a non-empty string');
    expect(() => getSchema(null)).toThrow('Schema name must be a non-empty string');
    expect(() => getSchema(123)).toThrow('Schema name must be a non-empty string');
  });

  it('should return false for hasSchema with invalid name', () => {
    expect(hasSchema('')).toBe(false);
    expect(hasSchema(null)).toBe(false);
    expect(hasSchema(123)).toBe(false);
  });

  it('should handle multiple schemas', () => {
    const userSchema = { type: 'object' };
    const postSchema = { type: 'object' };
    
    registerSchema('user', userSchema);
    registerSchema('post', postSchema);
    
    expect(getSchema('user')).toEqual(userSchema);
    expect(getSchema('post')).toEqual(postSchema);
    expect(getAllSchemas()).toEqual({ user: userSchema, post: postSchema });
  });
});

describe('Schema Validation', () => {
  beforeEach(() => {
    clearAllSchemas();
  });

  it('should validate data against a simple object schema', () => {
    const userSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      },
      required: ['name']
    };
    
    registerSchema('user', userSchema);
    
    const validData = { name: 'John', age: 30 };
    const result = validate('user', validData);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should return validation errors for invalid data', () => {
    const userSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      },
      required: ['name']
    };
    
    registerSchema('user', userSchema);
    
    const invalidData = { age: '30' }; // missing required 'name' and wrong type for 'age'
    const result = validate('user', invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Required property 'name' is missing");
    expect(result.errors).toContain("age: Expected type 'number', but got 'string'");
  });

  it('should validate array data', () => {
    const numbersSchema = {
      type: 'array',
      items: { type: 'number' }
    };
    
    registerSchema('numbers', numbersSchema);
    
    const validData = [1, 2, 3];
    const result = validate('numbers', validData);
    expect(result.valid).toBe(true);
    
    const invalidData = [1, '2', 3];
    const invalidResult = validate('numbers', invalidData);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors).toContain("[1]: Expected type 'number', but got 'string'");
  });

  it('should validate enum values', () => {
    const statusSchema = {
      type: 'string',
      enum: ['active', 'inactive', 'pending']
    };
    
    registerSchema('status', statusSchema);
    
    const validData = 'active';
    const result = validate('status', validData);
    expect(result.valid).toBe(true);
    
    const invalidData = 'unknown';
    const invalidResult = validate('status', invalidData);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors).toContain("Value must be one of: active, inactive, pending");
  });

  it('should throw error for non-existent schema', () => {
    expect(() => validate('nonexistent', {})).toThrow("Schema 'nonexistent' not found");
  });

  it('should throw error for invalid schema name', () => {
    expect(() => validate('', {})).toThrow('Schema name must be a non-empty string');
    expect(() => validate(null, {})).toThrow('Schema name must be a non-empty string');
    expect(() => validate(123, {})).toThrow('Schema name must be a non-empty string');
  });
});