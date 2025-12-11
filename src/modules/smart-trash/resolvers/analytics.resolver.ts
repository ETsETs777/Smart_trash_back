import { Args, Query, Resolver } from '@nestjs/graphql';
import { CompanyAnalyticsSummary } from '../analytics/analytics.types';
import { AnalyticsService } from '../analytics/analytics.service';
import { Public } from 'src/decorators/auth/public.decorator';

@Resolver()
export class AnalyticsResolver {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Query(() => CompanyAnalyticsSummary, {
    description:
      'Возвращает агрегированную аналитику по компании: использование контейнеров, таблица лидеров, доска почёта и статистика по областям сбора',
  })
  @Public()
  companyAnalytics(
    @Args('companyId', {
      description: 'Идентификатор компании, для которой требуется аналитика',
    })
    companyId: string,
    @Args('dateFrom', { nullable: true, description: 'Дата начала фильтра' })
    dateFrom?: Date,
    @Args('dateTo', { nullable: true, description: 'Дата окончания фильтра' })
    dateTo?: Date,
  ): Promise<CompanyAnalyticsSummary> {
    return this.analyticsService.getCompanyAnalytics(companyId, { dateFrom, dateTo });
  }
}


