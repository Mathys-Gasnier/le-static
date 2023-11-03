import { load } from 'loader';
import { build } from './builder';

describe('builder', () => {
  it('should work', () => {
    const project = load("C:\\Users\\matbo\\Documents\\le-static\\test\\simple");
    expect(project).toBeTruthy();
    if(!project) return;
    build(project);
    // TODO: Checks that the generated dist file is right
  });
});
