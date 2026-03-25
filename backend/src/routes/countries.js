const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { useCache, clearCache } = require('../middleware/cacheMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/countries
router.get('/', useCache, async (req, res, next) => {
  try {
    const countries = await prisma.country.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(countries);
  } catch (err) {
    next(err);
  }
});

// POST /api/countries
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { iso_code, name } = req.body;
    if (!iso_code || !name) {
      return res.status(400).json({ message: 'iso_code and name are required' });
    }
    const newCountry = await prisma.country.create({
      data: { iso_code, name }
    });
    clearCache();
    res.status(201).json(newCountry);
  } catch (err) {
    next(err);
  }
});

// PUT /api/countries/:id
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { iso_code, name } = req.body;
    const country = await prisma.country.update({
      where: { id: parseInt(req.params.id) },
      data: { iso_code, name }
    });
    clearCache();
    res.json(country);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Country not found' });
    next(err);
  }
});

// DELETE /api/countries/:id
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    await prisma.country.delete({
      where: { id: parseInt(req.params.id) }
    });
    clearCache();
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Country not found' });
    next(err);
  }
});

module.exports = router;
