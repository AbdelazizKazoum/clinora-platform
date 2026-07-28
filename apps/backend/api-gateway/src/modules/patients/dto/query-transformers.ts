import { Transform } from 'class-transformer';

export function BooleanQuery(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    return value === true || value === 'true' || value === '1';
  });
}
