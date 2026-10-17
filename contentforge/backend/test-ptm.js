const { markdownToPortableText } = require('@portabletext/markdown');

const markdown = `
# Title

This is a test of **bold** and *italic*.
- Item 1
- Item 2
`;

console.log(JSON.stringify(markdownToPortableText(markdown), null, 2));
