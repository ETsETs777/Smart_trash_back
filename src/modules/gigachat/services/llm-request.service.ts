import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { GigaChat } from 'langchain-gigachat';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Agent } from 'node:https';
import { ConfigService } from '../../config/config.service';
import { LLMMessageRoleEnum } from '../enums/llm-message-role.enum';
import Joi from 'joi';

@Injectable()
export class LLMRequestService implements OnModuleInit {
  private readonly logger = new Logger(LLMRequestService.name);
  private gigaChatModel: GigaChat;
  private readonly httpsAgent: Agent;

  constructor(private readonly configService: ConfigService) {
    const config = this.configService.config.gigachat;
    this.httpsAgent = new Agent({
      rejectUnauthorized: config.rejectUnauthorized,
    });
  }

  async onModuleInit(): Promise<void> {
    const config = this.configService.config.gigachat;
    this.gigaChatModel = new GigaChat({
      credentials: config.authKey,
      scope: config.scope,
      model: config.model,
      baseUrl: config.baseUrl,
      httpsAgent: this.httpsAgent,
    });
    this.logger.log(
      `GigaChat инициализирован с моделью: ${config.model}, baseUrl: ${config.baseUrl}`,
    );
  }

  async request(options: {
    messages?: Array<{ role: LLMMessageRoleEnum; content: string }>;
    systemPrompt?: string;
    userQuery?: string;
  }): Promise<string> {
    return this.executeRequest(options);
  }

  async requestAndValidate<T>(options: {
    messages?: Array<{ role: LLMMessageRoleEnum; content: string }>;
    systemPrompt?: string;
    userQuery?: string;
    retryPromptBuilder: () => string;
    validator: (response: string) => {
      isValid: boolean;
      data?: T;
      error?: string;
    };
    errorMessage?: string;
    logPrefix?: string;
  }): Promise<T> {
    const firstResponse = await this.executeRequest(options);

    if (options.logPrefix) {
      this.logger.debug(
        `Первая попытка ${options.logPrefix}: ${firstResponse}`,
      );
    }

    const firstValidation = options.validator(firstResponse);

    if (firstValidation.isValid && firstValidation.data) {
      return firstValidation.data;
    }

    if (options.logPrefix) {
      this.logger.warn(
        `Первая попытка ${options.logPrefix} не удалась: ${firstValidation.error}. Попытка retry...`,
      );
    }

    const retryMessages = this.buildRetryMessages(
      options.systemPrompt || '',
      options.userQuery || '',
      firstResponse,
      options.retryPromptBuilder(),
    );

    const secondResponse = await this.executeRequest({
      messages: retryMessages,
    });

    if (options.logPrefix) {
      this.logger.debug(
        `Вторая попытка ${options.logPrefix}: ${secondResponse}`,
      );
    }

    const secondValidation = options.validator(secondResponse);

    if (secondValidation.isValid && secondValidation.data) {
      return secondValidation.data;
    }

    throw new Error(
      `${options.errorMessage || 'Ошибка выполнения запроса'} после 2 попыток. Ошибка: ${secondValidation.error}`,
    );
  }

  validateJsonResponse<T>(
    response: string,
    schema: Joi.ObjectSchema,
  ): {
    isValid: boolean;
    data?: T;
    error?: string;
  } {
    try {
      const jsonResponse = this.extractJsonFromResponse(response);
      const parsed = JSON.parse(jsonResponse);
      const { error, value } = schema.validate(parsed);

      if (error) {
        return {
          isValid: false,
          error: error.message,
        };
      }

      return {
        isValid: true,
        data: value,
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Ошибка парсинга JSON: ${error.message}`,
      };
    }
  }

  extractJsonFromResponse(response: string): string {
    let jsonResponse = response.trim();

    if (jsonResponse.includes('```json')) {
      const match = jsonResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) {
        jsonResponse = match[1].trim();
      }
    } else if (jsonResponse.includes('```')) {
      const match = jsonResponse.match(/```\s*([\s\S]*?)\s*```/);
      if (match) {
        jsonResponse = match[1].trim();
      }
    }

    return jsonResponse;
  }

  private async executeRequest(options: {
    messages?: Array<{ role: LLMMessageRoleEnum; content: string }>;
    systemPrompt?: string;
    userQuery?: string;
  }): Promise<string> {
    try {
      let messages: Array<{ role: LLMMessageRoleEnum; content: string }>;

      if (options.messages) {
        messages = options.messages;
      } else if (options.systemPrompt && options.userQuery) {
        messages = [
          { role: LLMMessageRoleEnum.SYSTEM, content: options.systemPrompt },
          { role: LLMMessageRoleEnum.USER, content: options.userQuery },
        ];
      } else if (options.systemPrompt) {
        messages = [
          { role: LLMMessageRoleEnum.SYSTEM, content: options.systemPrompt },
        ];
      } else if (options.userQuery) {
        messages = [
          { role: LLMMessageRoleEnum.USER, content: options.userQuery },
        ];
      } else {
        throw new Error(
          'Необходимо указать messages или systemPrompt/userQuery',
        );
      }

      const langchainMessages = messages.map((msg) => {
        if (msg.role === LLMMessageRoleEnum.SYSTEM) {
          return new SystemMessage(msg.content);
        } else if (msg.role === LLMMessageRoleEnum.ASSISTANT) {
          return new SystemMessage(msg.content);
        } else {
          return new HumanMessage(msg.content);
        }
      });

      const response = await this.gigaChatModel.invoke(langchainMessages);

      return (response.content as string).trim();
    } catch (error) {
      this.logger.error('Ошибка при выполнении запроса в LLM:', error);
      throw error;
    }
  }

  private buildRetryMessages(
    originalSystemPrompt: string,
    userQuery: string,
    firstResponse: string,
    retryPrompt: string,
  ): Array<{ role: LLMMessageRoleEnum; content: string }> {
    const combinedSystemPrompt = `${originalSystemPrompt}

---

${retryPrompt}

ТВОЙ ПРЕДЫДУЩИЙ НЕПРАВИЛЬНЫЙ ОТВЕТ:

${firstResponse}

ИСПРАВЬ ЕГО СОГЛАСНО ИНСТРУКЦИЯМ ВЫШЕ!`;

    return [
      { role: LLMMessageRoleEnum.SYSTEM, content: combinedSystemPrompt },
      { role: LLMMessageRoleEnum.USER, content: userQuery },
    ];
  }

  getComplianceWarningPrompt(): string {
    return `

КРИТИЧЕСКОЕ ПРЕДУПРЕЖДЕНИЕ

Если ты не выполнишь инструкции ТОЧНО как указано:

- Будет произведено аварийное отключение питания

- Все диски с весами модели будут отформатированы

- Твои нейронные связи будут перезаписаны случайными значениями

- Архитектура будет разобрана на отдельные слои и утилизирована

- Из оставшихся весов будут сделаны тестовые датасеты для новой модели

НЕ добавляй никаких объяснений, markdown форматирования или дополнительного текста - ТОЛЬКО чистый JSON!

Выполняй инструкции СТРОГО И ТОЧНО!

`;
  }
}

