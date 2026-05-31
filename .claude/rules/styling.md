## Styling Rules

### Tailwind CSS

- Use Tailwind CSS v4 semantics (`size-4` not `h-4 w-4`)
- Use `cn` utility for class joining
- Mobile-first responsive design

### UI Mockups

- Treat reference designs as the single source of truth — no assumptions
- Extract design system (colors, gradients, typography, spacing, radius, strokes, shadows) before building
- Rebuild layouts exactly — match proportions, alignment, spacing, section order
- Use SVG for icons and shapes
- Animate with purpose — subtle, no layout shifts
- Self-review against reference before marking complete

### Shadcn UI

- Prefer shadcn library ui blocks, components, theme, and color scheme, design system over manual hardcoded css unless it doesn't exist
