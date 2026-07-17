# 1. Builder Stage - Compila la aplicación y genera Prisma Client
FROM node:24-alpine AS builder

WORKDIR /app

# Copiamos archivos de dependencias y el schema de Prisma
COPY package*.json ./
COPY prisma ./prisma/

# Instalamos TODAS las dependencias (incluyendo devDependencies como TypeScript)
RUN npm ci

# Generamos el cliente de Prisma
RUN npx prisma generate

# Copiamos el resto del código y compilamos
COPY . .
RUN npm run build

# 2. Production Runner Stage - Imagen final optimizada y segura
FROM node:24-alpine AS runner

WORKDIR /app

# Establecemos entorno de producción
ENV NODE_ENV=production

# Copiamos package.json para instalar solo dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copiamos el código compilado desde la etapa "builder"
COPY --from=builder /app/dist ./dist

# Copiamos el cliente de Prisma generado desde la etapa "builder"
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Cambiamos permisos de los archivos al usuario no root 'node' (incluido en node-alpine)
RUN chown -R node:node /app

# Cambiamos al usuario no privilegiado 'node'
USER node

# Healthcheck para que Docker/K8s sepa si el contenedor está saludable
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

EXPOSE 3000

CMD ["npm", "run", "start"]