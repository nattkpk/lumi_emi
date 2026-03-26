const csv = require('csv-parser');
const fs = require('fs');
fs.createReadStream('../data_for_test.csv')
  .pipe(csv())
  .on('data', (row) => {
    console.log('Keys:', Object.keys(row));
    console.log('Country Code:', row['Country Code']);
    process.exit(0);
  });
