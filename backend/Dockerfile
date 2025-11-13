# Imagen base de Node.js 22
FROM node:22-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias primero (para caché)
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production

# Copiar el resto del código
COPY . .

# Exponer puerto (el que uses en tu .env o 3000 por defecto)
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "server.js"]