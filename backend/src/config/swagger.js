const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Greenhouse Gas Emissions API',
      version: '1.0.0',
      description: 'API for managing and viewing greenhouse gas emissions data.',
    },
    servers: [
      {
        url: 'http://localhost:3001',
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to the API docs
};

const specs = swaggerJsDoc(options);

module.exports = {
  swaggerUi,
  specs,
};
