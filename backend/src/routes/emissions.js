const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { useCache, clearCache } = require('../middleware/cacheMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Emissions
 *   description: Greenhouse gas emissions data endpoints
 */

/**
 * @swagger
 * /api/emissions/trend:
 *   get:
 *     summary: Get emissions trend for a country
 *     tags: [Emissions]
 *     description: Returns yearly emissions data (total sector) for a given country, grouped by year with each gas type as a property. Cached for 5 minutes.
 *     parameters:
 *       - in: query
 *         name: country
 *         required: true
 *         schema:
 *           type: string
 *         description: ISO 3166-1 alpha-3 country code
 *         example: THA
 *     responses:
 *       200:
 *         description: Array of yearly trend data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   year:
 *                     type: integer
 *                     example: 2020
 *                   co2:
 *                     type: number
 *                     example: 254.31
 *                   ch4:
 *                     type: number
 *                     example: 102.45
 *                   n2o:
 *                     type: number
 *                     example: 23.67
 *                   total_ghg:
 *                     type: number
 *                     example: 380.43
 *       400:
 *         description: Missing country parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Country not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/emissions/map:
 *   get:
 *     summary: Get world map emissions data
 *     tags: [Emissions]
 *     description: Returns emissions values per country for a given year and gas type. Used to render the choropleth world map. Cached for 5 minutes.
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Year to query
 *         example: 2020
 *       - in: query
 *         name: gas
 *         required: false
 *         schema:
 *           type: string
 *           default: total_ghg
 *           enum: [total_ghg, co2, ch4, n2o]
 *         description: Gas type filter (defaults to total_ghg)
 *     responses:
 *       200:
 *         description: Array of country emission values
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   iso_code:
 *                     type: string
 *                     example: THA
 *                   name:
 *                     type: string
 *                     example: Thailand
 *                   value:
 *                     type: number
 *                     example: 380.43
 *       400:
 *         description: Missing or invalid year parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/emissions/sector:
 *   get:
 *     summary: Get sector breakdown for a country
 *     tags: [Emissions]
 *     description: |
 *       Returns emission values broken down by sector for a given country, year, and gas type.
 *       - If `gas=total_ghg`, returns a breakdown by gas type (co2, ch4, n2o) instead of sectors.
 *       - For other gas types, returns sector-level data (agriculture, energy, etc.).
 *     parameters:
 *       - in: query
 *         name: country
 *         required: true
 *         schema:
 *           type: string
 *         description: ISO 3166-1 alpha-3 country code
 *         example: THA
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Year to query
 *         example: 2020
 *       - in: query
 *         name: gas
 *         required: false
 *         schema:
 *           type: string
 *           default: co2
 *           enum: [total_ghg, co2, ch4, n2o]
 *         description: Gas type filter (defaults to co2)
 *     responses:
 *       200:
 *         description: Array of sector/gas breakdown values
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   sector:
 *                     type: string
 *                     example: agriculture
 *                   value:
 *                     type: number
 *                     example: 45.23
 *                   unit:
 *                     type: string
 *                     example: MtCO2e
 *       400:
 *         description: Missing required parameters or invalid year
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Country not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/emissions/filter:
 *   get:
 *     summary: Filter emissions data
 *     tags: [Emissions]
 *     description: Flexible query endpoint to filter emissions by gas type, country (or multiple countries), and year. Results are sorted by year descending. Cached for 5 minutes.
 *     parameters:
 *       - in: query
 *         name: gas
 *         required: true
 *         schema:
 *           type: string
 *           enum: [total_ghg, co2, ch4, n2o]
 *         description: Gas type to filter by
 *         example: co2
 *       - in: query
 *         name: country
 *         required: false
 *         schema:
 *           type: string
 *         description: "Comma-separated ISO codes, or 'all' for all countries"
 *         example: THA,USA,CHN
 *       - in: query
 *         name: year
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filter by specific year
 *         example: 2020
 *     responses:
 *       200:
 *         description: Filtered list of emission records with country info
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Emission'
 *                   - type: object
 *                     properties:
 *                       iso_code:
 *                         type: string
 *                         example: THA
 *                       country_name:
 *                         type: string
 *                         example: Thailand
 *       400:
 *         description: Missing gas parameter or invalid year
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: No valid countries found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/emissions:
 *   post:
 *     summary: Create a new emission record
 *     tags: [Emissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - iso_code
 *               - year
 *               - gas_type
 *               - sector
 *             properties:
 *               iso_code:
 *                 type: string
 *                 example: THA
 *                 description: ISO country code (must exist in countries table)
 *               year:
 *                 type: integer
 *                 example: 2023
 *               gas_type:
 *                 type: string
 *                 example: co2
 *               sector:
 *                 type: string
 *                 example: energy
 *               value:
 *                 type: number
 *                 example: 150.5
 *               unit:
 *                 type: string
 *                 example: MtCO2e
 *                 default: MtCO2e
 *     responses:
 *       201:
 *         description: Emission record created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Emission'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized — JWT token required
 *       404:
 *         description: Country not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Duplicate record (unique constraint violation)
 */
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

/**
 * @swagger
 * /api/emissions/{id}:
 *   put:
 *     summary: Update an emission record
 *     tags: [Emissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Emission record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: number
 *                 example: 275.8
 *               unit:
 *                 type: string
 *                 example: MtCO2e
 *     responses:
 *       200:
 *         description: Emission record updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Emission'
 *       401:
 *         description: Unauthorized — JWT token required
 *       404:
 *         description: Emission not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/emissions/{id}:
 *   delete:
 *     summary: Delete an emission record
 *     tags: [Emissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Emission record ID
 *     responses:
 *       204:
 *         description: Emission record deleted
 *       401:
 *         description: Unauthorized — JWT token required
 *       404:
 *         description: Emission not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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
