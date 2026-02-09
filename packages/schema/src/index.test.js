import { describe, it, expect, beforeEach } from 'vitest';
import { registerSchema, getSchema, getAllSchemas, hasSchema, clearAllSchemas } from './index.js';

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