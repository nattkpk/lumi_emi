const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const emissionsRoutes = require('./routes/emissions');
const countriesRoutes = require('./routes/countries');
const authRoutes = require('./routes/auth');
const { swaggerUi, specs } = require('./config/swagger');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/countries', countriesRoutes);
app.use('/api/emissions', emissionsRoutes);

// General Error Handler
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
