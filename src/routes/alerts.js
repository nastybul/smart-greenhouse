const express = require('express');
const prisma = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Позначити сповіщення як прочитане/вирішене
router.post('/:id/resolve', requireAuth, async (req, res, next) => {
    try {
        const alertId = BigInt(req.params.id);

        await prisma.alert.update({
            where: { id: alertId },
            data: { isResolved: true }
        });

        res.redirect('/');
    } catch (error) {
        next(error);
    }
});

module.exports = router;