import { Field, ObjectType, Int } from '@nestjs/graphql'
import { WastePhotoEntity } from '../../entities/smart-trash/waste-photo.entity'

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

@ObjectType()
export class PaginatedWastePhotos {
  @Field(() => [WastePhotoEntity])
  items: WastePhotoEntity[]

  @Field(() => PaginationMeta)
  meta: PaginationMeta
}

