---
paths: "**/*.{ts,tsx}"
---

## TypeScript Rules

### Naming Conventions

- PascalCase for interfaces, types, classes
- camelCase for functions, variables, methods
- SCREAMING_SNAKE_CASE for constants
- kebab-case for file names and components (`user-card.tsx`)
- Variables: descriptive with auxiliary verbs (`isLoading`, `hasError`)

### Type Safety

- NO `any` without explicit justification comment
- NO `@ts-ignore` or `@ts-expect-error` without explanation
- Prefer `unknown` over `any` when type is truly unknown
- Use explicit return types on exported functions
- Use object destructuring for multiple arguments
- Prefer interfaces over types
- Avoid enums; use maps instead
- Use TypeScript for all code

## Syntax

- Use `function` keyword for pure functions
- Never use `React.FC` or arrow functions for components
- Use functional patterns; avoid classes
- Avoid unnecessary curly braces in conditionals

### Imports

- Group imports: external → internal → relative
- Use named exports over default exports
- No circular dependencies

### Async/Await

- Always handle promise rejections
- Use try/catch for async operations
- Avoid floating promises (unhandled)

### React Best Practices

- When writing React code, invoke `vercel-react-best-practices` skill

### React Hooks

- When writing or reviewing `useEffect` or `useState` for derived values, invoke `react-useeffect` skill
- Prefer derived values over state + effect patterns
- Use `useMemo` for expensive calculations, not `useEffect`
- Prefer Server Components over Client Components
- Implement proper error boundaries and loading states

## Component Co-location

- Feature-specific components go in `app/[feature]/_components/`
- Shared UI components go in `components/ui/`
- When a feature grows complex, move to `components/`
- Root layout reserved for providers and configuration only
