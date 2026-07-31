# ==========================================
# 1. BASE STAGE: Dependencias y Prisma
# ==========================================
FROM node:24-alpine AS base

WORKDIR /app

# Copiamos package.json y lockfile
COPY package*.json ./
# Instalamos todas las dependencias (necesarias para dev y para compilar)
RUN npm ci

# Copiamos el schema de Prisma y generamos el cliente
COPY prisma ./prisma/
RUN npx prisma generate


# ==========================================
# 2. DEVELOPMENT STAGE: Entorno de desarrollo
# ==========================================
FROM base AS development
ENV NODE_ENV=development

# En desarrollo, el código se monta a través de volúmenes en docker-compose, 
# así que no necesitamos hacer COPY . . aquí.
EXPOSE 3000
# Comando por defecto para desarrollo
CMD ["npm", "run", "dev"]


# ==========================================
# 3. BUILDER STAGE: Compilación del código
# ==========================================
FROM base AS builder

# Copiamos el código fuente (no necesario en 'development' por los volúmenes, pero sí para compilar)
COPY . .
# Compilamos TypeScript a JavaScript
RUN npm run build


# ==========================================
# 4. PRODUCTION STAGE: Imagen final optimizada
# ==========================================
FROM node:24-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

# Solo dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copiamos el código compilado
COPY --from=builder /app/dist ./dist

# Schema y migraciones (necesarios para `prisma migrate deploy` en despliegue)
COPY prisma ./prisma/

# Copiamos el cliente de Prisma generado
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=base /app/node_modules/@prisma ./node_modules/@prisma

# Seguridad: cambiamos permisos y usuario
RUN chown -R node:node /app
USER node

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

EXPOSE 3000
CMD ["node", "dist/src/server.js"]