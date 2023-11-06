import { load } from '@le-static/loader';
import { build } from './builder';
import { resolve } from 'path';

describe('builder', () => {
  it('should work', () => {
    const path = resolve(__dirname, '../../../../test/simple');
    const project = load(path);
    expect(project).toBeTruthy();
    if(!project) return;
    build(project);
    // TODO: Checks that the generated dist file is right
  });
});
