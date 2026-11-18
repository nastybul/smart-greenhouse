const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Початок очищення та наповнення бази даних (Seeding)...');

    // 1. Очищення бази (у порядку, що враховує зовнішні ключі)
    await prisma.alert.deleteMany();
    await prisma.eventLog.deleteMany();
    await prisma.automationRule.deleteMany();
    await prisma.actuator.deleteMany();
    await prisma.sensorReading.deleteMany();
    await prisma.sensor.deleteMany();
    await prisma.greenhouse.deleteMany();
    await prisma.user.deleteMany();

    console.log('Попередні дані успішно очищено.');

    // 2. Хешування паролів
    const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
    const operatorPasswordHash = await bcrypt.hash('Operator123!', 10);

    // 3. Створення користувачів
    const adminUser = await prisma.user.create({
        data: {
            email: 'admin@greenhouse.local',
            passwordHash: adminPasswordHash,
            fullName: 'Олександр Петрович (Викладач / Адмін)',
            role: 'ADMIN'
        }
    });

    const operatorUser = await prisma.user.create({
        data: {
            email: 'operator@greenhouse.local',
            passwordHash: operatorPasswordHash,
            fullName: 'Іван Агроном (Оператор системи)',
            role: 'OPERATOR'
        }
    });

    console.log('Створено користувачів:', adminUser.email, operatorUser.email);

    // 4. Створення теплиці для адміна
    const greenhouse = await prisma.greenhouse.create({
        data: {
            userId: adminUser.id,
            name: 'Експериментальна Теплиця №1 (Овочева)',
            location: 'Сектор А-12, Агропарк'
        }
    });

    console.log('Створено теплицю:', greenhouse.name);

    // 5. Створення датчиків теплиці
    const tempSensor = await prisma.sensor.create({
        data: {
            greenhouseId: greenhouse.id,
            sensorType: 'AIR_TEMP',
            model: 'DHT22 Digital Probe',
            unit: '°C'
        }
    });

    const airHumiditySensor = await prisma.sensor.create({
        data: {
            greenhouseId: greenhouse.id,
            sensorType: 'AIR_HUMIDITY',
            model: 'DHT22 Digital Probe',
            unit: '%'
        }
    });

    const soilMoistureSensor = await prisma.sensor.create({
        data: {
            greenhouseId: greenhouse.id,
            sensorType: 'SOIL_MOISTURE',
            model: 'Capacitive Soil v1.2',
            unit: '%'
        }
    });

    const lightSensor = await prisma.sensor.create({
        data: {
            greenhouseId: greenhouse.id,
            sensorType: 'LIGHT_LEVEL',
            model: 'BH1750 Ambient Sensor',
            unit: 'Lux'
        }
    });

    console.log('Створено 4 вимірювальні датчики.');

    // 6. Створення часових показників (Телеметрія за останні години)
    const now = new Date();
    const readingsData = [
        // Температура повітря
        { sensorId: tempSensor.id, value: 23.4, recordedAt: new Date(now.getTime() - 1000 * 60 * 60 * 3) },
        { sensorId: tempSensor.id, value: 24.1, recordedAt: new Date(now.getTime() - 1000 * 60 * 60 * 2) },
        { sensorId: tempSensor.id, value: 25.8, recordedAt: new Date(now.getTime() - 1000 * 60 * 60 * 1) },
        { sensorId: tempSensor.id, value: 24.5, recordedAt: now },

        // Вологість повітря
        { sensorId: airHumiditySensor.id, value: 68.2, recordedAt: new Date(now.getTime() - 1000 * 60 * 60 * 2) },
        { sensorId: airHumiditySensor.id, value: 65.0, recordedAt: now },

        // Вологість ґрунту (критично знизилась перед поливом)
        { sensorId: soilMoistureSensor.id, value: 34.0, recordedAt: new Date(now.getTime() - 1000 * 60 * 60 * 2) },
        { sensorId: soilMoistureSensor.id, value: 28.5, recordedAt: new Date(now.getTime() - 1000 * 60 * 45) },
        { sensorId: soilMoistureSensor.id, value: 52.0, recordedAt: now },

        // Рівень освітленості
        { sensorId: lightSensor.id, value: 12000.0, recordedAt: new Date(now.getTime() - 1000 * 60 * 60 * 2) },
        { sensorId: lightSensor.id, value: 8500.0, recordedAt: now }
    ];

    for (const reading of readingsData) {
        await prisma.sensorReading.create({ data: reading });
    }

    console.log(`Додано ${readingsData.length} записів показників телеметрії.`);

    // 7. Створення виконавчих пристроїв (Актуаторів)
    const waterPump = await prisma.actuator.create({
        data: {
            greenhouseId: greenhouse.id,
            actuatorType: 'WATER_PUMP',
            name: 'Головна помпа крапельного зрошення',
            status: 'OFF',
            controlMode: 'AUTO'
        }
    });

    const fan = await prisma.actuator.create({
        data: {
            greenhouseId: greenhouse.id,
            actuatorType: 'VENTILATION',
            name: 'Витяжний даховий вентилятор',
            status: 'OFF',
            controlMode: 'AUTO'
        }
    });

    const growLight = await prisma.actuator.create({
        data: {
            greenhouseId: greenhouse.id,
            actuatorType: 'LIGHTING',
            name: 'Світлодіодна фітопанель 200W',
            status: 'ON',
            controlMode: 'MANUAL'
        }
    });

    console.log('Створено актуатори: помпа, вентиляція, освітлення.');

    // 8. Створення правил автоматизації
    await prisma.automationRule.create({
        data: {
            actuatorId: waterPump.id,
            sensorId: soilMoistureSensor.id,
            conditionOperator: '<',
            thresholdValue: 30.0,
            actionDurationSec: 300,
            isEnabled: true
        }
    });

    await prisma.automationRule.create({
        data: {
            actuatorId: fan.id,
            sensorId: tempSensor.id,
            conditionOperator: '>',
            thresholdValue: 28.0,
            actionDurationSec: 600,
            isEnabled: true
        }
    });

    console.log('Створено правила автопілота: автополив та терморегуляція.');

    // 9. Створення журналу логів
    await prisma.eventLog.create({
        data: {
            greenhouseId: greenhouse.id,
            actuatorId: waterPump.id,
            eventType: 'COMMAND_AUTO',
            message: 'Автоматика: вологість ґрунту впала нижче 30%. Увімкнено полив на 5 хвилин.',
            createdAt: new Date(now.getTime() - 1000 * 60 * 40)
        }
    });

    await prisma.eventLog.create({
        data: {
            greenhouseId: greenhouse.id,
            actuatorId: growLight.id,
            eventType: 'COMMAND_MANUAL',
            message: 'Користувач admin@greenhouse.local вручну увімкнув фітоосвітлення.',
            createdAt: new Date(now.getTime() - 1000 * 60 * 15)
        }
    });

    // 10. Створення сповіщення
    await prisma.alert.create({
        data: {
            greenhouseId: greenhouse.id,
            severity: 'WARNING',
            title: 'Низька вологість ґрунту',
            message: 'Вологість ґрунту опускалась до 28.5%. Автополив було успішно ініційовано.',
            isResolved: true
        }
    });

    console.log('Усі тестові дані успішно завантажено в базу Neon!');
}

main()
    .catch((e) => {
        console.error('Помилка виконання seed-скрипту:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });