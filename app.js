const express = require('express');
const XLSX = require('xlsx');
const fs = require('fs');

const app = express();
const port = 3000;

const excelFilePath = 'street.xlsx';
const outputJsonFilePath = 'generated_addresses.json';

function parseExcelToJson(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: true });
    
    return jsonData;
}

function generateAddressesForStreet(streetName) {
    const minnuber = 1;
    const maxnumber = 100;
    const streetAddresses = [];
    let houseNumber = minnuber;
    let apartmentNumber = minnuber;

    for (let i = minnuber; i <= maxnumber; i++) {
        for (let j = minnuber; j <= maxnumber; j++) {
            const address = {
                street: streetName,
                houseNumber: houseNumber,
                apartmentNumber: apartmentNumber
            };

            streetAddresses.push(address);
            apartmentNumber++;

            if (apartmentNumber > maxnumber) {
                houseNumber++;
                apartmentNumber = minnuber;
            }
        }
    }

    return streetAddresses;
}

function generateAddresses(streetCount) {
    const jsonData = parseExcelToJson(excelFilePath);
    console.log("Данные из Excel файла:", jsonData);

    if (!Array.isArray(jsonData) || jsonData.length === 0) {
        throw new Error('Отсутствуют данные в Excel файле.');
    }

    if (streetCount > jsonData.length) {
        throw new Error(`Недостаточно данных. Файл содержит только ${jsonData.length} улиц.`);
    }

    if (streetCount <= 0 || isNaN(streetCount)) {
        throw new Error('Неверное количество улиц.');
    }

    const selectedStreets = jsonData.slice(0, streetCount);

    selectedStreets.sort((a, b) => a.street.localeCompare(b.street));

    const groupedStreets = {};

    selectedStreets.forEach((data) => {
        const firstLetter = data.street[0].toLowerCase();

        if (!groupedStreets[firstLetter]) {
            groupedStreets[firstLetter] = [];
        }

        const streetAddresses = generateAddressesForStreet(data.street);
        groupedStreets[firstLetter].push(...streetAddresses);
    });

    console.log("Группированные улицы:", groupedStreets);

    fs.writeFileSync(outputJsonFilePath, JSON.stringify(groupedStreets, null, 2));
    console.log(`Улицы записаны в ${outputJsonFilePath}`);

    return groupedStreets;
}

app.get('/api/cacheSetter', (req, res) => {
    try {
        const streetCount = parseInt(req.query.streetCount);

        if (isNaN(streetCount) || streetCount <= 0) {
            throw new Error('Неверное количество улиц.');
        }
        
        const streets = generateAddresses(streetCount);
        res.json({ message: `Сгенерированы улицы для ${streetCount} улиц.`, streets });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});
