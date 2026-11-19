require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieSession = require('cookie-session');

const { attachUser } = require('./middleware/auth');

// Імпорт маршрутів
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const actuatorRoutes = require('./routes/actuators');
const ruleRoutes = require('./routes/rules');
const historyRoutes = require('./routes/history');
const alertRoutes = require('./routes/alerts');

const app = express();
const PORT = process.env.PORT || 3000;

// Обов'язкове налаштування для хостингів та проксі-серверів (Render, Railway, Nginx)
app.set('trust proxy', 1);

// Налаштування шаблонізатора EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Статичні файли (CSS, логотипи, JS)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Парсинг форм і JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Налаштування безпечних cookie-сесій
app.use(
    cookieSession({
        name: 'smart_greenhouse_session',
        keys: [process.env.SESSION_SECRET || 'greenhouse_fallback_secret_key_321'],
        maxAge: 24 * 60 * 60 * 1000, // 24 години
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    })
);

// Глобальне підключення даних користувача до шаблонів
app.use(attachUser);

// Підключення модульних маршрутів
app.use('/auth', authRoutes);
app.use('/actuators', actuatorRoutes);
app.use('/rules', ruleRoutes);
app.use('/history', historyRoutes);
app.use('/alerts', alertRoutes);
app.use('/', dashboardRoutes);

// Централізований обробник помилок
app.use((err, req, res, next) => {
    console.error('Помилка сервера:', err);

    if (res.headersSent) {
        return next(err);
    }

    res.status(500).render('error', {
        message: 'Виникла непередбачувана помилка при роботі системи теплиці. Будь ласка, спробуйте пізніше.'
    });
});

// Запуск вебсервера
app.listen(PORT, () => {
    console.log(`Сервер розумної теплиці успішно запущено на порту ${PORT}`);
    console.log(`Локальна адреса: http://localhost:${PORT}`);
});