FROM node:20-alpine
WORKDIR /app
COPY package.json build.js server.js index.html styles.css app.js ./
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm","start"]
