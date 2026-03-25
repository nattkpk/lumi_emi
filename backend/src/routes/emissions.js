const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { useCache, clearCache } = require('../middleware/cacheMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/emissions/trend
// Query: country (iso_code)
router.get('/trend', useCache, async (req, res, next) => {
  try {
    const { country } = req.query;
    if (!country) return res.status(400).json({ message: 'country iso code is required' });

    const countryRecord = await prisma.country.findUnique({ where: { iso_code: country } });
    if (!countryRecord) return res.status(404).json({ message: 'Country not found' });

    // Fetch emissions where sector is 'total'
    const emissions = await prisma.emission.findMany({
      where: { countryId: countryRecord.id, sector: 'total' },
      orderBy: { year: 'asc' }
    });

    // Group by year
    const trendData = {};
    emissions.forEach(e => {
      if (!trendData[e.year]) {
        trendData[e.year] = { year: e.year };
      }
      trendData[e.year][e.gas_type] = e.value;
    });

    res.json(Object.values(trendData).sort((a, b) => a.year - b.year));
  } catch (err) {
    next(err);
  }
});

// GET /api/emissions/map
// Query: year
router.get('/map', useCache, async (req, res, next) => {
  try {
    const { year } = req.query;
    if (!year) return res.status(400).json({ message: 'year is required' });

    const yr = parseInt(year);
    if (isNaN(yr)) return res.status(400).json({ message: 'year must be a number' });

    const emissions = await prisma.emission.findMany({
      where: { year: yr, gas_type: 'total_ghg', sector: 'total' },
      include: { country: true }
    });

    const mapData = emissions.map(e => ({
      iso_code: e.country.iso_code,
      name: e.country.name,
      total_ghg: e.value
    }));

    res.json(mapData);
  } catch (err) {
    next(err);
  }
});

// GET /api/emissions/sector
// Query: country (iso_code), year
router.get('/sector', useCache, async (req, res, next) => {
  try {
    const { country, year } = req.query;
    if (!country || !year) return res.status(400).json({ message: 'country and year are required' });

    const yr = parseInt(year);
    if (isNaN(yr)) return res.status(400).json({ message: 'year must be a number' });

    const countryRecord = await prisma.country.findUnique({ where: { iso_code: country } });
    if (!countryRecord) return res.status(404).json({ message: 'Country not found' });

    // Fetch emissions where sector is not 'total' and gas_type is usually co2 or total_ghg
    // OWID mostly has sector breakdown for CO2
    const emissions = await prisma.emission.findMany({
      where: { 
        countryId: countryRecord.id, 
        year: yr,
        sector: { not: 'total' },
        gas_type: 'co2' 
      }
    });

    const sectorData = emissions.map(e => ({
      sector: e.sector,
      value: e.value,
      unit: e.unit
    }));

    res.json(sectorData);
  } catch (err) {
    next(err);
  }
});

// GET /api/emissions/filter
// Query: country, gas, year (optional)
router.get('/filter', useCache, async (req, res, next) => {
  try {
    const { country, gas, year } = req.query;
    if (!country || !gas) return res.status(400).json({ message: 'country and gas are required' });

    const countryRecord = await prisma.country.findUnique({ where: { iso_code: country } });
    if (!countryRecord) return res.status(404).json({ message: 'Country not found' });

    const query = {
      countryId: countryRecord.id,
      gas_type: gas,
      sector: 'total'
    };
    if (year) {
      if (isNaN(parseInt(year))) return res.status(400).json({ message: 'year must be a number' });
      query.year = parseInt(year);
    }

    const emissions = await prisma.emission.findMany({
      where: query,
      orderBy: { year: 'asc' }
    });

    res.json(emissions);
  } catch (err) {
    next(err);
  }
});

// POST /api/emissions
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

// PUT /api/emissions/:id
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

// DELETE /api/emissions/:id
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
