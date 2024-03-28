const express = require('express');
const XLSX = require('xlsx');
const fs = require('fs');

const app = express();
const port = 3000;

const excelFilePath = 'street.xlsx';
const outputJsonFilePath = 'generated_addresses.json';

const parseExcelToJson = (filePath) => {
    const workBook = XLSX.readFile(filePath);
    const sheetName = workBook.SheetNames[0];
    const workSheet = workBook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(workSheet, { raw: true });

    return jsonData;
};

const generateAddressesForStreet = (streetName) => {
    const minNumberHouse = 1;
    const maxNumberHouse = 10;
    const minNumberApartment = 1;
    const maxNumberApartment = 20;
    const streetAddresses = [];
    let houseNumber = minNumberHouse;
    let apartmentNumber = minNumberApartment;

    for (let i = minNumberHouse; i <= maxNumberHouse; i++) {
        for (let j = minNumberApartment; j <= maxNumberApartment; j++) {
            const address = {
                street: streetName,
                houseNumber: houseNumber,
                apartmentNumber: apartmentNumber
            };

            streetAddresses.push(address);
            apartmentNumber++;

            if (apartmentNumber > maxNumberApartment) {
                houseNumber++;
                apartmentNumber = minNumberApartment;
            }
        }
    }

    return streetAddresses;
};

const generateAddresses = async (streetCount) => {
    try {
        const jsonData = parseExcelToJson(excelFilePath);

        if (!Array.isArray(jsonData) || jsonData.length === 0) {
            console.error('Отсутствуют данные в Excel файле.');

            return;
        }

        if (streetCount > jsonData.length) {
            console.warn(`Внимание: запрошено больше улиц, чем есть в файле. Будут обработаны только доступные улицы.`);
        }

        if (streetCount <= 0 || isNaN(streetCount)) {
            console.error('Неверное количество улиц.');

            return;
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

        await fs.writeFileSync(outputJsonFilePath, JSON.stringify(groupedStreets, null, 2));
        console.log(`Улицы записаны в ${outputJsonFilePath}`);

        return groupedStreets;
    } catch (error) {
        console.error('Ошибка при генерации улиц:', error);
    }
};

const checkAndGenerateAddresses = () => {
    if (!fs.existsSync(outputJsonFilePath)) {
        try {
            generateAddresses(streetCount);
        } catch (error) {
            console.error('Ошибка при генерации улиц:', error);
        }
    } else {
        console.log('Файл с улицами уже существует. Ничего не делаем.');
    }
};

app.get('/api/cacheSetter', async (req, res) => {
    try {
        const streetCount = parseInt(req.query.streetCount);
        const streets = await generateAddresses(streetCount);

        res.send({ message: `Сгенерированы улицы для ${streetCount} улиц.`, streets });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
    checkAndGenerateAddresses();
});
