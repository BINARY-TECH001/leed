import { TelegramBotProvider } from './TelegramBotProvider.js';
import { ResendEmailProvider } from './ResendEmailProvider.js';
import { ExpoPushProvider } from './ExpoPushProvider.js';
import type { ITelegramProvider } from './ITelegramProvider.js';
import type { IEmailProvider } from './IEmailProvider.js';
import type { IPushProvider } from './IPushProvider.js';

let telegramProviderInstance: ITelegramProvider = new TelegramBotProvider();
let emailProviderInstance: IEmailProvider = new ResendEmailProvider();
let pushProviderInstance: IPushProvider = new ExpoPushProvider();

export const getTelegramProvider = (): ITelegramProvider => telegramProviderInstance;
export const setTelegramProvider = (provider: ITelegramProvider) => {
  telegramProviderInstance = provider;
};

export const getEmailProvider = (): IEmailProvider => emailProviderInstance;
export const setEmailProvider = (provider: IEmailProvider) => {
  emailProviderInstance = provider;
};

export const getPushProvider = (): IPushProvider => pushProviderInstance;
export const setPushProvider = (provider: IPushProvider) => {
  pushProviderInstance = provider;
};

export * from './ITelegramProvider.js';
export * from './TelegramBotProvider.js';
export * from './IEmailProvider.js';
export * from './ResendEmailProvider.js';
export * from './IPushProvider.js';
export * from './ExpoPushProvider.js';
