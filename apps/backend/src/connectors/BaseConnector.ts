import type {
  ConnectorMetadata,
  ConnectorHealth,
  DiscoveryParams,
  ConnectorDiscoveryResult,
  ConnectorStatus,
} from './types.js';

export abstract class BaseConnector {
  abstract readonly metadata: ConnectorMetadata;

  protected healthState: ConnectorHealth = {
    sourceId: '',
    name: '',
    status: 'available',
    consecutiveFailures: 0,
    totalRecordsIngested: 0,
  };

  /**
   * Initializes health state from metadata
   */
  protected initHealth(): void {
    this.healthState.sourceId = this.metadata.id;
    this.healthState.name = this.metadata.name;
    this.healthState.status = this.metadata.isConfigured ? 'available' : 'missing_credentials';
  }

  /**
   * Validates connector configuration (API keys, reachability, or board slugs)
   */
  abstract validateConfig(): Promise<boolean>;

  /**
   * Performs an actual bounded discovery fetch against the external source
   */
  abstract discover(params: DiscoveryParams): Promise<ConnectorDiscoveryResult>;

  /**
   * Returns truthful current health diagnostics for this connector
   */
  getHealth(): ConnectorHealth {
    if (!this.healthState.sourceId) {
      this.initHealth();
    }
    return { ...this.healthState };
  }

  /**
   * Records a successful discovery run
   */
  recordSuccess(recordsCount: number): void {
    this.healthState.status = 'available';
    this.healthState.consecutiveFailures = 0;
    this.healthState.lastSuccessfulCollectionAt = new Date().toISOString();
    this.healthState.totalRecordsIngested += recordsCount;
    this.healthState.errorMessage = undefined;
  }

  /**
   * Records a failed collection attempt
   */
  recordFailure(error: Error | string, status: ConnectorStatus = 'failed'): void {
    this.healthState.status = status;
    this.healthState.consecutiveFailures += 1;
    this.healthState.lastFailedCollectionAt = new Date().toISOString();
    this.healthState.errorMessage = typeof error === 'string' ? error : error.message;
  }
}
