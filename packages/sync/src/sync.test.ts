import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SyncConnection, createSyncConnection, type SyncContext } from './sync.js';

describe('SyncConnection', () => {
  let mockCtx: SyncContext;
  let syncConnection: SyncConnection;
  
  beforeEach(() => {
    mockCtx = {
      get: (key: string) => {
        switch (key) {
          case 'storage':
            return { mock: 'storage' };
          case 'security':
            return { mock: 'security' };
          default:
            return undefined;
        }
      }
    };
    
    syncConnection = new SyncConnection(mockCtx, {
      endpoint: 'ws://localhost:8080',
      authToken: 'test-token'
    });
  });
  
  describe('connect', () => {
    it('should connect successfully', async () => {
      expect(syncConnection.isConnectionActive()).toBe(false);
      
      await syncConnection.connect();
      
      expect(syncConnection.isConnectionActive()).toBe(true);
      expect(syncConnection.getStatus()).toBe('connected');
    });
    
    it('should not connect if already connected', async () => {
      await syncConnection.connect();
      
      // Should not throw if already connected
      await syncConnection.connect();
      
      expect(syncConnection.isConnectionActive()).toBe(true);
    });
  });
  
  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      await syncConnection.connect();
      expect(syncConnection.isConnectionActive()).toBe(true);
      
      await syncConnection.disconnect();
      
      expect(syncConnection.isConnectionActive()).toBe(false);
      expect(syncConnection.getStatus()).toBe('disconnected');
    });
    
    it('should not disconnect if not connected', async () => {
      // Should not throw if not connected
      await syncConnection.disconnect();
      
      expect(syncConnection.isConnectionActive()).toBe(false);
    });
  });
  
  describe('getStatus', () => {
    it('should return disconnected status initially', () => {
      expect(syncConnection.getStatus()).toBe('disconnected');
    });
    
    it('should return connected status after connecting', async () => {
      await syncConnection.connect();
      expect(syncConnection.getStatus()).toBe('connected');
    });
    
    it('should return disconnected status after disconnecting', async () => {
      await syncConnection.connect();
      await syncConnection.disconnect();
      expect(syncConnection.getStatus()).toBe('disconnected');
    });
  });
});

describe('createSyncConnection', () => {
  it('should create a new SyncConnection instance', () => {
    const mockCtx: SyncContext = {
      get: () => undefined
    };
    
    const connection = createSyncConnection(mockCtx, { endpoint: 'ws://test' });
    
    expect(connection).toBeInstanceOf(SyncConnection);
    expect(connection.isConnectionActive()).toBe(false);
  });
});

