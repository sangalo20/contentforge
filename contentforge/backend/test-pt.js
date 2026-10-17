const { marked } = require('marked');
const { htmlToPortableText } = require('@portabletext/html');
const { JSDOM } = require('jsdom');

const DOMParser = new JSDOM().window.DOMParser;
const htmlParser = new DOMParser();

const html = marked.parse('# Hello\n\nThis is **bold** text.');
const portableText = htmlToPortableText(html, {
  parseHtml: (htmlContent) => htmlParser.parseFromString(htmlContent, 'text/html')
});

console.log(JSON.stringify(portableText, null, 2));
