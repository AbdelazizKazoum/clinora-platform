import { META_DATA } from '../src/config/constants';

describe('frontend starter', () => {
  it('should expose template metadata', () => {
    expect(META_DATA.title).toContain('UBold');
  });
});
