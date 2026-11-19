const express = require('express');
const prisma = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Головний дашборд розумної теплиці
router.get('/', requireAuth, async (req, res, next) => {
    try {
        // 1. Отримуємо першу доступну теплицю (або прив'язану до користувача)
        let greenhouse = await prisma.greenhouse.findFirst({
            where: { userId: BigInt(req.user.id) },
            include: {
                sensors: {
                    where: { isActive: true },
                    include: {
                        readings: {
                            orderBy: { recordedAt: 'desc' },
                            take: 1
                        }
                    }
                },
                actuators: {
                    orderBy: { id: 'asc' }
                },
                alerts: {
                    where: { isResolved: false },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        // Якщо у користувача ще немає теплиці — беремо спільну демо-теплицю
        if (!greenhouse) {
            greenhouse = await prisma.greenhouse.findFirst({
                include: {
                    sensors: {
                        where: { isActive: true },
                        include: {
                            readings: {
                                orderBy: { recordedAt: 'desc' },
                                take: 1
                            }
                        }
                    },
                    actuators: {
                        orderBy: { id: 'asc' }
                    },
                    alerts: {
                        where: { isResolved: false },
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });
        }

        if (!greenhouse) {
            return res.status(404).send('Теплицю не знайдено. Будь ласка, виконайте npm run seed.');
        }

        // Трансформуємо сенсори у зручну структуру за типом
        const telemetry = {
            airTemp: null,
            airHumidity: null,
            soilMoisture: null,
            lightLevel: null
        };

        greenhouse.sensors.forEach((sensor) => {
            const latestReading = sensor.readings[0] ? Number(sensor.readings[0].value) : null;
            if (sensor.sensorType === 'AIR_TEMP') telemetry.airTemp = { value: latestReading, unit: sensor.unit, id: sensor.id };
            if (sensor.sensorType === 'AIR_HUMIDITY') telemetry.airHumidity = { value: latestReading, unit: sensor.unit, id: sensor.id };
            if (sensor.sensorType === 'SOIL_MOISTURE') telemetry.soilMoisture = { value: latestReading, unit: sensor.unit, id: sensor.id };
            if (sensor.sensorType === 'LIGHT_LEVEL') telemetry.lightLevel = { value: latestReading, unit: sensor.unit, id: sensor.id };
        });

        res.render('dashboard/index', {
            greenhouse,
            telemetry,
            actuators: greenhouse.actuators,
            alerts: greenhouse.alerts
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;