function generateKey() {
    return Math.random().toString(36).substring(2, 10);
}

function parseSpans(text) {
    const spans = [];
    // Regex to match **bold** or *italic*
    const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            spans.push({
                _type: 'span',
                _key: generateKey(),
                text: text.substring(lastIndex, match.index),
                marks: []
            });
        }

        const matchedText = match[0];
        if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
            spans.push({
                _type: 'span',
                _key: generateKey(),
                text: matchedText.substring(2, matchedText.length - 2),
                marks: ['strong']
            });
        } else if (matchedText.startsWith('*') && matchedText.endsWith('*')) {
            spans.push({
                _type: 'span',
                _key: generateKey(),
                text: matchedText.substring(1, matchedText.length - 1),
                marks: ['em']
            });
        }

        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        spans.push({
            _type: 'span',
            _key: generateKey(),
            text: text.substring(lastIndex),
            marks: []
        });
    }
    
    // If no formatting found, just return one span
    if (spans.length === 0) {
        spans.push({
            _type: 'span',
            _key: generateKey(),
            text: text,
            marks: []
        });
    }

    return spans;
}

function markdownToBlocks(markdown) {
    const blocks = [];
    const chunks = markdown.split(/\n+/);
    for (let chunk of chunks) {
        chunk = chunk.trim();
        if (!chunk) continue;

        let style = 'normal';
        let listItem = null;
        let level = null;

        if (chunk.startsWith('## ')) {
            style = 'h2';
            chunk = chunk.substring(3).trim();
        } else if (chunk.startsWith('### ')) {
            style = 'h3';
            chunk = chunk.substring(4).trim();
        } else if (chunk.startsWith('# ')) {
            style = 'h2';
            chunk = chunk.substring(2).trim();
        } else if (chunk.startsWith('> ')) {
            style = 'blockquote';
            chunk = chunk.substring(2).trim();
        } else if (chunk.startsWith('- ')) {
            style = 'normal';
            listItem = 'bullet';
            level = 1;
            chunk = chunk.substring(2).trim();
        } else if (chunk.match(/^\*\*(.*?)\*\*$/)) {
            // If the entire paragraph is bold, treat it as an h3
            style = 'h3';
            chunk = chunk.replace(/^\*\*(.*?)\*\*$/, '$1');
        }

        const blockNode = {
            _type: 'block',
            style: style,
            _key: generateKey(),
            markDefs: [],
            children: parseSpans(chunk)
        };

        if (listItem) {
            blockNode.listItem = listItem;
            blockNode.level = level;
        }

        blocks.push(blockNode);
    }
    return blocks;
}

const md = `
# Main Title
This is a paragraph with **bold text** and *italic text*.
**Subheading as bold**
- List item with **bold**
`;

console.log(JSON.stringify(markdownToBlocks(md), null, 2));
