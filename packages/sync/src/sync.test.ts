import { describe, it, expect, beforeEach } from 'vitest';
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