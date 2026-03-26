const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { useCache, clearCache } = require('../middleware/cacheMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Countries
 *   description: Country management endpoints
 */

/**
 * @swagger
 * /api/countries:
 *   get:
 *     summary: Get all countries
 *     tags: [Countries]
 *     description: Returns a list of all countries sorted alphabetically by name. Response is cached for 5 minutes.
 *     responses:
 *       200:
 *         description: A list of countries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Country'
 */
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

/**
 * @swagger
 * /api/countries:
 *   post:
 *     summary: Create a new country
 *     tags: [Countries]
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
 *               - name
 *             properties:
 *               iso_code:
 *                 type: string
 *                 example: JPN
 *                 description: ISO 3166-1 alpha-3 country code
 *               name:
 *                 type: string
 *                 example: Japan
 *     responses:
 *       201:
 *         description: Country created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Country'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized — JWT token required
 *       409:
 *         description: Country with this ISO code already exists
 */
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

/**
 * @swagger
 * /api/countries/{id}:
 *   put:
 *     summary: Update a country
 *     tags: [Countries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Country ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               iso_code:
 *                 type: string
 *                 example: JPN
 *               name:
 *                 type: string
 *                 example: Japan
 *     responses:
 *       200:
 *         description: Country updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Country'
 *       401:
 *         description: Unauthorized — JWT token required
 *       404:
 *         description: Country not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/countries/{id}:
 *   delete:
 *     summary: Delete a country
 *     tags: [Countries]
 *     security:
 *       - bearerAuth: []
 *     description: Deletes a country and all associated emission records (cascade).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Country ID
 *     responses:
 *       204:
 *         description: Country deleted successfully
 *       401:
 *         description: Unauthorized — JWT token required
 *       404:
 *         description: Country not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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
