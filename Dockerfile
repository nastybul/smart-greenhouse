FROM node:20-slim

# Встановлюємо OpenSSL, обов'язковий для коректної роботи Prisma
RUN apt-get update -y && apt-get install -y openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Копіюємо конфігурації пакетів для кешування шарів Docker
COPY package*.json ./

# Встановлюємо лише продакшн-залежності
RUN npm ci --omit=dev

# Копіюємо вихідний код
COPY . .

EXPOSE 3000

# Запуск вебсервера
CMD ["node", "src/app.js"]