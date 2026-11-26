# Universal UI/UX Preservation Contract

Status: accepted design baseline; implementation and acceptance tracked separately.

Never remove or downgrade existing primitives during refinement. Preserve the canonical 16 environments, 18 workspaces, workspace-specific panels, persisted layouts, theme (light/dark/system), surface switching, and existing specialized tools.

## Global shell
Persistent product identity, environment and workspace selectors, surface selector, theme, docking visibility, restore layout, notifications, preferences, far-right user account icon, status bar. Global selectors remain accessible when docks are hidden.

## Account
Compact right-aligned overlay, maximum 240 CSS pixels including padding, anchored beneath sticky header; pin/unpin, explicit close, default pinned on opening. Pinned state survives workspace/environment/theme/surface switches and scrolling. No canvas displacement. Profile, organizations, roles and permissions, security and sessions, preferences, API connections, activity history and sign out. No fabricated identity or active sessions.

## Docks
Explorer, Object Inspector, Console and Activity independently visible; restore all; preserve existing panel order, resize, collapse, lock and workspace/surface-specific persistence. Future docking: all edges, detach, stack, split, pin, presets and maximize. Do not label unimplemented capabilities as working.

## Inspector
Properties, Details, Configuration, Tools, Actions, Relationships, Workflows, Intelligence, Security, Observability, History, Documentation. Typed properties and object-specific tools; governed change plans, no direct execution. Observatory strictly read-only for domain operations. Layout preferences remain user-local.

## Acceptance
Verify all canonical selectors, user icon and menu, pinned persistence, independent dock visibility and restore, no canvas displacement, responsive layout, keyboard access, existing workspace-specific interactions and Observatory read-only boundaries. Distinguish preview, implemented and verified behavior.
