@ Header

$|() => {
    const pages = getFolder('/');

    function toLinks(path, pages) {
        return `
<ul>\n
${Object.values(pages.files).map((page) => {
    if(page.type === 'file') return `    <li><a href=${ `${path.replace(/^\/+/, '')}/${page.name}.html` }>${page.head.title || page.name}</a></li>`;
    else return `    <li>${toLinks(`${path}/${page.name}`, page)}</li>`;
}).join('\n')}
\n</ul>`;
    }

    return toLinks('', pages);
}|$