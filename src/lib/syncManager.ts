import { saveUserConfig, savePlanDocument, deletePlanDocument, saveLegacyUserBaseData, saveLegacySessionToDb } from './db';

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'offline' | 'error';

interface SyncTask {
  id: string; // e.g., 'config', 'subjects/123', 'topics/456'
  execute: () => Promise<void>;
  retries: number;
}

class SyncManager {
  private queue: Map<string, SyncTask> = new Map();
  private isProcessing = false;
  private online = typeof navigator !== 'undefined' && 'onLine' in navigator ? navigator.onLine : true;

  public status: SyncStatus = 'idle';
  public pendingCount = 0;
  public errorMessage: string | null = null;
  public lastSyncTime: Date | null = null;

  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.online = true;
        if (this.queue.size > 0) this.processQueue();
        else this.updateStatus('idle');
      });
      window.addEventListener('offline', () => {
        this.online = false;
        this.updateStatus('offline');
      });
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.pendingCount = this.queue.size;
    this.listeners.forEach(l => l());
  }

  private updateStatus(newStatus: SyncStatus, error: string | null = null) {
    this.status = newStatus;
    this.errorMessage = error;
    if (newStatus === 'saved') {
      this.lastSyncTime = new Date();
    }
    this.notify();
  }

  public enqueue(id: string, execute: () => Promise<void>) {
    this.queue.set(id, { id, execute, retries: 0 });
    this.notify();
    this.processQueue();
  }

  public async processQueue() {
    if (this.isProcessing) return;
    if (!this.online) {
      if (this.queue.size > 0) this.updateStatus('offline');
      return;
    }
    if (this.queue.size === 0) {
      return;
    }

    this.isProcessing = true;
    this.updateStatus('saving');

    try {
      while (this.queue.size > 0 && this.online) {
        const [id, task] = this.queue.entries().next().value;
        try {
          await task.execute();
          if (this.queue.get(id) === task) {
            this.queue.delete(id);
          }
          this.notify();
        } catch (error: any) {
          if (this.queue.get(id) !== task) {
            continue;
          }
          console.error(`Sync error for ${id}:`, error);
          if (error.message?.toLowerCase().includes('offline') || error.code === 'unavailable') {
            this.online = false;
            this.updateStatus('offline', 'Sem conexão');
            break;
          }
          task.retries++;
          if (task.retries > 3) {
            this.updateStatus('error', error.message || 'Erro ao salvar');
            this.isProcessing = false;
            return; // Halt processing on persistent error
          }
          await new Promise(r => setTimeout(r, 1000 * task.retries));
        }
      }
    } finally {
      this.isProcessing = false;
      if (this.queue.size === 0 && this.status === 'saving') {
        this.updateStatus('saved');
        setTimeout(() => {
          if (this.queue.size === 0 && this.status === 'saved') {
            this.updateStatus('idle');
          }
        }, 3000);
      }
    }
  }

  public forceRetry() {
    this.status = 'idle';
    this.errorMessage = null;
    this.online = true; // Assume online for retry attempt
    for (const task of this.queue.values()) {
      task.retries = 0;
    }
    this.processQueue();
  }
}

export const syncManager = new SyncManager();

import { useState, useEffect } from 'react';

export function useSyncStatus() {
  const [state, setState] = useState({
    status: syncManager.status,
    pendingCount: syncManager.pendingCount,
    errorMessage: syncManager.errorMessage,
    lastSyncTime: syncManager.lastSyncTime
  });

  useEffect(() => {
    const unsubscribe = syncManager.subscribe(() => {
      setState({
        status: syncManager.status,
        pendingCount: syncManager.pendingCount,
        errorMessage: syncManager.errorMessage,
        lastSyncTime: syncManager.lastSyncTime
      });
    });
    return unsubscribe;
  }, []);

  return state;
}
