import { Args, Query, Resolver } from '@nestjs/graphql';
import { TrashBinType } from 'src/entities/smart-trash/trash-bin-type.enum';
import { Public } from 'src/decorators/auth/public.decorator';

@Resolver()
export class BarcodeResolver {
  @Query(() => TrashBinType, {
    nullable: true,
    description: 'Заглушка: определение типа контейнера по штрихкоду (будет реализовано позже)',
  })
  @Public()
  async detectBinByBarcode(
    @Args('barcode', { description: 'Штрихкод/QR код упаковки' }) barcode: string,
  ): Promise<TrashBinType | null> {
    // TODO: интеграция со справочником упаковок
    return null;
  }
}

