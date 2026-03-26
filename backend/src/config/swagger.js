const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LumiEMI API',
      version: '1.0.0',
      description: 'API for managing and viewing greenhouse gas emissions data.',
    },
    servers: [
      {
        url: process.env.BASE_URL || 'http://localhost:3001',
        description: process.env.BASE_URL ? 'Production Server' : 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from POST /api/auth/login',
        },
      },
      schemas: {
        Country: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            iso_code: { type: 'string', example: 'THA' },
            name: { type: 'string', example: 'Thailand' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Emission: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            countryId: { type: 'integer', example: 1 },
            year: { type: 'integer', example: 2020 },
            gas_type: { type: 'string', example: 'co2' },
            sector: { type: 'string', example: 'total' },
            value: { type: 'number', format: 'float', example: 254.31 },
            unit: { type: 'string', example: 'MtCO2e' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Error description' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsDoc(options);

module.exports = {
  swaggerUi,
  specs,
};
