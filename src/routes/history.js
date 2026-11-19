const express = require('express');
const prisma = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Сторінка ретроспективних показників та журналу подій
router.get('/', requireAuth, async (req, res, next) => {
    try {
        const { sensorId, limit = 50 } = req.query;

        const sensors = await prisma.sensor.findMany({ where: { isActive: true } });

        // Фільтр за обраним датчиком (або перший за замовчуванням)
        const selectedSensorId = sensorId ? BigInt(sensorId) : (sensors[0] ? sensors[0].id : null);

        let readings = [];
        if (selectedSensorId) {
            readings = await prisma.sensorReading.findMany({
                where: { sensorId: selectedSensorId },
                orderBy: { recordedAt: 'desc' },
                take: parseInt(limit, 10)
            });
        }

        // Останні системні логи
        const logs = await prisma.eventLog.findMany({
            take: 30,
            orderBy: { createdAt: 'desc' },
            include: { actuator: true }
        });

        res.render('history/index', {
            sensors,
            selectedSensorId: selectedSensorId ? Number(selectedSensorId) : null,
            readings,
            logs
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;