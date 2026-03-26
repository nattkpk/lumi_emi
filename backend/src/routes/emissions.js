const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { useCache, clearCache } = require('../middleware/cacheMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/trend', useCache, async (req, res, next) => {
  try {
    const { country } = req.query;
    if (!country) return res.status(400).json({ message: 'country iso code is required' });

    const countryRecord = await prisma.country.findUnique({ where: { iso_code: country } });
    if (!countryRecord) return res.status(404).json({ message: 'Country not found' });

    const emissions = await prisma.emission.findMany({
      where: { countryId: countryRecord.id, sector: 'total' },
      orderBy: { year: 'asc' }
    });

    const trendData = {};
    emissions.forEach(e => {
      if (!trendData[e.year]) trendData[e.year] = { year: e.year };
      trendData[e.year][e.gas_type] = e.value;
    });

    res.json(Object.values(trendData).sort((a, b) => a.year - b.year));
  } catch (err) {
    next(err);
  }
});

router.get('/map', useCache, async (req, res, next) => {
  try {
    const { year, gas } = req.query;
    if (!year) return res.status(400).json({ message: 'year is required' });

    const yr = parseInt(year);
    if (isNaN(yr)) return res.status(400).json({ message: 'year must be a number' });

    const gasType = gas || 'total_ghg';

    const emissions = await prisma.emission.findMany({
      where: { year: yr, gas_type: gasType, sector: 'total' },
      include: { country: true }
    });

    res.json(emissions.map(e => ({
      iso_code: e.country.iso_code,
      name: e.country.name,
      value: e.value
    })));
  } catch (err) {
    next(err);
  }
});

router.get('/sector', useCache, async (req, res, next) => {
  try {
    const { country, year, gas } = req.query;
    if (!country || !year) return res.status(400).json({ message: 'country and year are required' });

    const gasType = gas || 'co2';
    const yr = parseInt(year);
    if (isNaN(yr)) return res.status(400).json({ message: 'year must be a number' });

    const countryRecord = await prisma.country.findUnique({ where: { iso_code: country } });
    if (!countryRecord) return res.status(404).json({ message: 'Country not found' });

    let sectorData = [];

    if (gasType === 'total_ghg') {
      const emissions = await prisma.emission.findMany({
        where: {
          countryId: countryRecord.id,
          year: yr,
          sector: 'total',
          gas_type: { not: 'total_ghg' }
        }
      });
      sectorData = emissions.map(e => ({
        sector: e.gas_type.replace('_', ' ').toUpperCase(),
        value: e.value,
        unit: e.unit
      }));
    } else {
      const emissions = await prisma.emission.findMany({
        where: {
          countryId: countryRecord.id,
          year: yr,
          sector: { not: 'total' },
          gas_type: gasType
        }
      });
      sectorData = emissions.map(e => ({
        sector: e.sector,
        value: e.value,
        unit: e.unit
      }));
    }

    res.json(sectorData);
  } catch (err) {
    next(err);
  }
});

router.get('/filter', useCache, async (req, res, next) => {
  try {
    const { country, gas, year } = req.query;
    if (!gas) return res.status(400).json({ message: 'gas is required' });

    const query = { gas_type: gas, sector: 'total' };

    if (country && country !== 'all') {
      const countriesList = country.split(',');
      const countryRecords = await prisma.country.findMany({
        where: { iso_code: { in: countriesList } }
      });
      if (!countryRecords.length) return res.status(404).json({ message: 'No valid countries found' });
      query.countryId = { in: countryRecords.map(c => c.id) };
    }

    if (year) {
      if (isNaN(parseInt(year))) return res.status(400).json({ message: 'year must be a number' });
      query.year = parseInt(year);
    }

    const emissions = await prisma.emission.findMany({
      where: query,
      orderBy: { year: 'desc' },
      include: { country: true }
    });

    res.json(emissions.map(e => ({
      ...e,
      iso_code: e.country.iso_code,
      country_name: e.country.name
    })));
  } catch (err) {
    next(err);
  }
});

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { iso_code, year, gas_type, sector, value, unit } = req.body;
    if (!iso_code || !year || !gas_type || !sector) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const country = await prisma.country.findUnique({ where: { iso_code } });
    if (!country) return res.status(404).json({ message: 'Country not found' });

    const emission = await prisma.emission.create({
      data: {
        countryId: country.id,
        year: parseInt(year),
        gas_type,
        sector,
        value: parseFloat(value),
        unit: unit || 'MtCO2e'
      }
    });

    clearCache();
    res.status(201).json(emission);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { value, unit } = req.body;
    const emission = await prisma.emission.update({
      where: { id: parseInt(req.params.id) },
      data: {
        value: value !== undefined ? parseFloat(value) : undefined,
        unit
      }
    });

    clearCache();
    res.json(emission);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Emission not found' });
    next(err);
  }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    await prisma.emission.delete({
      where: { id: parseInt(req.params.id) }
    });

    clearCache();
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Emission not found' });
    next(err);
  }
});

module.exports = router;
