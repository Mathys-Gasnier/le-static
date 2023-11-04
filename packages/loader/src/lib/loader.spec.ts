import { load } from './loader';

describe('loader', () => {
  it('Should properly load project folders', () => {
    expect(load('C:\\Users\\matbo\\Documents\\le-static\\test\\simple')).toMatchSnapshot();
  });

  it('Should return no project when a config file is not found', () => {
    expect(load('C:\\Users\\matbo\\Documents\\le-static\\test')).toEqual(null);
  });
});
