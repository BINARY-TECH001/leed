export interface InlineButton {
  text: string;
  callbackData?: string;
  url?: string;
}

export interface ITelegramProvider {
  sendMessage(
    chatId: string,
    text: string,
    options?: {
      parseMode?: 'Markdown' | 'HTML';
      buttons?: InlineButton[][];
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }>;
}
