import { Controller, Get, Query, Res, BadRequestException, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';
import { AuthService } from './modules/auth/auth.service';
import { Public } from './decorators/auth/public.decorator';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('confirm-email')
  async confirmEmail(
    @Query('token') token: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!token) {
      throw new BadRequestException('Токен подтверждения не предоставлен');
    }

    try {
      await this.authService.confirmEmail({ token });
      
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email подтверждён</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background-color: #fff;
              padding: 30px;
              border-radius: 5px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              text-align: center;
            }
            h1 {
              color: #27ae60;
              margin-top: 0;
            }
            .success-icon {
              font-size: 64px;
              color: #27ae60;
              margin-bottom: 20px;
            }
            p {
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✓</div>
            <h1>Электронная почта успешно подтверждена!</h1>
            <p>Ваш адрес электронной почты был успешно подтверждён. Теперь вы можете войти в систему.</p>
            <p>Вы можете закрыть это окно.</p>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        res.status(400).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ошибка подтверждения</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 50px auto;
                padding: 20px;
                background-color: #f4f4f4;
              }
              .container {
                background-color: #fff;
                padding: 30px;
                border-radius: 5px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                text-align: center;
              }
              h1 {
                color: #e74c3c;
                margin-top: 0;
              }
              .error-icon {
                font-size: 64px;
                color: #e74c3c;
                margin-bottom: 20px;
              }
              p {
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="error-icon">✗</div>
              <h1>Ошибка подтверждения</h1>
              <p>${error.message}</p>
              <p>Пожалуйста, проверьте ссылку или обратитесь в службу поддержки.</p>
            </div>
          </body>
          </html>
        `);
      } else {
        throw error;
      }
    }
  }
}
