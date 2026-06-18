FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY .env.production .env
EXPOSE 3000
CMD ["node", "dist/main"]
