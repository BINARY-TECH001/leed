import type { IWhatsAppProvider } from '../types/index.js';
import { MockWhatsAppProvider } from './MockWhatsAppProvider.js';
import { MetaWhatsAppCloudProvider } from './MetaWhatsAppCloudProvider.js';

export * from './MockWhatsAppProvider.js';
export * from './MetaWhatsAppCloudProvider.js';

let activeProvider: IWhatsAppProvider | null = null;
const defaultMockProvider = new MockWhatsAppProvider();

/**
 * Returns the currently active WhatsApp provider.
 * Automatically selects MockWhatsAppProvider in test environments or when
 * WHATSAPP_DRY_RUN=true, otherwise using MetaWhatsAppCloudProvider.
 */
export const getWhatsAppProvider = (): IWhatsAppProvider => {
  if (activeProvider) {
    return activeProvider;
  }

  const isDryRun =
    process.env.WHATSAPP_DRY_RUN === 'true' ||
    process.env.NODE_ENV === 'test' ||
    !process.env.WHATSAPP_ACCESS_TOKEN ||
    !process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (isDryRun) {
    activeProvider = defaultMockProvider;
  } else {
    activeProvider = new MetaWhatsAppCloudProvider();
  }

  return activeProvider;
};

/**
 * Explicitly sets or overrides the active WhatsApp provider (e.g. for testing).
 */
export const setWhatsAppProvider = (provider: IWhatsAppProvider | null): void => {
  activeProvider = provider;
};
