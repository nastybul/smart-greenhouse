const { PrismaClient } = require('@prisma/client');

// Глобальна підтримка BigInt для коректної конвертації в JSON та рендерингу
BigInt.prototype.toJSON = function () {
    return Number(this);
};

const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

module.exports = prisma;