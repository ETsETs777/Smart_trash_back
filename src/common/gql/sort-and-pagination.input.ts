import { InputType, IntersectionType } from '@nestjs/graphql';
import { PaginationInput } from './pagination.input';
import { SortInput } from './sort.input';

@InputType()
export class SortAndPaginationInput extends IntersectionType(
  PaginationInput,
  SortInput,
  InputType,
) {}
