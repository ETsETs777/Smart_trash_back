import { GraphQLScalarType, Kind } from 'graphql';

/**
 * Строковый скаляр GraphQL для сортировки.
 * Может содержать несколько полей.
 * На входе и выходе JSON строка формата: '{ "field1": "asc", "field2": "desc" }'.
 */
export const SortOrderScalar = new GraphQLScalarType({
  name: 'SortOrder',
  description: 'Sort order',
  serialize(value: unknown): unknown {
    return value; // value sent to the client
  },
  parseValue(value: unknown): unknown {
    // check the type of received value
    return value; // value from the client input variables
  },
  parseLiteral(ast): unknown {
    // check the type of received value
    if (ast.kind !== Kind.STRING) {
      throw new Error('ObjectIdScalar can only parse string values');
    }
    return ast.value; // value from the client query
  },
});
