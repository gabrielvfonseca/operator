# Developers Guide

This document provides comprehensive guidance for developers working on the Operator project.

## Quick Links

- **GitHub:** https://github.com/gabrielvfonseca/operator
- **Website:** https://operator.ai
- **Discord:** https://discord.gg/clawd
- **X/Twitter:** [@openclaw](https://x.com/openclaw)

## Development Setup

### Prerequisites

- Node.js 24.15+ (recommended), also supports Node 22.22.3+ and Node 25.9+
- pnpm (package manager)
- Git

### Installation

```bash
# Clone the repository
 git clone https://github.com/gabrielvfonseca/operator.git
cd operator

# Install dependencies
 pnpm install

# Build the project
 pnpm build
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run extension tests
pnpm test:extensions

# Run tests for a specific extension
pnpm test:extensions/<extension-name>

# Run channel contract tests
pnpm test:contracts
pnpm test:contracts:channels
pnpm test:contracts:plugins
```

## Code Structure

### Core Architecture

Operator has a layered architecture with clear separation of concerns:

1. **Core Runtime** (`src/`) - Gateway, agent management, tools
2. **Plugin System** (`extensions/`) - Channel/plugins implementations
3. **Control UI** (`ui/`) - Web interface
4. **Gateway Protocol** (`packages/gateway-protocol/`) - Communication protocols

### Key Components

- **Gateway** - Core runtime that connects models, agents, and channels
- **Channels** - Communication protocols (Slack, Discord, Telegram, etc.)
- **Plugins** - Extensions that provide additional functionality
- **Agents** - AI instances that execute tools and interact with users
- **Tools** - Functions that agents can call (Execute code, browse web, etc.)

## Development Workflow

### Prerequisites Check

Before starting development, run the setup validation:

```bash
# Check source integrity
pnpm check

# Type check
pnpm check:test-types

# Run focused tests
pnpm test -- <path-to-specific-files>
```

### Running Operator Locally

For development, run the gateway locally:

```bash
# Run gateway in development mode
pnpm dev

# Or run with specific gateway config
pnpm operator gateway run --config <path-to-config>
```

## Testing Strategy

### Local Testing

Run tests without external dependencies:

```bash
# Local Vitest runs (for trusted source)
node scripts/run-vitest.mjs test/path/file.test.ts

# For untrusted source (e.g., forks), use remote CI
pnpm test test/path/file.test.ts
```

### Extension Testing

For plugin/extension changes:

```bash
# Test specific bundled plugin
pnpm test:extension <extension-id>

# List available extensions
pnpm test:extension --list
```

### CI/CD and Validation

Before pushing changes, run the full CI checks:

```bash
pnpm build
pnpm check
pnpm test
```

## Coding Standards

### TypeScript

Use strict TypeScript configuration:

- No `any` type (use `unknown` or specific types)
- Always type exports
- Follow the existing code style

### Linting and Formatting

```bash
# Format code
pnpm format <paths>

# Lint code
pnpm lint

# Run specific checks
pnpm check:changed
pnpm check:changed -- <staged-files>
```

### Commit Message Convention

Use conventional commit messages:

```
<type>(<scope>): <description>

<optional body>

<optional footer>
```

Types:

- `feat`: new feature
- `fix`: bug fix
- `docs`: documentation
- `style`: formatting, no code change
- `refactor`: code refactor
- `test`: testing
- `chore`: maintenance tasks

```

## Plugin Development

### Plugin Structure

Bundled plugins are located in `extensions/` directory:

```

extensions/
skill/ (skills)
channel/ (messaging channels)
hub/ (integration points)
voice-call/ (voice features)
etc...

````

### Plugin Development Workflow

1. **Development**: Work in the plugin's directory with local dependencies
2. **Testing**: Use `pnpm test:extension <plugin-id>`
3. **Validation**: Check import boundaries with tools:

```bash
node scripts/check-src-extension-import-boundary.mjs --json
node scripts/check-sdk-package-extension-import-boundary.mjs --json
node scripts/check-test-helper-extension-import-boundary.mjs --json
````

### Plugin Testing Best Practices

- Use `src/test-utils/bundled-plugin-public-surface.ts` for shared test helpers
- Keep plugin-local deep mocks inside plugin packages
- Avoid importing from `extensions/**` in shared tests

## Plugin SDK Development

### SDK API

The plugin SDK provides runtime helpers and capabilities:

- `openclaw/plugin-sdk/**` - Public API for plugin developers
- `src/plugin-sdk/**` - Runtime facades

### Plugin Bundling

Bundled plugins are included in the core build. When modifying bundled plugins:

1. Ensure SDK surfaces remain compatible
2. Run `pnpm build` to validate
3. Check extension import boundaries

## Branching and Release Strategy

### Branch Structure

- `main` - Production-ready code
- `release/*` - Feature branches for releases
- `feature/*` - Feature development branches

### Release Process

For release branches, use Blacksmith Testbox for heavy proof:

```bash
# Run full release validation at specific SHA
node scripts/full-release-validation-at-sha.mjs --sha <code-sha> --target-ref release/YYYY.M.PATCH
```

## Troubleshooting

### Common Issues

#### Node Version Issues

If Node.js version is incompatible:

```bash
# Install correct version
# macOS with nvm
nvm install 24.15
nvm use 24.15

# Linux with version manager
```
