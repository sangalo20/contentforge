const fs = require('fs');
const path = require('path');

const filesToFix = [
    "WorkspaceEditor.jsx",
    "WorkspacesDashboard.jsx",
    "WorkspaceLibrary.jsx",
    "Sidebar.jsx",
    "ImageChatModal.jsx",
    "PipelineTrigger.jsx",
    "GlobalHeader.jsx",
    "WorkspaceLayout.jsx",
    "LibraryItemViewer.jsx"
];

const baseDir = path.join(__dirname, 'src');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else {
            results.push(file);
        }
    });
    return results;
}

const files = walkDir(baseDir);

for (const file of files) {
    const filename = path.basename(file);
    if (!filesToFix.includes(filename)) continue;
    
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // Fix authFetch('http://localhost:3005/api/...') -> authFetch(`${API_BASE}/api/...`)
    content = content.replace(/'http:\/\/localhost:3005([^']+)'/g, '`${API_BASE}$1`');
    // Fix authFetch(`http://localhost:3005/api/...`) -> authFetch(`${API_BASE}/api/...`)
    content = content.replace(/`http:\/\/localhost:3005([^`]+)`/g, '`${API_BASE}$1`');
    // Fix fetch('http://localhost:8000/api/...') in ImageChatModal
    content = content.replace(/'http:\/\/localhost:8000([^']+)'/g, '`${odinBase}$1`');

    if (filename === 'ImageChatModal.jsx') {
        if (content.includes('import { authFetch }')) {
            content = content.replace('import { authFetch }', 'import { authFetch, API_BASE, getOdinBase }');
        } else if (content.includes('import { getIdToken }')) {
            content = content.replace('import { getIdToken }', 'import { getIdToken, API_BASE, getOdinBase }');
        } else if (content.includes('import { getIdToken')) {
            content = content.replace('import { getIdToken', 'import { getIdToken, API_BASE, getOdinBase');
        }
        
        content = content.replace('const handleSubmit = async (e) => {', 'const handleSubmit = async (e) => {\n    const odinBase = await getOdinBase();');
    } else {
        if (content.includes('import { authFetch') && !content.includes('API_BASE')) {
            content = content.replace('import { authFetch', 'import { authFetch, API_BASE');
        }
    }

    if (content !== original) {
        console.log('Fixed', filename);
        fs.writeFileSync(file, content);
    }
}
