# b3Ɛq::One visual consistency contract v1

Scope: Control Center, Project Observatory and preview.

## Typography
System-native font stack: -apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif.
Root/body: 16px. Brand: 20px bold. Menu labels and controls: 14px. Supporting text: 12px.
Use one consistent font stack, line-height and weight hierarchy across responsive surfaces.

## Navigation and safe areas
Keep one-row header: brand left, actions right, account at right edge.
Move controls into overflow without cloning them. Maintain existing keyboard and click behavior.
Mobile More menu must fit inside visible viewport with at least 12px left/right margins and 14px internal padding.
Controls should be at least 42px tall. Escape closes the More menu. No horizontal clipping.

## Functional preservation
Preserve 16 environments, 18 workspaces, 8 factories, docking, themes, Control Center/Observatory modes.
Do not present demonstration data as live operational evidence.

## Acceptance gates
Keep apps/control-command-center/public/style.css and docs/preview/style.css aligned.
Keep apps/control-command-center/public/topbar.mjs and docs/preview/topbar.mjs aligned.
Browser tests must check responsive layout, menu bounds, typography, keyboard dismissal and touch sizing.
GitHub Pages publishing must succeed independently before claiming the public preview is updated.
Report tests, deployment and real-device acceptance separately. Never downgrade existing features.