import type { ITelegramProvider, InlineButton } from './ITelegramProvider.js';

export class TelegramBotProvider implements ITelegramProvider {
  private botToken: string;
  private isDryRun: boolean;
  public sentMessages: Array<{ chatId: string; text: string; buttons?: InlineButton[][]; timestamp: Date }> = [];

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.isDryRun = process.env.TELEGRAM_DRY_RUN === 'true' || !this.botToken;
  }

  async sendMessage(
    chatId: string,
    text: string,
    options?: {
      parseMode?: 'Markdown' | 'HTML';
      buttons?: InlineButton[][];
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    this.sentMessages.push({
      chatId,
      text,
      buttons: options?.buttons,
      timestamp: new Date(),
    });

    if (this.isDryRun) {
      const mockId = `tg_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      return { success: true, messageId: mockId };
    }

    try {
      const replyMarkup = options?.buttons
        ? {
            inline_keyboard: options.buttons.map((row) =>
              row.map((btn) => ({
                text: btn.text,
                callback_data: btn.callbackData,
                url: btn.url,
              }))
            ),
          }
        : undefined;

      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: options?.parseMode || 'Markdown',
          reply_markup: replyMarkup,
        }),
      });

      const data = (await response.json()) as any;
      if (!response.ok || !data.ok) {
        return { success: false, error: data.description || 'Telegram API request failed' };
      }

      return { success: true, messageId: String(data.result.message_id) };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
