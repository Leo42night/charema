# deploy ke GCP (Cloud Run)
# Gunakan base image resmi Bun
FROM oven/bun:1.3.14 AS base
WORKDIR /usr/src/app

# Salin seluruh file berformat json dan lock di semua subfolder untuk menjaga integritas lockfile
COPY package.json bun.lock ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

# Jalankan instalasi dependency monorepo secara menyeluruh
RUN bun install

# Langkah 2: Salin seluruh source code komponen projek yang dibutuhkan
COPY apps/backend ./apps/backend
COPY packages/shared ./packages/shared

# envs
COPY apps/backend/.env.production ./
COPY apps/backend/.env ./

ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080

# Jalankan server backend dari direktori workspace apps/backend
WORKDIR /usr/src/app/apps/backend
CMD ["bun", "run", "--env-file=.env", "--env-file=.env.production", "src/server-pg.ts"]
