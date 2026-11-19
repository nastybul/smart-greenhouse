const prisma = require('../db');

// Проміжний шар перевірки авторизації (Route Guard)
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/auth/login');
    }
    next();
};

// Завантаження профілю користувача в глобальний контекст шаблонів
const attachUser = async (req, res, next) => {
    res.locals.currentUser = null;
    res.locals.errorMessage = null;
    res.locals.successMessage = null;

    if (req.session && req.session.userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: BigInt(req.session.userId) },
                select: { id: true, email: true, fullName: true, role: true }
            });
            if (user) {
                req.user = user;
                res.locals.currentUser = user;
            } else {
                req.session = null;
            }
        } catch (error) {
            console.error('Помилка завантаження сесії користувача:', error);
            req.session = null;
        }
    }
    next();
};

module.exports = {
    requireAuth,
    attachUser
};