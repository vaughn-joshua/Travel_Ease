/**
 * Menu Items Controller
 * CRUD operations for business menu items
 */

import { prisma, executeWithRetry, handlePrismaError } from "../../../lib/prismaHelpers.js";
import { Request, Response } from "express";

/**
 * Get all menu items for a business
 * GET /api/business/:id/menu
 */
export async function getMenuItems(req: Request, res: Response) {
  const businessId = parseInt(req.params.id);

  if (isNaN(businessId)) {
    return res.status(400).json({ error: "Invalid business ID" });
  }

  try {
    const menuItems = await executeWithRetry(() =>
      prisma.menuItem.findMany({
        where: { business_id: businessId },
        orderBy: [{ category: 'asc' }, { name: 'asc' }]
      })
    );

    // Normalize response
    const normalized = menuItems.map(item => ({
      id: item.menu_item_id,
      name: item.name,
      description: item.description,
      price: parseFloat(item.price as unknown as string),
      imageUrl: item.image_url,
      category: item.category,
      isAvailable: item.is_available,
    }));

    res.json({ menuItems: normalized });
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return handlePrismaError(error, res, 'Fetching menu items');
  }
}

/**
 * Create a menu item
 * POST /api/business/:id/menu
 */
export async function createMenuItem(req: Request, res: Response) {
  const businessId = parseInt(req.params.id);
  const userId = req.user!.id;

  if (isNaN(businessId)) {
    return res.status(400).json({ error: "Invalid business ID" });
  }

  const { name, description, price, imageUrl, category, isAvailable = true } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ error: "Name and price are required" });
  }

  try {
    // Verify ownership
    const business = await executeWithRetry(() =>
      prisma.business.findUnique({
        where: { business_id: businessId },
        select: { user_id: true }
      })
    );

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    if (business.user_id !== userId) {
      return res.status(403).json({ error: "Not authorized to modify this business" });
    }

    const menuItem = await executeWithRetry(() =>
      prisma.menuItem.create({
        data: {
          business_id: businessId,
          name,
          description: description || null,
          price: parseFloat(price),
          image_url: imageUrl || null,
          category: category || null,
          is_available: isAvailable,
        }
      })
    );

    res.status(201).json({
      menuItem: {
        id: menuItem.menu_item_id,
        name: menuItem.name,
        description: menuItem.description,
        price: parseFloat(menuItem.price as unknown as string),
        imageUrl: menuItem.image_url,
        category: menuItem.category,
        isAvailable: menuItem.is_available,
      }
    });
  } catch (error) {
    console.error("Error creating menu item:", error);
    return handlePrismaError(error, res, 'Creating menu item');
  }
}

/**
 * Update a menu item
 * PUT /api/business/:id/menu/:itemId
 */
export async function updateMenuItem(req: Request, res: Response) {
  const businessId = parseInt(req.params.id);
  const itemId = parseInt(req.params.itemId);
  const userId = req.user!.id;

  if (isNaN(businessId) || isNaN(itemId)) {
    return res.status(400).json({ error: "Invalid business or item ID" });
  }

  const { name, description, price, imageUrl, category, isAvailable } = req.body;

  try {
    // Verify ownership
    const business = await executeWithRetry(() =>
      prisma.business.findUnique({
        where: { business_id: businessId },
        select: { user_id: true }
      })
    );

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    if (business.user_id !== userId) {
      return res.status(403).json({ error: "Not authorized to modify this business" });
    }

    // Verify menu item exists and belongs to this business
    const existingItem = await executeWithRetry(() =>
      prisma.menuItem.findUnique({
        where: { menu_item_id: itemId }
      })
    );

    if (!existingItem || existingItem.business_id !== businessId) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (imageUrl !== undefined) updateData.image_url = imageUrl;
    if (category !== undefined) updateData.category = category;
    if (isAvailable !== undefined) updateData.is_available = isAvailable;

    const updatedItem = await executeWithRetry(() =>
      prisma.menuItem.update({
        where: { menu_item_id: itemId },
        data: updateData
      })
    );

    res.json({
      menuItem: {
        id: updatedItem.menu_item_id,
        name: updatedItem.name,
        description: updatedItem.description,
        price: parseFloat(updatedItem.price as unknown as string),
        imageUrl: updatedItem.image_url,
        category: updatedItem.category,
        isAvailable: updatedItem.is_available,
      }
    });
  } catch (error) {
    console.error("Error updating menu item:", error);
    return handlePrismaError(error, res, 'Updating menu item');
  }
}

/**
 * Delete a menu item
 * DELETE /api/business/:id/menu/:itemId
 */
export async function deleteMenuItem(req: Request, res: Response) {
  const businessId = parseInt(req.params.id);
  const itemId = parseInt(req.params.itemId);
  const userId = req.user!.id;

  if (isNaN(businessId) || isNaN(itemId)) {
    return res.status(400).json({ error: "Invalid business or item ID" });
  }

  try {
    // Verify ownership
    const business = await executeWithRetry(() =>
      prisma.business.findUnique({
        where: { business_id: businessId },
        select: { user_id: true }
      })
    );

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    if (business.user_id !== userId) {
      return res.status(403).json({ error: "Not authorized to modify this business" });
    }

    // Verify menu item exists and belongs to this business
    const existingItem = await executeWithRetry(() =>
      prisma.menuItem.findUnique({
        where: { menu_item_id: itemId }
      })
    );

    if (!existingItem || existingItem.business_id !== businessId) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    await executeWithRetry(() =>
      prisma.menuItem.delete({
        where: { menu_item_id: itemId }
      })
    );

    res.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return handlePrismaError(error, res, 'Deleting menu item');
  }
}

