const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed process...');
  const csvFilePath = path.join(__dirname, '../data/owid-co2-data.csv');
  
  if (!fs.existsSync(csvFilePath)) {
    console.error(`CSV file not found at ${csvFilePath}`);
    return;
  }

  const batchSize = 1000;
  let emissionsBatch = [];
  let countriesMap = new Map(); // iso_code -> countryId
  
  // First, we need to gather unique countries
  console.log('Parsing countries...');
  const countries = new Set();
  const countryDict = {};

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
         // Filter out regional data (regions usually don't have iso_code in OWID, or we can just use those with iso_code)
         if (row.iso_code && row.country) {
            if (!countries.has(row.iso_code)) {
              countries.add(row.iso_code);
              countryDict[row.iso_code] = row.country;
            }
         }
      })
      .on('end', async () => {
         console.log(`Found ${countries.size} countries. Inserting into database...`);
         
         // Insert countries
         for (const iso of countries) {
           const countryRecord = await prisma.country.upsert({
             where: { iso_code: iso },
             update: { name: countryDict[iso] },
             create: { iso_code: iso, name: countryDict[iso] }
           });
           countriesMap.set(iso, countryRecord.id);
         }
         
         console.log('Parsing emissions...');
         
         fs.createReadStream(csvFilePath)
           .pipe(csv())
           .on('data', (row) => {
              const iso = row.iso_code;
              if (!iso || !countriesMap.has(iso)) return;
              
              const countryId = countriesMap.get(iso);
              const year = parseInt(row.year);
              if (isNaN(year)) return;

              // Parse CO2
              if (row.co2) {
                 emissionsBatch.push({ countryId, year, gas_type: 'co2', sector: 'total', value: parseFloat(row.co2), unit: 'MtCO2e' });
              }
              // Parse CH4
              if (row.methane) {
                 emissionsBatch.push({ countryId, year, gas_type: 'ch4', sector: 'total', value: parseFloat(row.methane), unit: 'MtCO2e' });
              }
              // Parse N2O
              if (row.nitrous_oxide) {
                 emissionsBatch.push({ countryId, year, gas_type: 'n2o', sector: 'total', value: parseFloat(row.nitrous_oxide), unit: 'MtCO2e' });
              }
              // Total GHG
              if (row.total_ghg) {
                 emissionsBatch.push({ countryId, year, gas_type: 'total_ghg', sector: 'total', value: parseFloat(row.total_ghg), unit: 'MtCO2e' });
              }
              
              // Sector Data (example for CO2)
              const sectors = [
                { key: 'cement_co2', name: 'cement' },
                { key: 'coal_co2', name: 'coal' },
                { key: 'flaring_co2', name: 'flaring' },
                { key: 'gas_co2', name: 'gas' },
                { key: 'oil_co2', name: 'oil' },
                { key: 'other_industry_co2', name: 'other_industry' }
              ];

              for (const s of sectors) {
                 if (row[s.key]) {
                    emissionsBatch.push({ countryId, year, gas_type: 'co2', sector: s.name, value: parseFloat(row[s.key]), unit: 'MtCO2e' });
                 }
              }
           })
           .on('end', async () => {
              console.log(`Parsed ${emissionsBatch.length} emission records. Inserting in batches...`);
              
              // Clear previous emissions to avoid unique constraint issues
              await prisma.emission.deleteMany({});
              
              for (let i = 0; i < emissionsBatch.length; i += batchSize) {
                const batch = emissionsBatch.slice(i, i + batchSize);
                await prisma.emission.createMany({
                  data: batch,
                  skipDuplicates: true
                });
                if (i % 50000 === 0) {
                  console.log(`Inserted ${i} records...`);
                }
              }
              
              console.log('Seed completed successfully!');
              resolve();
           })
           .on('error', reject);
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
