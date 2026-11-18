FROM node:20-slim

# Встановлюємо OpenSSL, обов'язковий для коректної роботи Prisma
RUN apt-get update -y && apt-get install -y openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Копіюємо конфігурації пакетів для кешування шарів Docker
COPY package*.json ./

# Встановлюємо залежності
RUN npm ci --omit=dev

# Копіюємо схему та генеруємо Prisma Client всередині образу
COPY prisma ./prisma
RUN npx prisma generate

# Копіюємо решту коду
COPY . .

EXPOSE 3000

# Автоматичне застосування міграцій та старт вебсервера
CMD ["sh", "-c", "npx prisma migrate deploy && node src/app.js"]