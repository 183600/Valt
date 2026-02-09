import { describe, it, expect } from 'vitest';
import { createSecurityContext } from './index.js';

describe('SecurityContext', () => {
  it('should return false when no principal is set', () => {
    const ctx = {};
    const security = createSecurityContext(ctx);
    
    expect(security.can('read', { id: 1 })).toBe(false);
  });

  it('should allow actions that match policies', () => {
    const ctx = {};
    const security = createSecurityContext(ctx);
    
    // Set up a principal
    security.setPrincipal({
      id: 'user1',
      role: 'admin',
      department: 'engineering'
    });
    
    // Add a policy that allows admins to read documents
    security.addPolicy({
      action: 'read',
      principalAttributes: {
        role: 'admin'
      }
    });
    
    // Test the policy
    expect(security.can('read', { type: 'document' })).toBe(true);
    expect(security.can('write', { type: 'document' })).toBe(false);
  });

  it('should check resource attributes', () => {
    const ctx = {};
    const security = createSecurityContext(ctx);
    
    security.setPrincipal({
      id: 'user1',
      role: 'user'
    });
    
    // Policy that allows users to read their own documents
    security.addPolicy({
      action: 'read',
      principalAttributes: {
        role: 'user'
      },
      resourceAttributes: {
        ownerId: 'user1'
      }
    });
    
    expect(security.can('read', { type: 'document', ownerId: 'user1' })).toBe(true);
    expect(security.can('read', { type: 'document', ownerId: 'user2' })).toBe(false);
  });

  it('should check environment attributes', () => {
    const ctx = {};
    const security = createSecurityContext(ctx);
    
    security.setPrincipal({
      id: 'user1',
      role: 'user'
    });
    
    // Policy that allows actions during business hours
    security.addPolicy({
      action: 'read',
      principalAttributes: {
        role: 'user'
      },
      environmentAttributes: {
        timeOfDay: 'business'
      }
    });
    
    expect(security.can('read', { type: 'document' }, { timeOfDay: 'business' })).toBe(true);
    expect(security.can('read', { type: 'document' }, { timeOfDay: 'after-hours' })).toBe(false);
  });

  it('should allow multiple policies', () => {
    const ctx = {};
    const security = createSecurityContext(ctx);
    
    security.setPrincipal({
      id: 'user1',
      role: 'manager'
    });
    
    // Policy 1: Managers can approve expenses
    security.addPolicy({
      action: 'approve',
      principalAttributes: {
        role: 'manager'
      }
    });
    
    // Policy 2: Anyone can read public documents
    security.addPolicy({
      action: 'read',
      resourceAttributes: {
        visibility: 'public'
      }
    });
    
    expect(security.can('approve', { type: 'expense' })).toBe(true);
    expect(security.can('read', { type: 'document', visibility: 'public' })).toBe(true);
    expect(security.can('delete', { type: 'document' })).toBe(false);
  });
});