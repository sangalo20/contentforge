const { createClient } = require('@sanity/client');
require('dotenv').config({ path: '/Users/sangalo/Development/belrose/websites/moguls-website/.env.local' });

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: '2024-01-08',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

async function run() {
    // Fetch the latest drafted post
    const doc = await client.fetch(`*[_type == "post" && _id match "drafts.cp-*"] | order(_updatedAt desc)[0]`);
    console.log(JSON.stringify(doc.body, null, 2));
}

run().catch(console.error);