describe('SyncConnection - push/pull/applyRemote', () => {
  let mockCtx: SyncContext;
  let syncConnection: SyncConnection;
  let mockStorage: any;
  let mockSecurity: any;
  
  beforeEach(() => {
    mockStorage = {
      getData: vi.fn().mockResolvedValue({ data: 'local-data', timestamp: Date.now() }),
      setData: vi.fn().mockResolvedValue(undefined)
    };
    
    mockSecurity = {
      secureData: vi.fn().mockResolvedValue({ data: 'secured-data', encrypted: true }),
      unsecureData: vi.fn().mockResolvedValue({ data: 'unsecured-data', decrypted: true })
    };
    
    mockCtx = {
      get: (key: string) => {
        switch (key) {
          case 'storage':
            return mockStorage;
          case 'security':
            return mockSecurity;
          default:
            return undefined;
        }
      }
    };
    
    syncConnection = new SyncConnection(mockCtx, {
      endpoint: 'ws://localhost:8080',
      authToken: 'test-token'
    });
  });
  
  describe('push', () => {
    it('should push local data to remote server', async () => {
      await syncConnection.connect();
      
      await syncConnection.push();
      
      expect(mockStorage.getData).toHaveBeenCalled();
      expect(mockSecurity.secureData).toHaveBeenCalledWith({ data: 'local-data', timestamp: expect.any(Number) });
    });
    
    it('should throw error if not connected', async () => {
      await expect(syncConnection.push()).rejects.toThrow('Not connected to sync server');
    });
    
    it('should throw error if storage module not available', async () => {
      await syncConnection.connect();
      
      const ctxWithoutStorage: SyncContext = {
        get: () => undefined
      };
      const connectionWithoutStorage = new SyncConnection(ctxWithoutStorage);
      await connectionWithoutStorage.connect();
      
      await expect(connectionWithoutStorage.push()).rejects.toThrow('Storage module not available');
    });
    
    it('should throw error if security module not available', async () => {
      await syncConnection.connect();
      
      const ctxWithoutSecurity: SyncContext = {
        get: (key) => key === 'storage' ? mockStorage : undefined
      };
      const connectionWithoutSecurity = new SyncConnection(ctxWithoutSecurity);
      await connectionWithoutSecurity.connect();
      
      await expect(connectionWithoutSecurity.push()).rejects.toThrow('Security module not available');
    });
  });
  
  describe('pull', () => {
    it('should pull remote data and store locally', async () => {
      await syncConnection.connect();
      
      await syncConnection.pull();
      
      expect(mockSecurity.unsecureData).toHaveBeenCalledWith({ mock: 'remote-data', timestamp: expect.any(Number) });
      expect(mockStorage.setData).toHaveBeenCalledWith({ data: 'unsecured-data', decrypted: true });
    });
    
    it('should throw error if not connected', async () => {
      await expect(syncConnection.pull()).rejects.toThrow('Not connected to sync server');
    });
    
    it('should throw error if storage module not available', async () => {
      await syncConnection.connect();
      
      const ctxWithoutStorage: SyncContext = {
        get: () => undefined
      };
      const connectionWithoutStorage = new SyncConnection(ctxWithoutStorage);
      await connectionWithoutStorage.connect();
      
      await expect(connectionWithoutStorage.pull()).rejects.toThrow('Storage module not available');
    });
    
    it('should throw error if security module not available', async () => {
      await syncConnection.connect();
      
      const ctxWithoutSecurity: SyncContext = {
        get: (key) => key === 'storage' ? mockStorage : undefined
      };
      const connectionWithoutSecurity = new SyncConnection(ctxWithoutSecurity);
      await connectionWithoutSecurity.connect();
      
      await expect(connectionWithoutSecurity.pull()).rejects.toThrow('Security module not available');
    });
  });
  
  describe('applyRemote', () => {
    it('should apply remote data to local storage', async () => {
      await syncConnection.connect();
      
      const remoteData = { data: 'remote-test-data', version: 2 };
      
      await syncConnection.applyRemote(remoteData);
      
      expect(mockSecurity.unsecureData).toHaveBeenCalledWith(remoteData);
      expect(mockStorage.setData).toHaveBeenCalledWith({ data: 'unsecured-data', decrypted: true });
    });
    
    it('should throw error if not connected', async () => {
      const remoteData = { data: 'remote-test-data', version: 2 };
      
      await expect(syncConnection.applyRemote(remoteData)).rejects.toThrow('Not connected to sync server');
    });
    
    it('should throw error if storage module not available', async () => {
      await syncConnection.connect();
      
      const ctxWithoutStorage: SyncContext = {
        get: () => undefined
      };
      const connectionWithoutStorage = new SyncConnection(ctxWithoutStorage);
      await connectionWithoutStorage.connect();
      
      const remoteData = { data: 'remote-test-data', version: 2 };
      
      await expect(connectionWithoutStorage.applyRemote(remoteData)).rejects.toThrow('Storage module not available');
    });
    
    it('should throw error if security module not available', async () => {
      await syncConnection.connect();
      
      const ctxWithoutSecurity: SyncContext = {
        get: (key) => key === 'storage' ? mockStorage : undefined
      };
      const connectionWithoutSecurity = new SyncConnection(ctxWithoutSecurity);
      await connectionWithoutSecurity.connect();
      
      const remoteData = { data: 'remote-test-data', version: 2 };
      
      await expect(connectionWithoutSecurity.applyRemote(remoteData)).rejects.toThrow('Security module not available');
    });
  });
});