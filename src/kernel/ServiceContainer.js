/**
 * WebOS Dependency Injection Container
 * Provides service registration and resolution with lifecycle management
 */

import { createLogger } from './Logger.js';
import { ValidationError } from './Errors.js';

const logger = createLogger('ServiceContainer');

/**
 * Service lifecycle types
 */
export const ServiceLifecycle = {
  SINGLETON: 'singleton', // Single instance shared across the application
  TRANSIENT: 'transient', // New instance created each time
  SCOPED: 'scoped'        // New instance per scope (e.g., per request/process)
};

/**
 * Service definition
 */
class ServiceDefinition {
  constructor(name, factory, lifecycle = ServiceLifecycle.SINGLETON) {
    this.name = name;
    this.factory = factory;
    this.lifecycle = lifecycle;
    this.instance = null;
    this.dependencies = [];
    this.metadata = {};
  }
}

/**
 * Service scope for scoped services
 */
export class ServiceScope {
  constructor(container) {
    this.container = container;
    this.instances = new Map();
    this.disposed = false;
  }

  /**
   * Get a service within this scope
   */
  get(name) {
    if (this.disposed) {
      throw new Error('Cannot get service from disposed scope');
    }

    const definition = this.container.getDefinition(name);
    if (!definition) {
      throw new ValidationError('service', `Service not found: ${name}`);
    }

    // For singleton services, use container's instance
    if (definition.lifecycle === ServiceLifecycle.SINGLETON) {
      return this.container.get(name);
    }

    // For scoped services, create instance in this scope
    if (definition.lifecycle === ServiceLifecycle.SCOPED) {
      if (!this.instances.has(name)) {
        const instance = this.container.createInstance(definition, this);
        this.instances.set(name, instance);
      }
      return this.instances.get(name);
    }

    // For transient services, always create new instance
    return this.container.createInstance(definition, this);
  }

  /**
   * Dispose all scoped instances
   */
  async dispose() {
    if (this.disposed) return;

    logger.debug('Disposing service scope', { instanceCount: this.instances.size });

    for (const [name, instance] of this.instances) {
      try {
        if (instance && typeof instance.dispose === 'function') {
          await instance.dispose();
        }
      } catch (err) {
        logger.error(`Failed to dispose scoped service: ${name}`, err);
      }
    }

    this.instances.clear();
    this.disposed = true;
  }
}

/**
 * Dependency Injection Container
 */
export class ServiceContainer {
  constructor() {
    this.services = new Map();
    this.resolving = new Set(); // Track circular dependencies
    this.decorators = new Map(); // Service decorators
    this.interceptors = new Map(); // Method interceptors

    // Register self
    this.registerInstance('ServiceContainer', this);

    logger.debug('ServiceContainer initialized');
  }

  /**
   * Register a service with a factory function
   */
  register(name, factory, lifecycle = ServiceLifecycle.SINGLETON, options = {}) {
    if (typeof name !== 'string' || !name) {
      throw new ValidationError('name', 'Service name must be a non-empty string');
    }

    if (typeof factory !== 'function') {
      throw new ValidationError('factory', 'Service factory must be a function');
    }

    const definition = new ServiceDefinition(name, factory, lifecycle);
    definition.dependencies = options.dependencies || [];
    definition.metadata = options.metadata || {};

    this.services.set(name, definition);

    logger.debug('Service registered', {
      name,
      lifecycle,
      dependencies: definition.dependencies
    });

    return this;
  }

  /**
   * Register a singleton service
   */
  registerSingleton(name, factory, options = {}) {
    return this.register(name, factory, ServiceLifecycle.SINGLETON, options);
  }

  /**
   * Register a transient service
   */
  registerTransient(name, factory, options = {}) {
    return this.register(name, factory, ServiceLifecycle.TRANSIENT, options);
  }

  /**
   * Register a scoped service
   */
  registerScoped(name, factory, options = {}) {
    return this.register(name, factory, ServiceLifecycle.SCOPED, options);
  }

