const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../db');

const router = express.Router();

// Сторінка входу
router.get('/login', (req, res) => {
    if (req.session && req.session.userId) {
        return res.redirect('/');
    }
    res.render('auth/login', { error: null });
});

// Обробка форми входу
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1. Ручна валідація вхідних даних
        if (!email || !password) {
            return res.status(400).render('auth/login', {
                error: "Будь ласка, заповніть усі обов'язкові поля."
            });
        }

        // 2. Пошук користувача
        const user = await prisma.user.findUnique({
            where: { email: email.trim().toLowerCase() }
        });

        if (!user) {
            return res.status(401).render('auth/login', {
                error: 'Невірний email або пароль.'
            });
        }

        // 3. Звірка bcrypt-хешу пароля
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).render('auth/login', {
                error: 'Невірний email або пароль.'
            });
        }

        // 4. Збереження ідентифікатора в сесії
        req.session.userId = user.id.toString();
        res.redirect('/');
    } catch (error) {
        next(error);
    }
});

// Сторінка реєстрації
router.get('/register', (req, res) => {
    if (req.session && req.session.userId) {
        return res.redirect('/');
    }
    res.render('auth/register', { error: null, formData: {} });
});

// Обробка форми реєстрації
router.post('/register', async (req, res, next) => {
    try {
        const { fullName, email, password, confirmPassword } = req.body;
        const cleanEmail = email ? email.trim().toLowerCase() : '';

        // Валідація: наявність полів
        if (!fullName || !cleanEmail || !password || !confirmPassword) {
            return res.status(400).render('auth/register', {
                error: "Всі поля форми є обов'язковими для заповнення.",
                formData: { fullName, email }
            });
        }

        // Валідація формату email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).render('auth/register', {
                error: 'Введено некоректний формат електронної пошти.',
                formData: { fullName, email }
            });
        }

        // Валідація довжини пароля
        if (password.length < 6) {
            return res.status(400).render('auth/register', {
                error: 'Пароль повинен містити щонайменше 6 символів.',
                formData: { fullName, email }
            });
        }

        // Перевірка збігу паролів
        if (password !== confirmPassword) {
            return res.status(400).render('auth/register', {
                error: 'Введені паролі не збігаються.',
                formData: { fullName, email }
            });
        }

        // Перевірка на унікальність email
        const existingUser = await prisma.user.findUnique({
            where: { email: cleanEmail }
        });

        if (existingUser) {
            return res.status(409).render('auth/register', {
                error: 'Користувач з такою поштою вже зареєстрований.',
                formData: { fullName, email }
            });
        }

        // Хешування пароля
        const passwordHash = await bcrypt.hash(password, 10);

        // Створення користувача та його базової теплиці
        const newUser = await prisma.user.create({
            data: {
                fullName: fullName.trim(),
                email: cleanEmail,
                passwordHash,
                role: 'OPERATOR',
                greenhouses: {
                    create: {
                        name: `Теплиця (${fullName.trim()})`,
                        location: 'Сектор 1'
                    }
                }
            }
        });

        req.session.userId = newUser.id.toString();
        res.redirect('/');
    } catch (error) {
        next(error);
    }
});

// Вихід із системи
router.post('/logout', (req, res) => {
    req.session = null;
    res.redirect('/auth/login');
});

module.exports = router;