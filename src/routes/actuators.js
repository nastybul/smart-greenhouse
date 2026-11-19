const express = require('express');
const prisma = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// АТОМАРНА ТРАНЗАКЦІЯ: Перемикання стану обладнання (Увімк/Вимк) з аудитом
router.post('/:id/toggle', requireAuth, async (req, res, next) => {
    try {
        const actuatorId = BigInt(req.params.id);

        // 1. Пошук пристрою
        const actuator = await prisma.actuator.findUnique({
            where: { id: actuatorId }
        });

        if (!actuator) {
            return res.status(404).send('Виконавчий пристрій не знайдено.');
        }

        const nextStatus = actuator.status === 'ON' ? 'OFF' : 'ON';
        const actionUa = nextStatus === 'ON' ? 'увімкнув' : 'вимкнув';

        // 2. Виконання атомарної транзакції (Prisma $transaction)
        await prisma.$transaction(async (tx) => {
            // Крок 1 транзакції: оновлюємо стан актуатора та фіксуємо ручний режим
            const updatedActuator = await tx.actuator.update({
                where: { id: actuatorId },
                data: {
                    status: nextStatus,
                    controlMode: 'MANUAL',
                    updatedAt: new Date()
                }
            });

            // Крок 2 транзакції: записуємо подію в журнал логів
            await tx.eventLog.create({
                data: {
                    greenhouseId: updatedActuator.greenhouseId,
                    actuatorId: updatedActuator.id,
                    eventType: 'COMMAND_MANUAL',
                    message: `Користувач ${req.user.fullName} (${req.user.email}) вручну ${actionUa} пристрій: "${updatedActuator.name}".`
                }
            });
        });

        res.redirect('/');
    } catch (error) {
        next(error);
    }
});

// Перемикання режиму керування (AUTO / MANUAL)
router.post('/:id/mode', requireAuth, async (req, res, next) => {
    try {
        const actuatorId = BigInt(req.params.id);
        const { mode } = req.body;

        if (!['AUTO', 'MANUAL'].includes(mode)) {
            return res.status(400).send('Неприпустимий режим керування.');
        }

        await prisma.$transaction(async (tx) => {
            const updated = await tx.actuator.update({
                where: { id: actuatorId },
                data: { controlMode: mode }
            });

            await tx.eventLog.create({
                data: {
                    greenhouseId: updated.greenhouseId,
                    actuatorId: updated.id,
                    eventType: 'SYSTEM',
                    message: `Змінено режим роботи пристрою "${updated.name}" на: ${mode === 'AUTO' ? 'АВТОМАТИЧНИЙ' : 'РУЧНИЙ'}.`
                }
            });
        });

        res.redirect('/');
    } catch (error) {
        next(error);
    }
});

module.exports = router;