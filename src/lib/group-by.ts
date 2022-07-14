import { resolvePath } from './resolve-path';

export const groupBy = <InputType extends Record<string, unknown> | Object, OutputType = any>(
  input: InputType[],
  key: string,
  valueFn?: (val: InputType) => unknown,
): Record<string, OutputType> =>
  input.reduce((acc, it) => {
    const itKey = resolvePath(it, key, null);
    if (typeof itKey === 'string' || typeof itKey === 'number') {
      return { ...acc, [itKey.toString()]: valueFn != null ? valueFn(it) : it };
    }
    return acc;
  }, {});
