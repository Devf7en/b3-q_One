FROM node:22-bookworm-slim
WORKDIR /app
COPY --chown=node:node package.json ./
COPY --chown=node:node apps/control-command-center ./apps/control-command-center
COPY --chown=node:node packages ./packages
USER node
EXPOSE 4173
CMD ["node","apps/control-command-center/container-entry.mjs"]
