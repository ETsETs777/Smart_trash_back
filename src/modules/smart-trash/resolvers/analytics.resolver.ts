import { Args, Query, Resolver, Subscription, ID } from '@nestjs/graphql';
import { CompanyAnalyticsSummary, CompanyLeaderboardEntry } from '../analytics/analytics.types';
import { AnalyticsService } from '../analytics/analytics.service';
import { Public } from 'src/decorators/auth/public.decorator';
import { PubSubService } from 'src/common/pubsub/pubsub.service';
import { LeaderboardUpdatedPayload } from 'src/common/dto/leaderboard-updated.dto';

@Resolver()
export class AnalyticsResolver {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly pubSub: PubSubService,
  ) {}

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

  @Public()
  @Subscription(() => LeaderboardUpdatedPayload, {
    description: 'Подписка на обновления лидерборда компании',
    filter: (payload, variables) => {
      return payload.leaderboardUpdated.companyId === variables.companyId;
    },
  })
  leaderboardUpdated(
    @Args('companyId', { type: () => ID }) companyId: string,
  ) {
    return this.pubSub.asyncIterator('leaderboardUpdated');
  }
}


