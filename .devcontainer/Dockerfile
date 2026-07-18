FROM node:24-bookworm

RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      git \
      curl \
      python3 \
      build-essential \
      pkg-config \
      libssl-dev \
      ca-certificates && \
    update-ca-certificates && \
    rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare "$(node -p "require('./package.json').packageManager")" --activate

WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY patches ./patches
COPY scripts/postinstall-bundled-plugins.mjs scripts/preinstall-package-manager-warning.mjs scripts/npm-runner.mjs scripts/windows-cmd-helpers.mjs scripts/prepare-git-hooks.mjs ./scripts/
COPY scripts/lib/package-dist-imports.mjs ./scripts/lib/package-dist-imports.mjs

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 18789 18790 3978

CMD ["sleep", "infinity"]
