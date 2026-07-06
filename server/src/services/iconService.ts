import { prisma } from '../lib/prisma.js'
import { logger } from '../lib/logger.js'
import type { CurrencyIcon } from '@prisma/client'
import fs from 'fs'
import { optimize } from 'svgo'

export interface IconMetadata {
  id: string
  name: string
  displayName: string
  type: string
  url: string
  format: string
  width: number
  height: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateIconData {
  name: string
  displayName: string
  type?: string
  url: string
  format?: string
  width?: number
  height?: number
}

export interface UpdateIconData {
  displayName?: string
  type?: string
  url?: string
  format?: string
  width?: number
  height?: number
}

class IconService {
  /**
   * Retrieve all icons, optionally filtered by type
   */
  async getIcons(type?: string): Promise<CurrencyIcon[]> {
    try {
      const where = type ? { type } : {}
      
      const icons = await prisma.currencyIcon.findMany({
        where,
        orderBy: { name: 'asc' },
      })
      
      logger.info({ count: icons.length, type }, '[IconService] Retrieved icons')
      return icons
    } catch (error) {
      logger.error({ error, type }, '[IconService] Failed to retrieve icons')
      throw new Error('Failed to retrieve icons')
    }
  }

  /**
   * Retrieve a specific icon by ID
   */
  async getIconById(id: string): Promise<CurrencyIcon | null> {
    try {
      const icon = await prisma.currencyIcon.findUnique({
        where: { id },
      })
      
      if (!icon) {
        logger.warn({ id }, '[IconService] Icon not found')
        return null
      }
      
      logger.info({ id, name: icon.name }, '[IconService] Retrieved icon')
      return icon
    } catch (error) {
      logger.error({ error, id }, '[IconService] Failed to retrieve icon')
      throw new Error('Failed to retrieve icon')
    }
  }

  /**
   * Retrieve a specific icon by name
   */
  async getIconByName(name: string): Promise<CurrencyIcon | null> {
    try {
      const icon = await prisma.currencyIcon.findUnique({
        where: { name },
      })
      
      if (!icon) {
        logger.warn({ name }, '[IconService] Icon not found by name')
        return null
      }
      
      logger.info({ id: icon.id, name }, '[IconService] Retrieved icon by name')
      return icon
    } catch (error) {
      logger.error({ error, name }, '[IconService] Failed to retrieve icon by name')
      throw new Error('Failed to retrieve icon by name')
    }
  }

  /**
   * Upload/create a new icon
   */
  async uploadIcon(data: CreateIconData): Promise<CurrencyIcon> {
    try {
      // Validate file format
      const validFormats = ['svg', 'png', 'webp']
      const format = data.format || 'svg'
      
      if (!validFormats.includes(format)) {
        throw new Error(`Invalid format: ${format}. Must be one of: ${validFormats.join(', ')}`)
      }

      // Validate name format (alphanumeric with underscores only)
      if (!/^[a-zA-Z0-9_]+$/.test(data.name)) {
        throw new Error('Icon name must contain only letters, numbers, and underscores')
      }

      // Check if icon with this name already exists
      const existing = await prisma.currencyIcon.findUnique({
        where: { name: data.name },
      })

      if (existing) {
        throw new Error(`Icon with name '${data.name}' already exists`)
      }

      const icon = await prisma.currencyIcon.create({
        data: {
          name: data.name,
          displayName: data.displayName,
          type: data.type || 'currency',
          url: data.url,
          format,
          width: data.width || 64,
          height: data.height || 64,
        },
      })
      
      logger.info({ id: icon.id, name: icon.name }, '[IconService] Created icon')
      return icon
    } catch (error) {
      logger.error({ error, data }, '[IconService] Failed to create icon')
      throw error
    }
  }

  /**
   * Update an existing icon
   */
  async updateIcon(id: string, data: UpdateIconData): Promise<CurrencyIcon> {
    try {
      // Validate format if provided
      if (data.format) {
        const validFormats = ['svg', 'png', 'webp']
        if (!validFormats.includes(data.format)) {
          throw new Error(`Invalid format: ${data.format}. Must be one of: ${validFormats.join(', ')}`)
        }
      }

      const icon = await prisma.currencyIcon.update({
        where: { id },
        data,
      })
      
      logger.info({ id, name: icon.name }, '[IconService] Updated icon')
      return icon
    } catch (error) {
      logger.error({ error, id, data }, '[IconService] Failed to update icon')
      throw new Error('Failed to update icon')
    }
  }

  /**
   * Delete an icon
   */
  async deleteIcon(id: string): Promise<void> {
    try {
      await prisma.currencyIcon.delete({
        where: { id },
      })
      
      logger.info({ id }, '[IconService] Deleted icon')
    } catch (error) {
      logger.error({ error, id }, '[IconService] Failed to delete icon')
      throw new Error('Failed to delete icon')
    }
  }

  /**
   * Validate file upload
   */
  validateFileUpload(file: Express.Multer.File): void {
    const maxSize = 2 * 1024 * 1024 // 2MB
    const allowedMimeTypes = ['image/svg+xml', 'image/png', 'image/webp']

    if (file.size > maxSize) {
      throw new Error(`File size exceeds maximum of 2MB (received ${(file.size / 1024 / 1024).toFixed(2)}MB)`)
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`Invalid file type: ${file.mimetype}. Allowed types: SVG, PNG, WebP`)
    }
  }

  /**
   * Validate SVG file structure and constraints
   */
  validateSVG(file: Express.Multer.File): void {
    if (file.mimetype !== 'image/svg+xml') {
      throw new Error('Only SVG files are allowed')
    }
    
    // Check file size (max 100KB for SVG)
    if (file.size > 100 * 1024) {
      throw new Error('SVG file too large (max 100KB)')
    }
    
    // Basic SVG structure validation
    const content = fs.readFileSync(file.path, 'utf-8')
    if (!content.includes('<svg') || !content.includes('</svg>')) {
      throw new Error('Invalid SVG file')
    }
    
    logger.info({ filename: file.filename, size: file.size }, '[IconService] SVG validation passed')
  }

  /**
   * Optimize SVG file using SVGO to reduce file size
   */
  async optimizeSVG(filePath: string): Promise<void> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8')
      
      const result = optimize(content, {
        plugins: [
          'removeDoctype',
          'removeXMLProcInst',
          'removeComments',
          'removeMetadata',
          'removeEditorsNSData',
          'cleanupAttrs',
          'minifyStyles',
          'convertStyleToAttrs',
        ],
      })
      
      await fs.promises.writeFile(filePath, result.data)
      
      logger.info({ filePath, originalSize: content.length, optimizedSize: result.data.length }, '[IconService] SVG optimized')
    } catch (error) {
      logger.error({ error, filePath }, '[IconService] Failed to optimize SVG')
      throw new Error('Failed to optimize SVG')
    }
  }
}

export const iconService = new IconService()
