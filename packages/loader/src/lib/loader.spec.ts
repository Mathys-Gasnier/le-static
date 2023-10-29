import { load } from './loader';

describe('loader', () => {
  it('should work', () => {
    expect(load('C:\\Users\\matbo\\Documents\\le-static\\test\\simple')).toEqual({
      pages: {
        'index.md': {
          name: 'index',
          extention: 'md',
          content: '<<< file.css\r\n' +
            '\r\n' +
            '# Title\r\n' +
            '\r\n' +
            '## Sub Title\r\n' +
            '\r\n' +
            '### SUB SUB Title\r\n' +
            '\r\n' +
            'this\r\n' +
            'is a \r\n' +
            'paragraph\r\n' +
            '\r\n' +
            '---\r\n' +
            '\r\n' +
            'another\r\n' +
            'paragraph\r\n' +
            '\r\n' +
            '<<< cool/footer.md'
        }
      },
      components: { cool: { 'footer.md': {
        content: '## Footer\r\n' +
          '\r\n' +
          'This is a cool footer',
        extention: 'md',
        name: 'footer'
      } } },
      resources: {},
      styles: {
        'file.css': {
          name: 'file',
          extention: 'css',
          content: '\r\n.paragraph {\r\n    color: blue;\r\n}'
        },
        'index.css': {
          name: 'index',
          extention: 'css',
          content: '\r\n.separator {\r\n    margin: 5vw;\r\n}'
        }
      }
    });
  });
});
