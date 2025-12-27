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

  asyncIterator<T>(triggers: string | string[]): AsyncIterator<T> {
    // @ts-ignore - asyncIterator exists on PubSub but TypeScript types may not reflect it
    return super.asyncIterator(triggers);
  }
}


    return super.asyncIterator(triggers);
  }
}


    return super.asyncIterator(triggers);
  }
}

