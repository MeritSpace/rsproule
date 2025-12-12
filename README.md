# rsproule's Workspace

This is your persistent Claude workspace. Code and projects here are saved across sessions.

## Directory Structure

- `public/` - **Vite + React super app** (auto-deployed)
  - Add sub-apps as routes in `public/src/apps/`
  - Home page shows manifest of all apps
- `notes/` - Documentation and notes (not deployed)
- `tools/` - Scripts and utilities (not deployed)
- `.logs/` - Execution logs (auto-generated)
- `.claude/` - Claude configuration

## Adding a New App

1. Create folder: `public/src/apps/myapp/`
2. Add components: `public/src/apps/myapp/index.tsx`
3. Add route in `public/src/App.tsx`
4. Run `cd public && npm run dev` to test locally
