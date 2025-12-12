# rsproule's Workspace

This is a persistent workspace. All changes are committed to GitHub.

## CRITICAL: Directory Structure

```
public/           <- DEPLOYED (Vite + React app)
  src/
    apps/         <- ADD NEW APPS HERE as folders
    App.tsx       <- ADD ROUTES HERE for new apps
notes/            <- NOT deployed - documentation
tools/            <- NOT deployed - scripts/utilities
.logs/            <- Auto-generated logs
```

## Rules

1. **Web apps go in `public/src/apps/`** - Create a folder, add components
2. **Register routes in `public/src/App.tsx`** - Import and add Route
3. **Scripts/tools go in `tools/`** - Not deployed
4. **Notes/docs go in `notes/`** - Not deployed
5. **Never modify `.logs/` or `.claude/`** - System managed

## Adding a New App

```bash
# 1. Create the app folder
mkdir -p public/src/apps/myapp

# 2. Create the main component
cat > public/src/apps/myapp/index.tsx << 'EOF'
export default function MyApp() {
  return <div>My App</div>
}
EOF

# 3. Edit public/src/App.tsx to add:
#    - Import: import MyApp from './apps/myapp'
#    - Route: <Route path="/apps/myapp/*" element={<MyApp />} />
#    - Manifest entry in the apps array
```

## Building & Testing

```bash
cd public
npm install    # First time only
npm run dev    # Local dev server
npm run build  # Production build
```
