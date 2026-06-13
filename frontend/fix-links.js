const fs = require('fs');
const files = [
  'components/landing/hero.tsx',
  'components/landing/footer.tsx',
  'components/app/sidebar.tsx',
  'components/app/mobile-nav.tsx',
  'components/app/cookie-banner.tsx',
  'components/app/role-guard.tsx'
];
for (let file of files) {
  let path = file;
  if (!fs.existsSync(path)) continue;
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/import Link from "next\/link"/g, 'import { Link } from "@/i18n/routing"');
  content = content.replace(/import Link from 'next\/link'/g, 'import { Link } from "@/i18n/routing"');
  content = content.replace(/import \{ usePathname, useRouter \} from "next\/navigation"/g, 'import { usePathname, useRouter } from "@/i18n/routing"');
  content = content.replace(/import \{ useRouter \} from "next\/navigation"/g, 'import { useRouter } from "@/i18n/routing"');
  fs.writeFileSync(path, content);
}
console.log('Fixed Link imports!');
