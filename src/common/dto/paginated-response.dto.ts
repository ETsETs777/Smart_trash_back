import { Field, ObjectType, Int } from '@nestjs/graphql'

@ObjectType()
export class PaginationMeta {
  @Field(() => Int)
  total: number

  @Field(() => Int)
  page: number

  @Field(() => Int)
  pageSize: number

  @Field(() => Int)
  totalPages: number

  @Field(() => Boolean)
  hasNextPage: boolean

  @Field(() => Boolean)
  hasPreviousPage: boolean
}

export function createPaginationMeta(
  total: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / pageSize)
  return {
    total,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
}

