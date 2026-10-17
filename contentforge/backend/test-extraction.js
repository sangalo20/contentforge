const draft1 = `
# The Ultimate Guide to Boat & RV Storage

This is a draft.
**Categories:** Investing, Growth, Revenue
`;

const draft2 = `
## Why You Need Passive Income

This is a draft.
Categories:
- Investing
- Growth
`;

const draft3 = `
# No Categories Here

This is a draft.
`;

function extractMetadata(text) {
    let cleanDraft = text;
    let title = 'Fallback Title';
    let categories = [];

    // Extract Title
    const titleMatch = cleanDraft.match(/^(?:#+)\s+(.+?)(?:\n|$)/m);
    if (titleMatch) {
        // Remove markdown formatting like ** or *
        title = titleMatch[1].replace(/(\*\*|\*)/g, '').trim();
        cleanDraft = cleanDraft.replace(titleMatch[0], '').trim();
    }

    // Extract Categories
    const catRegex = /(?:^|\n)\s*(?:\*\*)?Categories:?(?:\*\*)?\s*((?:.+)(?:\n\s*-\s*.+)*)(?:\n|$)/i;
    const catMatch = cleanDraft.match(catRegex);
    if (catMatch) {
        const catString = catMatch[1];
        if (catString.includes('-')) {
            categories = catString.split('\n').map(c => c.replace('-', '').trim()).filter(c => c);
        } else {
            categories = catString.split(',').map(c => c.trim()).filter(c => c);
        }
        cleanDraft = cleanDraft.replace(catRegex, '\n').trim();
    }

    return { title, categories, cleanDraft };
}

console.log(extractMetadata(draft1));
console.log(extractMetadata(draft2));
console.log(extractMetadata(draft3));
