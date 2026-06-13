const fs = require('fs');

// 1. dashboard/page.tsx
let dashboardPath = 'app/[locale]/(app)/dashboard/page.tsx';
let dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
dashboardContent = dashboardContent.replace(/issuedTranscripts\.map\(t => \{([\s\S]*?)const t = useTranslations\("Common"\);([\s\S]*?)key=\{t\.recordId\}/, 'issuedTranscripts.map(tr => {$1const t = useTranslations("Common");$2key={tr.recordId}');
// Only replace the t variable access within the map block (after line 630 basically).
// To be safe, just replace the exact usages inside the dashboard file's row.
dashboardContent = dashboardContent.replace(/t\.recordId/g, 'tr.recordId');
dashboardContent = dashboardContent.replace(/t\.studentHash/g, 'tr.studentHash');
dashboardContent = dashboardContent.replace(/t\.status/g, 'tr.status');
dashboardContent = dashboardContent.replace(/t\.issuedAt/g, 'tr.issuedAt');
dashboardContent = dashboardContent.replace(/t\.createdAt/g, 'tr.createdAt');
dashboardContent = dashboardContent.replace(/t\.metadataCid/g, 'tr.metadataCid');
dashboardContent = dashboardContent.replace(/t\.registryAddr/g, 'tr.registryAddr');
// Fix the hook call `const tr = useTranslations("Common");` if it got mangled.
dashboardContent = dashboardContent.replace(/const tr = useTranslations\("Common"\);/g, 'const t = useTranslations("Common");');
fs.writeFileSync(dashboardPath, dashboardContent);

// 2. issued/page.tsx
let issuedPath = 'app/[locale]/(app)/issued/page.tsx';
let issuedContent = fs.readFileSync(issuedPath, 'utf8');
issuedContent = issuedContent.replace(/transcripts\.map\(t => <IssuedRow key=\{t\.recordId\} t=\{t\}/, 'transcripts.map(tr => <IssuedRow key={tr.recordId} t={tr}');
fs.writeFileSync(issuedPath, issuedContent);

// 3. verify-onchain/page.tsx
let verifyPath = 'app/[locale]/(app)/verify-onchain/page.tsx';
let verifyContent = fs.readFileSync(verifyPath, 'utf8');
verifyContent = verifyContent.replace(/requests\.map\(t => \{([\s\S]*?)const t = useTranslations\("Common"\);/, 'requests.map(tr => {$1const t = useTranslations("Common");');
verifyContent = verifyContent.replace(/key=\{t\.id\}/g, 'key={tr.id}');
verifyContent = verifyContent.replace(/t\.studentName/g, 'tr.studentName');
verifyContent = verifyContent.replace(/t\.studentId/g, 'tr.studentId');
verifyContent = verifyContent.replace(/t\.status/g, 'tr.status');
verifyContent = verifyContent.replace(/t\.createdAt/g, 'tr.createdAt');
verifyContent = verifyContent.replace(/t\.id/g, 'tr.id');
fs.writeFileSync(verifyPath, verifyContent);

console.log('Fixed');
