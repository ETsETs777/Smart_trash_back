import { Injectable } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

/**
 * PubSub service for GraphQL subscriptions
 * Manages real-time event publishing and subscriptions
 */
@Injectable()
export class PubSubService extends PubSub {
  constructor() {
    super();
  }
}

