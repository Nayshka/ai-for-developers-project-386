FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci

FROM deps AS build

COPY . .
RUN npm run build && npm run backend:build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/server/dist ./server/dist

EXPOSE 10000

CMD ["node", "server/dist/index.js"]
