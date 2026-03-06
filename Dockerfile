FROM node:22-alpine

RUN npm install -g @icogenie/mcp

ENTRYPOINT ["icogenie-mcp"]
