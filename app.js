const express = require('express');
const XLSX = require('xlsx');
const fs = require('fs');

const app = express();
const port = 3000;

const excelFilePath = 'street.xlsx';
const outputJsonFilePath = 'generated_addresses.json';

function generateHouseOrApartmentNumber(isHouse) {
    const MIN_NUMBER = 1;
    const MAX_NUMBER = 1000;
    const number = Math.floor(Math.random() * (MAX_NUMBER - MIN_NUMBER + 1)) + MIN_NUMBER;
    if (isHouse) {
        return number <= 1000 ? number : generateHouseOrApartmentNumber(isHouse);
    } else {
        return number >= 1 ? number : generateHouseOrApartmentNumber(isHouse);
    }
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
        throw new Error(`Файл содержит только ${jsonData.length} улиц.`);
    }
    const selectedStreets = jsonData.slice(0, streetCount);

    const addresses = selectedStreets.map((data, index) => {
        console.log("Обработанные данные для улицы", index + 1, ":", data);
        const houseNumber = generateHouseOrApartmentNumber(true);
        const apartmentNumber = generateHouseOrApartmentNumber(false);
        let address = `улица ${data.street} дом ${houseNumber}`;
        if (apartmentNumber < 1000) {
            address += ` корпус ${apartmentNumber}`;
        }

        return {
            id: index + 1,
            address: address
        };
    });

    console.log("Сгенерированные адреса:", addresses);

    fs.writeFileSync(outputJsonFilePath, JSON.stringify(addresses, null, 2));
    console.log(`Сгенерированные адреса записаны в ${outputJsonFilePath}`);

    return addresses;
}

app.get('/api/cacheSetter', (req, res) => {
    const streetCount = parseInt(req.query.streetCount);

    if (!isNaN(streetCount) && streetCount > 0) {
        try {
            const addresses = generateAddresses(streetCount);
            res.json({ message: `Сгенерированы адреса для ${streetCount} улиц.`, addresses });
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
