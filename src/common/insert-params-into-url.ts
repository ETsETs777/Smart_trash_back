import { InternalServerErrorException } from '@nestjs/common';

/**
 * Insert params into url template.
 * @example insertParamsIntoUrl('/image/:imageName', { imageName: '123' }) === '/image/123'
 * @param template - URL template with params, "foo/:bar/:paramName".
 * @param params - Params to insert into url template. { bar: 123, paramName: 'value' }.
 * @returns URL with inserted params. "foo/123/value".
 * @throws InternalServerErrorException If not enough parameters for insertion.
 */
export const insertParamsIntoUrl = (
  template: string,
  params: Record<string, string | number>,
): string => {
  const urlWithInsertedParams = Object.keys(params).reduce(
    (url, key) => url.replace(`:${key}`, params[key].toString()),
    template,
  );
  if (urlWithInsertedParams.includes(':')) {
    throw new InternalServerErrorException(
      'Not all params were inserted into url',
    );
  }
  return urlWithInsertedParams;
};
