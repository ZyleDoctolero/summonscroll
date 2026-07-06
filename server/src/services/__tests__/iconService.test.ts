import { describe, it, expect, beforeEach } from '@jest/globals'
import { iconService } from '../iconService.js'
import { prisma } from '../../lib/prisma.js'
import { createTestIcon, createMockFile } from '../../__tests__/setup.js'

describe('IconService', () => {
  describe('getIcons', () => {
    it('should retrieve all icons', async () => {
      // Arrange
      await createTestIcon({ name: 'icon1', displayName: 'Icon 1' })
      await createTestIcon({ name: 'icon2', displayName: 'Icon 2' })

      // Act
      const icons = await iconService.getIcons()

      // Assert
      expect(icons).toHaveLength(2)
      expect(icons[0].name).toBe('icon1')
      expect(icons[1].name).toBe('icon2')
    })

    it('should filter icons by type', async () => {
      // Arrange
      await createTestIcon({ name: 'currency1', type: 'currency' })
      await createTestIcon({ name: 'monster1', type: 'monster' })
      await createTestIcon({ name: 'ui1', type: 'ui' })

      // Act
      const currencyIcons = await iconService.getIcons('currency')

      // Assert
      expect(currencyIcons).toHaveLength(1)
      expect(currencyIcons[0].type).toBe('currency')
      expect(currencyIcons[0].name).toBe('currency1')
    })

    it('should return empty array when no icons exist', async () => {
      // Act
      const icons = await iconService.getIcons()

      // Assert
      expect(icons).toHaveLength(0)
    })

    it('should order icons by name ascending', async () => {
      // Arrange
      await createTestIcon({ name: 'zebra' })
      await createTestIcon({ name: 'alpha' })
      await createTestIcon({ name: 'beta' })

      // Act
      const icons = await iconService.getIcons()

      // Assert
      expect(icons[0].name).toBe('alpha')
      expect(icons[1].name).toBe('beta')
      expect(icons[2].name).toBe('zebra')
    })
  })

  describe('getIconById', () => {
    it('should retrieve icon by ID', async () => {
      // Arrange
      const created = await createTestIcon({ name: 'test_icon' })

      // Act
      const icon = await iconService.getIconById(created.id)

      // Assert
      expect(icon).not.toBeNull()
      expect(icon?.id).toBe(created.id)
      expect(icon?.name).toBe('test_icon')
    })

    it('should return null for non-existent ID', async () => {
      // Act
      const icon = await iconService.getIconById('non-existent-id')

      // Assert
      expect(icon).toBeNull()
    })
  })

  describe('getIconByName', () => {
    it('should retrieve icon by name', async () => {
      // Arrange
      await createTestIcon({ name: 'spirit_crystals', displayName: 'Spirit Crystals' })

      // Act
      const icon = await iconService.getIconByName('spirit_crystals')

      // Assert
      expect(icon).not.toBeNull()
      expect(icon?.name).toBe('spirit_crystals')
      expect(icon?.displayName).toBe('Spirit Crystals')
    })

    it('should return null for non-existent name', async () => {
      // Act
      const icon = await iconService.getIconByName('non_existent')

      // Assert
      expect(icon).toBeNull()
    })
  })

  describe('uploadIcon', () => {
    it('should create a new icon with valid data', async () => {
      // Arrange
      const iconData = {
        name: 'new_icon',
        displayName: 'New Icon',
        type: 'currency',
        url: 'https://example.com/new-icon.svg',
        format: 'svg',
        width: 64,
        height: 64,
      }

      // Act
      const icon = await iconService.uploadIcon(iconData)

      // Assert
      expect(icon.id).toBeDefined()
      expect(icon.name).toBe('new_icon')
      expect(icon.displayName).toBe('New Icon')
      expect(icon.type).toBe('currency')
      expect(icon.url).toBe('https://example.com/new-icon.svg')
      expect(icon.format).toBe('svg')
      expect(icon.width).toBe(64)
      expect(icon.height).toBe(64)
    })

    it('should use default values when optional fields are omitted', async () => {
      // Arrange
      const iconData = {
        name: 'minimal_icon',
        displayName: 'Minimal Icon',
        url: 'https://example.com/minimal.svg',
      }

      // Act
      const icon = await iconService.uploadIcon(iconData)

      // Assert
      expect(icon.type).toBe('currency')
      expect(icon.format).toBe('svg')
      expect(icon.width).toBe(64)
      expect(icon.height).toBe(64)
    })

    it('should reject invalid format', async () => {
      // Arrange
      const iconData = {
        name: 'invalid_format',
        displayName: 'Invalid Format',
        url: 'https://example.com/icon.jpg',
        format: 'jpg',
      }

      // Act & Assert
      await expect(iconService.uploadIcon(iconData)).rejects.toThrow('Invalid format')
    })

    it('should reject invalid name format', async () => {
      // Arrange
      const iconData = {
        name: 'invalid-name!',
        displayName: 'Invalid Name',
        url: 'https://example.com/icon.svg',
      }

      // Act & Assert
      await expect(iconService.uploadIcon(iconData)).rejects.toThrow(
        'Icon name must contain only letters, numbers, and underscores'
      )
    })

    it('should reject duplicate icon name', async () => {
      // Arrange
      await createTestIcon({ name: 'duplicate_icon' })
      const iconData = {
        name: 'duplicate_icon',
        displayName: 'Duplicate Icon',
        url: 'https://example.com/duplicate.svg',
      }

      // Act & Assert
      await expect(iconService.uploadIcon(iconData)).rejects.toThrow(
        "Icon with name 'duplicate_icon' already exists"
      )
    })
  })

  describe('updateIcon', () => {
    it('should update icon fields', async () => {
      // Arrange
      const icon = await createTestIcon({ name: 'update_test', displayName: 'Original Name' })

      // Act
      const updated = await iconService.updateIcon(icon.id, {
        displayName: 'Updated Name',
        width: 128,
        height: 128,
      })

      // Assert
      expect(updated.displayName).toBe('Updated Name')
      expect(updated.width).toBe(128)
      expect(updated.height).toBe(128)
      expect(updated.name).toBe('update_test') // Unchanged
    })

    it('should reject invalid format in update', async () => {
      // Arrange
      const icon = await createTestIcon()

      // Act & Assert
      await expect(
        iconService.updateIcon(icon.id, { format: 'invalid' })
      ).rejects.toThrow('Invalid format')
    })

    it('should throw error for non-existent icon', async () => {
      // Act & Assert
      await expect(
        iconService.updateIcon('non-existent-id', { displayName: 'Test' })
      ).rejects.toThrow()
    })
  })

  describe('deleteIcon', () => {
    it('should delete an existing icon', async () => {
      // Arrange
      const icon = await createTestIcon({ name: 'delete_test' })

      // Act
      await iconService.deleteIcon(icon.id)

      // Assert
      const deleted = await prisma.currencyIcon.findUnique({ where: { id: icon.id } })
      expect(deleted).toBeNull()
    })

    it('should throw error when deleting non-existent icon', async () => {
      // Act & Assert
      await expect(iconService.deleteIcon('non-existent-id')).rejects.toThrow()
    })
  })

  describe('validateFileUpload', () => {
    it('should accept valid SVG file', () => {
      // Arrange
      const file = createMockFile({
        mimetype: 'image/svg+xml',
        size: 1024,
      })

      // Act & Assert
      expect(() => iconService.validateFileUpload(file)).not.toThrow()
    })

    it('should accept valid PNG file', () => {
      // Arrange
      const file = createMockFile({
        mimetype: 'image/png',
        size: 1024,
      })

      // Act & Assert
      expect(() => iconService.validateFileUpload(file)).not.toThrow()
    })

    it('should accept valid WebP file', () => {
      // Arrange
      const file = createMockFile({
        mimetype: 'image/webp',
        size: 1024,
      })

      // Act & Assert
      expect(() => iconService.validateFileUpload(file)).not.toThrow()
    })

    it('should reject file exceeding 2MB', () => {
      // Arrange
      const file = createMockFile({
        size: 3 * 1024 * 1024, // 3MB
      })

      // Act & Assert
      expect(() => iconService.validateFileUpload(file)).toThrow('File size exceeds maximum')
    })

    it('should reject invalid MIME type', () => {
      // Arrange
      const file = createMockFile({
        mimetype: 'image/jpeg',
      })

      // Act & Assert
      expect(() => iconService.validateFileUpload(file)).toThrow('Invalid file type')
    })
  })
})
