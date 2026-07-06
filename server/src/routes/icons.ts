import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { iconService } from '../services/iconService.js'
import { requireAuth } from '../middleware/auth.js'
import { logger } from '../lib/logger.js'
import { z } from 'zod'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { param } from '../lib/routeUtils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../../public/icons')
    try {
      await fs.mkdir(uploadDir, { recursive: true })
      cb(null, uploadDir)
    } catch (error) {
      cb(error as Error, uploadDir)
    }
  },
  filename: (_req, file, cb) => {
    // Generate unique filename: name_timestamp.ext
    const uniqueSuffix = Date.now()
    const ext = path.extname(file.originalname)
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_]/g, '_')
    cb(null, `${name}_${uniqueSuffix}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['image/svg+xml', 'image/png', 'image/webp']
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: SVG, PNG, WebP`))
    }
  },
})

// Validation schemas
const uploadIconSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .regex(/^[a-zA-Z0-9_]+$/, 'Name must contain only letters, numbers, and underscores'),
  displayName: z.string().min(1, 'Display name is required'),
  type: z.string().optional().default('currency'),
  width: z.string().optional().transform(val => val ? parseInt(val) : 64),
  height: z.string().optional().transform(val => val ? parseInt(val) : 64),
})

const updateIconSchema = z.object({
  displayName: z.string().min(1).optional(),
  type: z.string().optional(),
  url: z.string().url().optional(),
  format: z.enum(['svg', 'png', 'webp']).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
})

// ── GET /api/icons ────────────────────────────────────────────────────────────
// Retrieve all icons (with optional type filter)
router.get('/', async (req, res) => {
  try {
    const type = req.query.type as string | undefined
    
    const icons = await iconService.getIcons(type)
    
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60')
    res.json({
      data: icons,
      total: icons.length,
    })
  } catch (error) {
    logger.error({ error }, '[Icons API] Failed to retrieve icons')
    res.status(500).json({ message: 'Failed to retrieve icons' })
  }
})

// ── GET /api/icons/:id ────────────────────────────────────────────────────────
// Retrieve specific icon by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const icon = await iconService.getIconById(id)
    
    if (!icon) {
      return res.status(404).json({ message: 'Icon not found' })
    }
    
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60')
    res.json({ data: icon })
  } catch (error) {
    logger.error({ error, id: req.params.id }, '[Icons API] Failed to retrieve icon')
    res.status(500).json({ message: 'Failed to retrieve icon' })
  }
})

// ── POST /api/icons/upload ────────────────────────────────────────────────────
// Upload new icon (admin only)
// TODO: Add admin role check when role system is implemented
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    // Validate request body
    const validation = uploadIconSchema.safeParse(req.body)
    if (!validation.success) {
      // Clean up uploaded file
      await fs.unlink(req.file.path).catch(() => {})
      return res.status(400).json({
        message: 'Invalid input data',
        errors: validation.error.flatten().fieldErrors,
      })
    }

    const data = validation.data

    // Validate SVG file
    try {
      iconService.validateSVG(req.file)
    } catch (validationError) {
      // Clean up uploaded file
      await fs.unlink(req.file.path).catch(() => {})
      throw validationError
    }

    // Optimize SVG
    await iconService.optimizeSVG(req.file.path)

    // Determine format from file extension
    const ext = path.extname(req.file.filename).toLowerCase()
    const formatMap: Record<string, string> = {
      '.svg': 'svg',
      '.png': 'png',
      '.webp': 'webp',
    }
    const format = formatMap[ext] || 'svg'

    // Generate URL (relative to public directory)
    const url = `/icons/${req.file.filename}`

    // Create icon in database
    const icon = await iconService.uploadIcon({
      name: data.name,
      displayName: data.displayName,
      type: data.type,
      url,
      format,
      width: data.width,
      height: data.height,
    })

    logger.info({ iconId: icon.id, filename: req.file.filename }, '[Icons API] Icon uploaded')
    
    res.status(201).json({
      data: icon,
      message: 'Icon uploaded successfully',
    })
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {})
    }
    
    logger.error({ error }, '[Icons API] Failed to upload icon')
    
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Failed to upload icon' })
    }
  }
})

// ── PATCH /api/icons/:id ──────────────────────────────────────────────────────
// Update icon metadata (admin only)
// TODO: Add admin role check when role system is implemented
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const id = param(req.params['id'])

    // Validate request body
    const validation = updateIconSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        message: 'Invalid input data',
        errors: validation.error.flatten().fieldErrors,
      })
    }

    const data = validation.data

    // Check if icon exists
    const existing = await iconService.getIconById(id)
    if (!existing) {
      return res.status(404).json({ message: 'Icon not found' })
    }

    // Update icon
    const icon = await iconService.updateIcon(id, data)

    logger.info({ iconId: id }, '[Icons API] Icon updated')
    
    res.json({
      data: icon,
      message: 'Icon updated successfully',
    })
  } catch (error) {
    logger.error({ error, id: req.params.id }, '[Icons API] Failed to update icon')
    
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Failed to update icon' })
    }
  }
})

// ── DELETE /api/icons/:id ─────────────────────────────────────────────────────
// Delete icon (admin only)
// TODO: Add admin role check when role system is implemented
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = param(req.params['id'])

    // Check if icon exists
    const existing = await iconService.getIconById(id)
    if (!existing) {
      return res.status(404).json({ message: 'Icon not found' })
    }

    // Delete file from filesystem if it's a local file
    if (existing.url.startsWith('/icons/')) {
      const filename = path.basename(existing.url)
      const filePath = path.join(__dirname, '../../../public/icons', filename)
      await fs.unlink(filePath).catch((error) => {
        logger.warn({ error, filePath }, '[Icons API] Failed to delete icon file')
      })
    }

    // Delete from database
    await iconService.deleteIcon(id)

    logger.info({ iconId: id }, '[Icons API] Icon deleted')
    
    res.json({ message: 'Icon deleted successfully' })
  } catch (error) {
    logger.error({ error, id: req.params.id }, '[Icons API] Failed to delete icon')
    res.status(500).json({ message: 'Failed to delete icon' })
  }
})

export { router as iconsRouter }
