const draft1 = `
# Title

This is a draft.
Categories: Investing, Growth
`;
const draft2 = `
# Title

This is a draft.
**Categories:** Investing, Growth
`;
const draft3 = `
# Title

This is a draft.
Categories: Investing, Growth
Some other text.
`;

function extractCats(text) {
    let cats = [];
    let cleanText = text;
    // Match "Categories: ..." or "**Categories:** ..." at the start of a line
    const catRegex = /(?:^|\n)\s*(?:\*\*)?Categories:(?:\*\*)?\s*(.+?)(?:\n|$)/i;
    const match = text.match(catRegex);
    if (match) {
        cats = match[1].split(',').map(c => c.trim());
        cleanText = text.replace(catRegex, '\n').trim();
    }
    return {cats, cleanText};
}

console.log(extractCats(draft1));
console.log(extractCats(draft2));
console.log(extractCats(draft3));
