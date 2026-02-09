/**
 * Security module - ABAC (Attribute-Based Access Control) implementation
 */

class SecurityContext {
  constructor(ctx) {
    this.ctx = ctx;
    this.principal = null;
    this.policies = [];
  }

  /**
   * Set the current principal (user/entity)
   * @param {Object} principal - The principal object with attributes
   */
  setPrincipal(principal) {
    this.principal = principal;
  }

  /**
   * Check if the principal can perform an action on a resource
   * @param {string} action - The action to perform
   * @param {Object} resource - The resource object with attributes
   * @param {Object} environment - Environment attributes (optional)
   * @returns {boolean} - Whether the action is allowed
   */
  can(action, resource, environment = {}) {
    if (!this.principal) {
      return false;
    }

    // Simple ABAC implementation
    for (const policy of this.policies) {
      if (this.evaluatePolicy(policy, action, resource, environment)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Add a policy to the security context
   * @param {Object} policy - The policy object
   */
  addPolicy(policy) {
    this.policies.push(policy);
  }

  /**
   * Evaluate a single policy
   * @param {Object} policy - The policy to evaluate
   * @param {string} action - The action to perform
   * @param {Object} resource - The resource object
   * @param {Object} environment - Environment attributes
   * @returns {boolean} - Whether the policy allows the action
   */
  evaluatePolicy(policy, action, resource, environment) {
    // Check if the policy applies to the action
    if (policy.action && policy.action !== action) {
      return false;
    }

    // Check principal attributes
    if (policy.principalAttributes) {
      for (const [key, value] of Object.entries(policy.principalAttributes)) {
        if (this.principal[key] !== value) {
          return false;
        }
      }
    }

    // Check resource attributes
    if (policy.resourceAttributes) {
      for (const [key, value] of Object.entries(policy.resourceAttributes)) {
        if (resource[key] !== value) {
          return false;
        }
      }
    }

    // Check environment attributes
    if (policy.environmentAttributes) {
      for (const [key, value] of Object.entries(policy.environmentAttributes)) {
        if (environment[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }
}

/**
 * Create a new security context
 * @param {Object} ctx - The application context
 * @returns {SecurityContext} - A new security context
 */
export function createSecurityContext(ctx) {
  return new SecurityContext(ctx);
}

export { SecurityContext };