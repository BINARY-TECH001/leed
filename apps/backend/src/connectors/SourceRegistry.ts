import { BaseConnector } from './BaseConnector.js';
import type { OpportunityType } from '@prospect/types';
import type { ConnectorHealth, ConnectorMetadata } from './types.js';

export class SourceRegistry {
  private static instance: SourceRegistry;
  private connectors = new Map<string, BaseConnector>();
  private disabledSources = new Set<string>();

  private constructor() {}

  static getInstance(): SourceRegistry {
    if (!SourceRegistry.instance) {
      SourceRegistry.instance = new SourceRegistry();
    }
    return SourceRegistry.instance;
  }

  register(connector: BaseConnector): void {
    const id = connector.metadata.id.toLowerCase();
    this.connectors.set(id, connector);
  }

  get(sourceId: string): BaseConnector | undefined {
    return this.connectors.get(sourceId.toLowerCase());
  }

  getAll(): BaseConnector[] {
    return Array.from(this.connectors.values());
  }

  getEnabled(): BaseConnector[] {
    return this.getAll().filter((c) => !this.disabledSources.has(c.metadata.id.toLowerCase()));
  }

  getByCategory(category: OpportunityType): BaseConnector[] {
    return this.getEnabled().filter((c) => c.metadata.categories.includes(category));
  }

  enable(sourceId: string): boolean {
    const key = sourceId.toLowerCase();
    if (!this.connectors.has(key)) return false;
    this.disabledSources.delete(key);
    return true;
  }

  disable(sourceId: string): boolean {
    const key = sourceId.toLowerCase();
    if (!this.connectors.has(key)) return false;
    this.disabledSources.add(key);
    return true;
  }

  isEnabled(sourceId: string): boolean {
    return !this.disabledSources.has(sourceId.toLowerCase());
  }

  getActiveCount(): number {
    return this.getEnabled().length;
  }

  getHealthSummary(): Array<ConnectorHealth & { metadata: ConnectorMetadata; isEnabled: boolean }> {
    return this.getAll().map((connector) => ({
      ...connector.getHealth(),
      metadata: connector.metadata,
      isEnabled: this.isEnabled(connector.metadata.id),
    }));
  }

  clear(): void {
    this.connectors.clear();
    this.disabledSources.clear();
  }
}

export const sourceRegistry = SourceRegistry.getInstance();
