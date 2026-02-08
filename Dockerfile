# Usamos una imagen ligera de Node (versión compatible con tu proyecto)
FROM node:22-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos primero las dependencias para aprovechar la caché de Docker
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos el resto del código
COPY . .

# Generamos el cliente de Prisma (necesario porque el entorno cambia a Linux Alpine)
RUN npx prisma generate

# Exponemos el puerto que usa tu app (según tu .env.demo es el 3000)
EXPOSE 3000

# Comando por defecto para DESARROLLO (usa el script 'dev' de tu package.json)
# Esto ejecutará nodemon para escuchar cambios
CMD ["npm", "run", "dev"]