  /**
   * Register an existing instance as a singleton
   */
  registerInstance(name, instance, options = {}) {
    const definition = new ServiceDefinition(
      name,
      () => instance,
      ServiceLifecycle.SINGLETON
    );
    definition.instance = instance;
    definition.metadata = options.metadata || {};

    this.services.set(name, definition);

    logger.debug('Service instance registered', { name });

    return this;
  }

  /**
   * Register a class with automatic constructor injection
   */
  registerClass(name, Class, lifecycle = ServiceLifecycle.SINGLETON, options = {}) {
    const factory = (container, scope) => {
      const dependencies = this.resolveDependencies(
        options.dependencies || [],
        scope
      );
      return new Class(...dependencies);
    };

    return this.register(name, factory, lifecycle, options);
  }

  /**
   * Check if a service is registered
   */
  has(name) {
    return this.services.has(name);
  }

  /**
   * Get service definition
   */
  getDefinition(name) {
    return this.services.get(name);
  }

  /**
   * Resolve a service
   */
  get(name, scope = null) {
    const definition = this.services.get(name);

    if (!definition) {
      throw new ValidationError('service', `Service not found: ${name}`);
    }

    // Check for circular dependencies
    if (this.resolving.has(name)) {
      const cycle = Array.from(this.resolving).join(' -> ') + ' -> ' + name;
      throw new Error(`Circular dependency detected: ${cycle}`);
    }

    // For scoped services with a scope, use the scope
    if (scope && definition.lifecycle === ServiceLifecycle.SCOPED) {
      return scope.get(name);
    }

    // For singleton, return cached instance
    if (definition.lifecycle === ServiceLifecycle.SINGLETON) {
      if (!definition.instance) {
        definition.instance = this.createInstance(definition, scope);
      }
      return definition.instance;
    }

    // For transient, always create new instance
    return this.createInstance(definition, scope);
  }

  /**
   * Create a service instance
   */
  createInstance(definition, scope = null) {
    this.resolving.add(definition.name);

    try {
      logger.debug('Creating service instance', { name: definition.name });

      const instance = definition.factory(this, scope);

      // Apply decorators
      const decorators = this.decorators.get(definition.name) || [];
      let decorated = instance;
      for (const decorator of decorators) {
        decorated = decorator(decorated, this);
      }

      // Apply interceptors
      this.applyInterceptors(definition.name, decorated);

      return decorated;
    } finally {
      this.resolving.delete(definition.name);
    }
  }

  /**
   * Resolve multiple dependencies
   */
  resolveDependencies(names, scope = null) {
    return names.map(name => this.get(name, scope));
  }

  /**
   * Create a new scope
   */
  createScope() {
    return new ServiceScope(this);
  }

  /**
   * Register a decorator for a service
   */
  decorate(name, decorator) {
    if (!this.decorators.has(name)) {
      this.decorators.set(name, []);
    }
    this.decorators.get(name).push(decorator);

    logger.debug('Decorator registered', { service: name });

    return this;
  }

  /**
   * Register a method interceptor
   */
  intercept(serviceName, methodName, interceptor) {
    const key = `${serviceName}.${methodName}`;
    if (!this.interceptors.has(key)) {
      this.interceptors.set(key, []);
    }
    this.interceptors.get(key).push(interceptor);

    logger.debug('Interceptor registered', { service: serviceName, method: methodName });

    return this;
  }

  /**
   * Apply interceptors to service methods
   */
  applyInterceptors(serviceName, instance) {
    if (!instance || typeof instance !== 'object') return;

    for (const [key, interceptors] of this.interceptors) {
      const [name, methodName] = key.split('.');
      if (name === serviceName && typeof instance[methodName] === 'function') {
        const originalMethod = instance[methodName];

        instance[methodName] = async function(...args) {
          let result;

          // Pre-interceptors
          for (const interceptor of interceptors) {
            if (interceptor.before) {
              await interceptor.before(instance, methodName, args);
            }
          }

          try {
            // Execute original method
            result = await originalMethod.apply(instance, args);

            // Post-interceptors (success)
            for (const interceptor of interceptors) {
              if (interceptor.after) {
                result = await interceptor.after(instance, methodName, args, result);
              }
            }

            return result;
          } catch (error) {
            // Error interceptors
            for (const interceptor of interceptors) {
              if (interceptor.error) {
                await interceptor.error(instance, methodName, args, error);
              }
            }
            throw error;
          }
        };
      }
    }
  }

