# Frontend agent guidance

For frontend UI work in this project, use the Impeccable design skill as the design authority.

## Required UI workflow

- Treat app screens as Operate-mode interfaces: prioritize scanability, clear action hierarchy, accessibility, responsive behavior, and complete loading/error/empty states.
- Preserve existing product behavior and API contracts while improving the visual system.
- Use the existing tokens in `src/index.css`; keep the oat-milk, forest-green, and tomato palette consistent.
- Before editing a UI surface, inspect its JSX and CSS together. After editing, run the frontend build and the Impeccable detector on changed UI files.
- Avoid decorative gradients, emoji-as-icons, oversized cards, competing primary actions, and low-contrast text.

