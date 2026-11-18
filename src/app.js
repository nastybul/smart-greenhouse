require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Налаштування шаблонізатора EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Обслуговування статичних файлів (CSS, JS, зображення)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Парсери тіла запиту
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Базовий тестовий маршрут (Health Check)
app.get('/', (req, res) => {
    res.send('Система управління розумною теплицею запущена та готова до роботи.');
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер теплиці успішно запущено на порту ${PORT}`);
    console.log(`Локальна адреса: http://localhost:${PORT}`);
});