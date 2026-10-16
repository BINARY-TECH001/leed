import { sourceRegistry } from './SourceRegistry.js';
import { GreenhouseConnector } from './GreenhouseConnector.js';
import { ArbeitnowConnector } from './ArbeitnowConnector.js';
import { OpenStreetMapConnector } from './OpenStreetMapConnector.js';
import { GooglePlacesConnector } from './GooglePlacesConnector.js';
import { OpenGrantsConnector } from './OpenGrantsConnector.js';

export * from './types.js';
export * from './BaseConnector.js';
export * from './SourceRegistry.js';
export * from './GreenhouseConnector.js';
export * from './ArbeitnowConnector.js';
export * from './OpenStreetMapConnector.js';
export * from './GooglePlacesConnector.js';
export * from './OpenGrantsConnector.js';

// Auto-register official connectors into the global source registry
export const registerDefaultConnectors = (): void => {
  if (!sourceRegistry.get('greenhouse')) {
    sourceRegistry.register(new GreenhouseConnector());
  }
  if (!sourceRegistry.get('arbeitnow')) {
    sourceRegistry.register(new ArbeitnowConnector());
  }
  if (!sourceRegistry.get('openstreetmap')) {
    sourceRegistry.register(new OpenStreetMapConnector());
  }
  if (!sourceRegistry.get('google_places')) {
    sourceRegistry.register(new GooglePlacesConnector());
  }
  if (!sourceRegistry.get('open_grants')) {
    sourceRegistry.register(new OpenGrantsConnector());
  }
};

registerDefaultConnectors();
