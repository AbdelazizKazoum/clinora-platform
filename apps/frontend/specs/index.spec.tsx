import { META_DATA } from '../src/config/constants';

describe('frontend starter', () => {
  it('should expose Clinora metadata', () => {
    expect(META_DATA.title).toContain('Clinora');
  });
});
