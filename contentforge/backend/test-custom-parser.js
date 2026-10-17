function generateKey() {
    return Math.random().toString(36).substring(2, 10);
}

function block(text) {
    return {
        _type: 'block', style: 'normal',
        _key: generateKey(),
        markDefs: [],
        children: [{ _type: 'span', _key: generateKey(), text, marks: [] }]
    };
}
function h2(text) {
    return {
        _type: 'block', style: 'h2',
        _key: generateKey(),
        markDefs: [],
        children: [{ _type: 'span', _key: generateKey(), text, marks: [] }]
    };
}
function h3(text) {
    return {
        _type: 'block', style: 'h3',
        _key: generateKey(),
        markDefs: [],
        children: [{ _type: 'span', _key: generateKey(), text, marks: [] }]
    };
}
function quote(text) {
    return {
        _type: 'block', style: 'blockquote',
        _key: generateKey(),
        markDefs: [],
        children: [{ _type: 'span', _key: generateKey(), text, marks: [] }]
    };
}

function markdownToBlocks(markdown) {
    const blocks = [];
    const chunks = markdown.split(/\n+/);
    for (let chunk of chunks) {
        chunk = chunk.trim();
        if (!chunk) continue;
        
        // Remove bolding/italics asterisks for simple parsing (since the seed script spans don't handle inline marks well)
        // Or we can leave them in the text for now.
        chunk = chunk.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');

        if (chunk.startsWith('## ')) {
            blocks.push(h2(chunk.substring(3).trim()));
        } else if (chunk.startsWith('### ')) {
            blocks.push(h3(chunk.substring(4).trim()));
        } else if (chunk.startsWith('# ')) {
            blocks.push(h2(chunk.substring(2).trim())); // treat H1 as H2
        } else if (chunk.startsWith('> ')) {
            blocks.push(quote(chunk.substring(2).trim()));
        } else if (chunk.startsWith('- ')) {
            // handle list items later if needed, for now just normal block
            blocks.push({
                ...block(chunk.substring(2).trim()),
                listItem: 'bullet',
                level: 1
            });
        } else {
            blocks.push(block(chunk));
        }
    }
    return blocks;
}

const md = `
# Main Title
This is a paragraph with **bold**.
## Section 2
> A quote
- List item 1
- List item 2
`;

console.log(JSON.stringify(markdownToBlocks(md), null, 2));