  /**
   * Unregister a service
   */
  unregister(name) {
    const definition = this.services.get(name);
    if (definition && definition.instance) {
      // Dispose if it has a dispose method
      if (typeof definition.instance.dispose === 'function') {
        definition.instance.dispose();
      }
      definition.instance = null;
    }

    this.services.delete(name);
    this.decorators.delete(name);

    logger.debug('Service unregistered', { name });

    return this;
  }

  /**
   * Get all registered service names
   */
  getServiceNames() {
    return Array.from(this.services.keys());
  }

  /**
   * Get service metadata
   */
  getMetadata(name) {
    const definition = this.services.get(name);
    return definition ? definition.metadata : null;
  }

  /**
   * Set service metadata
   */
  setMetadata(name, metadata) {
    const definition = this.services.get(name);
    if (definition) {
      definition.metadata = { ...definition.metadata, ...metadata };
    }
    return this;
  }

  /**
   * Invoke a function with dependency injection
   */
  invoke(fn, dependencies = [], scope = null) {
    const resolvedDeps = this.resolveDependencies(dependencies, scope);
    return fn(...resolvedDeps);
  }

  /**
   * Dispose all singleton instances
   */
  async dispose() {
    logger.info('Disposing ServiceContainer');

    for (const [name, definition] of this.services) {
      if (definition.instance && typeof definition.instance.dispose === 'function') {
        try {
          await definition.instance.dispose();
          logger.debug('Service disposed', { name });
        } catch (err) {
          logger.error(`Failed to dispose service: ${name}`, err);
        }
      }
    }

    this.services.clear();
    this.decorators.clear();
    this.interceptors.clear();
    this.resolving.clear();
  }

  /**
   * Clone the container (useful for testing)
   */
  clone() {
    const clone = new ServiceContainer();

    for (const [name, definition] of this.services) {
      clone.services.set(name, {
        ...definition,
        instance: null // Don't copy instances
      });
    }

    for (const [name, decorators] of this.decorators) {
      clone.decorators.set(name, [...decorators]);
    }

    for (const [key, interceptors] of this.interceptors) {
      clone.interceptors.set(key, [...interceptors]);
    }

    return clone;
  }

  /**
   * Create a child container that inherits parent services
   */
  createChild() {
    const child = this.clone();
    child.parent = this;

    // Override get to check parent if not found
    const originalGet = child.get.bind(child);
    child.get = function(name, scope = null) {
      try {
        return originalGet(name, scope);
      } catch (err) {
        if (this.parent && this.parent.has(name)) {
          return this.parent.get(name, scope);
        }
        throw err;
      }
    };

    return child;
  }
}

// Create singleton instance
let globalContainer = new ServiceContainer();

/**
 * Get the global service container
 */
export function getContainer() {
  return globalContainer;
}

/**
 * Reset the global container (useful for testing)
 */
export function resetContainer() {
  globalContainer = new ServiceContainer();
  return globalContainer;
}

/**
 * Helper decorator for automatic dependency injection
 */
export function inject(...dependencies) {
  return function(target) {
    target.prototype.$inject = dependencies;
    return target;
  };
}

/**
 * Helper to resolve dependencies from class constructor
 */
export function resolveDependencies(Class) {
  return Class.prototype.$inject || [];
}

export default {
  ServiceContainer,
  ServiceScope,
  ServiceLifecycle,
  getContainer,
  resetContainer,
  inject,
  resolveDependencies
};
