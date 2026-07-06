import { Router } from 'express'
import swaggerUi from 'swagger-ui-express'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const docsRouter = Router()

// Load OpenAPI specification
const openapiPath = join(__dirname, '../docs/openapi.json')
const openapiDocument = JSON.parse(readFileSync(openapiPath, 'utf-8'))

// Swagger UI options
const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SummonScroll API Documentation',
  customfavIcon: '/icons/spirit_crystals.svg',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
  },
}

// Serve Swagger UI
docsRouter.use('/', swaggerUi.serve)
docsRouter.get('/', swaggerUi.setup(openapiDocument, swaggerOptions))

// Serve raw OpenAPI JSON
docsRouter.get('/openapi.json', (_req, res) => {
  res.json(openapiDocument)
})
