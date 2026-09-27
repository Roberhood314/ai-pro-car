FROM node:20-bookworm-slim
RUN corepack enable
WORKDIR /app
COPY source-parts ./source-parts
RUN cat source-parts/part-*.b64 | tr -d '\n' | base64 -d > /tmp/aiprocar-source.tar.gz \
 && tar -xzf /tmp/aiprocar-source.tar.gz -C /app \
 && rm -rf /app/source-parts /tmp/aiprocar-source.tar.gz
RUN pnpm install --frozen-lockfile
RUN pnpm build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh","-c","pnpm start -H 0.0.0.0 -p ${PORT:-3000}"]
