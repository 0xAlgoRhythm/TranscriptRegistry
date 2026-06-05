const content = 'bg-[oklch(var(--ca-accent))] text-white hover:bg-[oklch(var(--ca-accent-hover))]';
const prefixes = '(?:[a-z0-9\\-:]+:)*';
const baseTypes = '(bg|text|border|ring|shadow)';
const pattern1 = new RegExp(`(${prefixes})(${baseTypes})-\\[oklch\\(var\\(--ca-([a-z0-9-]+)\\)\\)\\]`, 'g');

content.replace(pattern1, (match, prefix, type, color) => {
  console.log({ match, prefix, type, color });
});
