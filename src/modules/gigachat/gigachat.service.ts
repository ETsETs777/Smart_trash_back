import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { GigaChat } from 'langchain-gigachat';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { TrashBinType } from 'src/entities/smart-trash/trash-bin-type.enum';

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
  private readonly model: GigaChat;
  private readonly axiosClient: AxiosInstance;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.GIGACHAT_API_KEY!;
    this.baseUrl = process.env.GIGACHAT_BASE_URL || 'https://gigachat.devices.sberbank.ru/api/v1';

    this.model = new GigaChat({
      credentials: this.apiKey,
      baseUrl: this.baseUrl,
      model: process.env.GIGACHAT_MODEL || 'GigaChat',
      temperature: 0,
    });

    this.axiosClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });
  }

  async uploadFile(fileBuffer: Buffer, fileName: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: 'image/jpeg',
      });
      formData.append('purpose', 'general');

      const response = await this.axiosClient.post<GigaChatFileUploadResponse>(
        '/files',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
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
    const systemPrompt =
      'Ты эксперт по раздельному сбору отходов. Твоя задача – по изображению мусора выбрать один из заранее заданных типов контейнера.';

    const binsList = args.availableBinTypes.join(', ');

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
    humanPromptParts.push(
      'Ответ верни строго в формате JSON: {"binType":"<ТИП_КОНТЕЙНЕРА>","explanation":"Краткое объяснение на русском"}.',
    );

    const humanPrompt = humanPromptParts.join(' ');

    let fileId: string | undefined;

    if (args.imageBuffer) {
      const fileName = args.imageFileName || 'waste-photo.jpg';
      fileId = await this.uploadFile(args.imageBuffer, fileName);
    }

    let response;

    if (fileId) {
      const chatCompletionsResponse = await this.axiosClient.post(
        '/chat/completions',
        {
          model: process.env.GIGACHAT_MODEL || 'GigaChat',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: humanPrompt,
              attachments: [fileId],
            },
          ],
          temperature: 0,
        },
      );

      const message = chatCompletionsResponse.data?.choices?.[0]?.message;
      if (!message) {
        throw new Error('GigaChat не вернул ответ в запросе с файлом');
      }

      response = {
        content: message.content || '',
      };
    } else {
      response = await this.model.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(humanPrompt),
      ]);
    }

    const contentText =
      typeof response.content === 'string'
        ? response.content
        : Array.isArray(response.content)
        ? response.content.map((part) => (typeof part === 'string' ? part : JSON.stringify(part))).join(' ')
        : JSON.stringify(response.content);

    let recommended: TrashBinType | null = null;
    let explanation = '';

    try {
      const jsonStart = contentText.indexOf('{');
      const jsonEnd = contentText.lastIndexOf('}');
      const jsonString =
        jsonStart >= 0 && jsonEnd > jsonStart
          ? contentText.substring(jsonStart, jsonEnd + 1)
          : contentText;
      const parsed = JSON.parse(jsonString) as {
        binType?: string;
        explanation?: string;
      };

      if (parsed.binType) {
        const upper = parsed.binType.toUpperCase().trim();
        const candidate = Object.values(TrashBinType).find(
          (value) => value.toString().toUpperCase() === upper,
        );
        if (candidate) {
          recommended = candidate;
        }
      }
      if (parsed.explanation) {
        explanation = parsed.explanation;
      }
    } catch {
      explanation = contentText;
    }

    return {
      recommendedBinType: recommended,
      explanation,
      raw: contentText,
    };
  }
}


