const express = require('express');
const prisma = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Перегляд списку правил автоматизації
router.get('/', requireAuth, async (req, res, next) => {
    try {
        const rules = await prisma.automationRule.findMany({
            include: {
                actuator: true,
                sensor: true
            },
            orderBy: { id: 'asc' }
        });

        const sensors = await prisma.sensor.findMany({ where: { isActive: true } });
        const actuators = await prisma.actuator.findMany();

        res.render('rules/index', { rules, sensors, actuators, error: null });
    } catch (error) {
        next(error);
    }
});

// Створення нового правила автоматизації
router.post('/', requireAuth, async (req, res, next) => {
    try {
        const { actuatorId, sensorId, conditionOperator, thresholdValue, actionDurationSec } = req.body;

        // Валідація
        if (!actuatorId || !sensorId || !conditionOperator || thresholdValue === undefined) {
            return res.status(400).send('Всі параметри правила повинні бути задані.');
        }

        const numericThreshold = parseFloat(thresholdValue);
        const duration = parseInt(actionDurationSec, 10) || 0;

        if (isNaN(numericThreshold)) {
            return res.status(400).send('Порогове значення має бути числом.');
        }

        if (!['<', '<=', '>', '>=', '='].includes(conditionOperator)) {
            return res.status(400).send('Невідомий оператор умови.');
        }

        await prisma.automationRule.create({
            data: {
                actuatorId: BigInt(actuatorId),
                sensorId: BigInt(sensorId),
                conditionOperator,
                thresholdValue: numericThreshold,
                actionDurationSec: duration,
                isEnabled: true
            }
        });

        res.redirect('/rules');
    } catch (error) {
        next(error);
    }
});

// Увімкнення / вимкнення правила
router.post('/:id/toggle', requireAuth, async (req, res, next) => {
    try {
        const ruleId = BigInt(req.params.id);
        const rule = await prisma.automationRule.findUnique({ where: { id: ruleId } });

        if (!rule) {
            return res.status(404).send('Правило не знайдено.');
        }

        await prisma.automationRule.update({
            where: { id: ruleId },
            data: { isEnabled: !rule.isEnabled }
        });

        res.redirect('/rules');
    } catch (error) {
        next(error);
    }
});

module.exports = router;