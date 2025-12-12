import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { Agent } from 'node:https';
import * as crypto from 'node:crypto';
import Joi from 'joi';
import { TrashBinType } from 'src/entities/smart-trash/trash-bin-type.enum';
import { LLMRequestService } from './services/llm-request.service';
import { ConfigService } from '../config/config.service';

interface ClassifyWasteArgs {
  imageBuffer?: Buffer;
  imageFileName?: string;
  companyName?: string;
  areaName?: string;
  availableBinTypes: TrashBinType[];
}

interface ClassifyWasteResult {
  recommendedBinType: TrashBinType | null;
  explanation: string;
  raw: unknown;
}

interface GigaChatFileUploadResponse {
  id: string;
  object: string;
  bytes: number;
  created_at: number;
  filename: string;
  purpose: string;
}

@Injectable()
export class GigachatService {
  private readonly logger = new Logger(GigachatService.name);
  private readonly axiosClient: AxiosInstance;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl: string;
  private readonly tokenUrl: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(
    private readonly llmRequestService: LLMRequestService,
    private readonly configService: ConfigService,
  ) {
    const config = this.configService.config.gigachat;
    const apiKey = config.authKey;
    this.baseUrl = config.baseUrl;
    this.tokenUrl = config.authUrl || 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';

    const decodedKey = Buffer.from(apiKey, 'base64').toString('utf-8');
    const [clientId, clientSecret] = decodedKey.split(':');
    this.clientId = clientId;
    this.clientSecret = clientSecret;

    const httpsAgent = new Agent({
      rejectUnauthorized: config.rejectUnauthorized,
    });

    this.axiosClient = axios.create({
      baseURL: this.baseUrl,
      httpsAgent,
    });
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    try {
      const httpsAgent = new Agent({
        rejectUnauthorized: this.configService.config.gigachat.rejectUnauthorized,
      });

      const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const params = new URLSearchParams();
      params.append('scope', 'GIGACHAT_API_PERS');

      const response = await axios.post(
        this.tokenUrl,
        params.toString(),
        {
          httpsAgent,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${authHeader}`,
            'RqUID': crypto.randomUUID(),
            'Accept': 'application/json',
          },
        },
      );

      const expiresIn = response.data?.expires_in;
      if (typeof expiresIn === 'number' && expiresIn > 0) {
        this.tokenExpiresAt = Date.now() + (expiresIn - 60) * 1000;
      } else {
        this.logger.warn('Неверное значение expires_in, используем значение по умолчанию 1 час');
        this.tokenExpiresAt = Date.now() + 3600 * 1000;
      }

      this.accessToken = response.data?.access_token;
      if (!this.accessToken) {
        throw new Error('Не удалось получить access_token от GigaChat');
      }

      this.logger.log('OAuth токен успешно получен от GigaChat');
      return this.accessToken;
    } catch (error) {
      this.logger.error(`Ошибка получения OAuth токена: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        `Не удалось получить OAuth токен от GigaChat: ${error.message}`,
      );
    }
  }

  async uploadFile(fileBuffer: Buffer, fileName: string): Promise<string> {
    try {
      const accessToken = await this.getAccessToken();
      
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: 'image/jpeg',
      });
      formData.append('purpose', 'vision');

      const response = await this.axiosClient.post<GigaChatFileUploadResponse>(
        '/files',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.data?.id) {
        throw new Error('GigaChat не вернул ID файла после загрузки');
      }

      this.logger.log(
        `Файл успешно загружен в GigaChat: ${response.data.id}, размер: ${response.data.bytes} байт`,
      );

      return response.data.id;
    } catch (error) {
      this.logger.error(
        `Ошибка загрузки файла в GigaChat: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Не удалось загрузить файл в GigaChat: ${error.message}`,
      );
    }
  }

  async classifyWaste(args: ClassifyWasteArgs): Promise<ClassifyWasteResult> {
    const binsList = args.availableBinTypes.join(', ');

    const systemPromptParts: string[] = [];
    systemPromptParts.push(
      'Ты эксперт по раздельному сбору отходов. Твоя задача – по изображению мусора выбрать один из заранее заданных типов контейнера.',
    );
    systemPromptParts.push(
      this.llmRequestService.getComplianceWarningPrompt(),
    );

    const humanPromptParts: string[] = [];
    humanPromptParts.push(
      `Доступные типы контейнеров: ${binsList}. Не придумывай других типов.`,
    );
    if (args.companyName) {
      humanPromptParts.push(
        `Компания: ${args.companyName}. Учитывай, что набор контейнеров ограничен именно для этой компании.`,
      );
    }
    if (args.areaName) {
      humanPromptParts.push(
        `Область сбора: ${args.areaName}.`,
      );
    }
    humanPromptParts.push(
      'Проанализируй изображение мусора и определи, в какой контейнер его следует выбросить.',
    );

    const systemPrompt = systemPromptParts.join('\n\n');
    const userQuery = humanPromptParts.join(' ');

    let fileId: string | undefined;

    if (args.imageBuffer) {
      const fileName = args.imageFileName || 'waste-photo.jpg';
      fileId = await this.uploadFile(args.imageBuffer, fileName);
    }

    let contentText: string;

    if (fileId) {
      const accessToken = await this.getAccessToken();
      
      const chatCompletionsResponse = await this.axiosClient.post(
        '/chat/completions',
        {
          model: this.configService.config.gigachat.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userQuery,
              attachments: [fileId],
            },
          ],
          temperature: 0,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const message = chatCompletionsResponse.data?.choices?.[0]?.message;
      if (!message) {
        throw new Error('GigaChat не вернул ответ в запросе с файлом');
      }

      contentText = message.content || '';
    } else {
      contentText = await this.llmRequestService.request({
        systemPrompt,
        userQuery,
      });
    }

    const schema = Joi.object({
      binType: Joi.string()
        .valid(...Object.values(TrashBinType))
        .required(),
      explanation: Joi.string().required(),
    });

    const validation = this.llmRequestService.validateJsonResponse<{
      binType: string;
      explanation: string;
    }>(contentText, schema);

    if (validation.isValid && validation.data) {
      return {
        recommendedBinType: validation.data.binType as TrashBinType,
        explanation: validation.data.explanation,
        raw: contentText,
      };
    }

    const retryPrompt = 'Ответ должен быть строго в формате JSON: {"binType":"<ТИП_КОНТЕЙНЕРА>","explanation":"Краткое объяснение на русском"}. Тип контейнера должен быть одним из: ' + binsList + '.';

    if (fileId) {
      const retrySystemPrompt = `${systemPrompt}

---

${retryPrompt}

ТВОЙ ПРЕДЫДУЩИЙ НЕПРАВИЛЬНЫЙ ОТВЕТ:

${contentText}

ИСПРАВЬ ЕГО СОГЛАСНО ИНСТРУКЦИЯМ ВЫШЕ!`;

      const accessToken = await this.getAccessToken();
      
      const retryResponse = await this.axiosClient.post(
        '/chat/completions',
        {
          model: this.configService.config.gigachat.model,
          messages: [
            {
              role: 'system',
              content: retrySystemPrompt,
            },
            {
              role: 'user',
              content: userQuery,
              attachments: [fileId],
            },
          ],
          temperature: 0,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const retryMessage = retryResponse.data?.choices?.[0]?.message;
      if (retryMessage) {
        const retryContentText = retryMessage.content || '';
        const retryValidation = this.llmRequestService.validateJsonResponse<{
          binType: string;
          explanation: string;
        }>(retryContentText, schema);

        if (retryValidation.isValid && retryValidation.data) {
          return {
            recommendedBinType: retryValidation.data.binType as TrashBinType,
            explanation: retryValidation.data.explanation,
            raw: retryContentText,
          };
        }
      }

      throw new Error(
        `Не удалось классифицировать мусор после 2 попыток. Ошибка: ${validation.error}`,
      );
    }

    const validatedResult = await this.llmRequestService.requestAndValidate<{
      binType: string;
      explanation: string;
    }>({
      systemPrompt,
      userQuery,
      retryPromptBuilder: () => retryPrompt,
      validator: (response) =>
        this.llmRequestService.validateJsonResponse(response, schema),
      errorMessage: 'Не удалось классифицировать мусор',
      logPrefix: 'классификация мусора',
    });

    return {
      recommendedBinType: validatedResult.binType as TrashBinType,
      explanation: validatedResult.explanation,
      raw: contentText,
    };
  }
}



