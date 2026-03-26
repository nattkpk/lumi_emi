const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting World Bank data seed process...');
  const csvFilePath = path.join(__dirname, '../data/data_for_test.csv');
  
  if (!fs.existsSync(csvFilePath)) {
    console.error(`CSV file not found at ${csvFilePath}`);
    return;
  }

  const batchSize = 1000;
  let emissionsBatch = [];
  let countriesMap = new Map(); // iso_code -> countryId
  
  const seriesMap = {
    'EN.ATM.GHGT.KT.CE': { gas: 'total_ghg', sector: 'total' },
    'EN.ATM.CO2E.KT': { gas: 'co2', sector: 'total' },
    'EN.ATM.METH.KT.CE': { gas: 'ch4', sector: 'total' },
    'EN.ATM.NOXE.KT.CE': { gas: 'n2o', sector: 'total' },
    // Sectors
    'EN.ATM.METH.AG.KT.CE': { gas: 'ch4', sector: 'agriculture' },
    'EN.ATM.METH.EG.KT.CE': { gas: 'ch4', sector: 'energy' },
    'EN.ATM.NOXE.AG.KT.CE': { gas: 'n2o', sector: 'agriculture' },
    'EN.ATM.NOXE.EG.KT.CE': { gas: 'n2o', sector: 'energy' }
  };

  const countries = new Set();
  const countryNames = {};

  console.log('Step 1: Parsing countries...');
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        const iso = row['Country Code'];
        const name = row['Country Name'];
        if (iso && name && iso.length === 3) {
          if (!countries.has(iso)) {
            countries.add(iso);
            countryNames[iso] = name;
          }
        }
      })
      .on('end', async () => {
        console.log(`Found ${countries.size} countries. Upserting...`);
        for (const iso of countries) {
          const countryRecord = await prisma.country.upsert({
            where: { iso_code: iso },
            update: { name: countryNames[iso] },
            create: { iso_code: iso, name: countryNames[iso] }
          });
          countriesMap.set(iso, countryRecord.id);
        }
        resolve();
      })
      .on('error', reject);
  });

  console.log('Step 2: Parsing emissions (Wide to Long mapping)...');
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        const iso = row['Country Code'];
        const seriesCode = row['Series Code'];
        
        if (!countriesMap.has(iso) || !seriesMap[seriesCode]) return;
        
        const countryId = countriesMap.get(iso);
        const mapping = seriesMap[seriesCode];

        // Parse years 1990 to 2023
        for (let year = 1990; year <= 2023; year++) {
          const colName = `${year} [YR${year}]`;
          let valStr = row[colName];
          
          if (valStr && valStr !== '..' && valStr !== 'NA') {
            const val = parseFloat(valStr);
            if (!isNaN(val)) {
              emissionsBatch.push({
                countryId,
                year,
                gas_type: mapping.gas,
                sector: mapping.sector,
                value: val / 1000, // Convert kt to Mt
                unit: 'MtCO2e'
              });
            }
          }
        }
      })
      .on('end', async () => {
        console.log(`Parsed ${emissionsBatch.length} records. Clearing old data and inserting...`);
        
        await prisma.emission.deleteMany({});
        
        for (let i = 0; i < emissionsBatch.length; i += batchSize) {
          const batch = emissionsBatch.slice(i, i + batchSize);
          await prisma.emission.createMany({
            data: batch,
            skipDuplicates: true
          });
          if (i % 5000 === 0) console.log(`Inserted ${i} records...`);
        }
        
        console.log('Seed completed successfully!');
        resolve();
      })
      .on('error', reject);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
