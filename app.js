const express = require('express');
const XLSX = require('xlsx');
const fs = require('fs');

const app = express();
const port = 3000;

const excelFilePath = 'street.xlsx';
const outputJsonFilePath = 'generated_addresses.json';

function generateHouseOrApartmentNumber() {
    const MIN_NUMBER = 1;
    const MAX_NUMBER = 1000;
    return Math.floor(Math.random() * (MAX_NUMBER - MIN_NUMBER + 1)) + MIN_NUMBER;
}

function parseExcelToJson(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: true });
    return jsonData;
}

function generateAddresses(streetCount) {
    const jsonData = parseExcelToJson(excelFilePath);
    console.log("Данные из Excel файла:", jsonData);
    if (streetCount > jsonData.length) {
        throw new Error(`Недостаточно данных. Файл содержит только ${jsonData.length} улиц.`);
    }
    const selectedStreets = jsonData.slice(0, streetCount);

    selectedStreets.sort((a, b) => a.street.localeCompare(b.street));

    const groupedStreets = {};
    selectedStreets.forEach((data) => {
        const firstLetter = data.street[0].toLowerCase();
        if (!groupedStreets[firstLetter]) {
            groupedStreets[firstLetter] = [];
        }
        const houseNumber = generateHouseOrApartmentNumber();
        const apartmentNumber = generateHouseOrApartmentNumber();
        const address = {
            street: data.street,
            houseNumber: houseNumber,
            apartmentNumber: apartmentNumber
        };
        groupedStreets[firstLetter].push(address);
    });

    console.log("Группированные улицы:", groupedStreets);

    fs.writeFileSync(outputJsonFilePath, JSON.stringify(groupedStreets, null, 2));
    console.log(`Улицы записаны в ${outputJsonFilePath}`);

    return groupedStreets;
}

app.get('/api/cacheSetter', (req, res) => {
    const streetCount = parseInt(req.query.streetCount);

    if (!isNaN(streetCount) && streetCount > 0) {
        try {
            const streets = generateAddresses(streetCount);
            res.json({ message: `Сгенерированы улицы для ${streetCount} улиц.`, streets });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    } else {
        res.status(400).json({ error: 'Неверное количество улиц.' });
    }
});

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});
