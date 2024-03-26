const XLSX = require('xlsx');

function assignHousNumberAndBuilding() {
    try {
        const workbook = XLSX.readFile('./123.xlsx');

        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];

        const range = XLSX.utils.decode_range(worksheet['!ref']);

        let houseNumber = 1;
        let buildingNumber = 1;

        for (let rowNum = range.s.r; rowNum <= range.e.r; rowNum++) {
            const cellAddress = XLSX.utils.encode_cell({ r: rowNum, c: 0 });
            const cell = worksheet[cellAddress];
            const streetName = cell.v;
                for (let i = 0; i < 100; i++) {
                    for (let j = 0; j < 50; j++) {

                        console.log(`улица ${streetName} дом ${houseNumber} корпус ${buildingNumber}`);

                        buildingNumber++;
                        if (buildingNumber > 50) {
                            houseNumber++
                            buildingNumber = 1;
                        }
                        if (houseNumber > 100) {
                            houseNumber = 1;
                        }
                    }

                }
        }
        console.log('Номера домов и корпуса были успешно сгенерированы');
    } catch (err) {
        console.error('Error', err)
    }
}
assignHousNumberAndBuilding();
