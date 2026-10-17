const { createClient } = require('@sanity/client');
const { marked } = require('marked');
const { htmlToPortableText } = require('@portabletext/html');
const { JSDOM } = require('jsdom');

const markdown = "# Hello World\n\nThis is a **test**.";
const html = marked.parse(markdown);

const DOMParser = new JSDOM().window.DOMParser;
const parser = new DOMParser();

const blocks = htmlToPortableText(html, {
  parseHtml: (html) => parser.parseFromString(html, 'text/html')
});

console.log(JSON.stringify(blocks, null, 2));
