/* eslint-disable no-underscore-dangle */
import Joi, { ValidationError } from 'joi';
import { set } from 'lodash';
import ms from 'ms';
import { KeysPostfixDeep } from './type-utils/keys-postfix-deep';
import { excelDateToJsDate } from './excel-date-to-js-date';

import JoiRoot from 'joi';

/**
 * Configured instance of Joi.
 */
export const joi: Joi.Root = JoiRoot.defaults((schema) =>
  schema.options({
    stripUnknown: true,
    allowUnknown: false,
    convert: true,
    abortEarly: false,
    presence: 'required',
  }),
);

/**
 * Function takes Joi.ValidationError and returns object
 * with field names as keys and verdicts as values.
 * @param error - Joi validation error.
 * @param postfix - Postfix for field names.
 * @returns Object with field names as keys and verdicts as values.
 */
export const joiErrorToObject = <
  T = Record<string, unknown>,
  P extends string = '',
>(
  error: ValidationError | undefined,
  postfix?: P,
): KeysPostfixDeep<T, P> => {
  const result: Record<string, string> = {};
  error?.details.forEach((detail) => {
    const key = detail.path.join('.') + (postfix ?? '');
    const verdict = detail.message;
    set(result, key, verdict);
  });
  return result as KeysPostfixDeep<T, P>;
};

/**
 * Validator for https://www.npmjs.com/package/ms
 */
export const vercelMsValidator: Joi.CustomValidator = (
  value: string,
  helpers,
) => {
  if (helpers.schema._flags.presence === 'optional' && value === undefined) {
    return value;
  }
  const convertResult = ms(value) as number | string | undefined;
  if (typeof convertResult !== 'number' || Number.isNaN(convertResult)) {
    throw Error('value must be a string in vercel/ms format');
  }
  return value;
};

/**
 * Validator & parser for Excel date format into JS Date.
 * @param value Excel representation of date.
 * @returns JS Date.
 * @throws Error if value is not a number in Excel date format.
 */
export const joiExcelDateParser = (value: string | string): Date => {
  const date = excelDateToJsDate(Number(value));
  if (Number.isNaN(date.getTime())) {
    throw Error('value must be a number in Excel date format');
  }
  return date;
};
