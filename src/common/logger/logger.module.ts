import { Module } from '@nestjs/common'
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino'
import { ConfigService } from '../../modules/config/config.service'

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isDevelopment = process.env.NODE_ENV !== 'production'
        
        return {
          pinoHttp: {
            level: isDevelopment ? 'debug' : 'info',
            transport: isDevelopment
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname',
                    singleLine: false,
                  },
                }
              : undefined,
            serializers: {
              req: (req: any) => ({
                id: req.id,
                method: req.method,
                url: req.url,
                query: req.query,
                params: req.params,
                headers: {
                  host: req.headers.host,
                  'user-agent': req.headers['user-agent'],
                  'content-type': req.headers['content-type'],
                },
              }),
              res: (res: any) => ({
                statusCode: res.statusCode,
              }),
              err: (err: any) => ({
                type: err.type,
                message: err.message,
                stack: err.stack,
              }),
            },
            customProps: (req: any) => ({
              context: 'HTTP',
            }),
            customSuccessMessage: (req: any, res: any) => {
              return `${req.method} ${req.url} ${res.statusCode}`
            },
            customErrorMessage: (req: any, res: any, err: any) => {
              return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`
            },
            customLogLevel: (req: any, res: any, err: any) => {
              if (res.statusCode >= 400 && res.statusCode < 500) {
                return 'warn'
              } else if (res.statusCode >= 500 || err) {
                return 'error'
              }
              return 'info'
            },
          },
        }
      },
    }),
  ],
})
export class LoggerModule {}

