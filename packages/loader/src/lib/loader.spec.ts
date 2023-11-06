import { resolve } from 'path';
import { load } from './loader';

describe('loader', () => {
  it('Should properly load project folders', () => {
    const path = resolve(__dirname, '../../../../test/simple');
    const project = load(path);
    if(!project) fail();
    project.src = './test/simple';
    expect(project).toMatchSnapshot();
  });

  it('Should return no project when a config file is not found', () => {
    const path = resolve(__dirname, '../../../../test');
    expect(load(path)).toEqual(null);
  });
});
