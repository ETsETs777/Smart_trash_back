import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from 'src/modules/config/config.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const smtpConfig = this.configService.config.smtp;

    this.transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.auth.user,
        pass: smtpConfig.auth.pass,
      },
    });

    this.logger.log(
      `SMTP транспортер настроен для ${smtpConfig.host}:${smtpConfig.port}`,
    );
  }

  async sendConfirmationEmail(
    email: string,
    fullName: string,
    token: string,
  ): Promise<void> {
    const smtpConfig = this.configService.config.smtp;
    const baseUrl = this.configService.config.filesUrl.replace('/files/', '');
    const confirmationUrl = `${baseUrl}/confirm-email?token=${token}`;

    const mailOptions: nodemailer.SendMailOptions = {
      from: smtpConfig.from,
      to: email,
      subject: 'Подтверждение электронной почты',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Подтверждение электронной почты</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: #2c3e50; margin-top: 0;">Подтверждение электронной почты</h1>
          </div>
          <div style="background-color: #fff; padding: 20px; border-radius: 5px; border: 1px solid #ddd;">
            <p>Здравствуйте, <strong>${fullName}</strong>!</p>
            <p>Благодарим вас за регистрацию в системе умных урн.</p>
            <p>Для завершения регистрации и активации вашего аккаунта, пожалуйста, подтвердите ваш адрес электронной почты, перейдя по ссылке ниже:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" style="background-color: #3498db; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Подтвердить email</a>
            </div>
            <p>Или скопируйте и вставьте следующую ссылку в браузер:</p>
            <p style="word-break: break-all; color: #3498db; font-size: 12px;">${confirmationUrl}</p>
            <p style="margin-top: 30px; font-size: 12px; color: #7f8c8d;">
              Если вы не регистрировались в системе, просто проигнорируйте это письмо.
            </p>
          </div>
          <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #7f8c8d;">
            <p>© ${new Date().getFullYear()} Система умных урн. Все права защищены.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Здравствуйте, ${fullName}!

        Благодарим вас за регистрацию в системе умных урн.

        Для завершения регистрации и активации вашего аккаунта, пожалуйста, подтвердите ваш адрес электронной почты, перейдя по ссылке:

        ${confirmationUrl}

        Если вы не регистрировались в системе, просто проигнорируйте это письмо.

        © ${new Date().getFullYear()} Система умных урн. Все права защищены.
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Письмо подтверждения отправлено на ${email}. MessageId: ${info.messageId}`,
      );
    } catch (error) {
      this.logger.error(`Ошибка при отправке письма на ${email}:`, error);
      throw error;
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP соединение успешно проверено');
      return true;
    } catch (error) {
      this.logger.error('Ошибка проверки SMTP соединения:', error);
      return false;
    }
  }
}
