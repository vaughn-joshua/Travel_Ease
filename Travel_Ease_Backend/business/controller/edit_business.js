import { prisma } from "../../src/lib/prisma.js";

export async function edit_business(req, res) {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const business = await prisma.business.update({
      where: {
        business_id: parseInt(id)
      },
      data: {
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.house_number !== undefined && { house_number: updateData.house_number }),
        ...(updateData.street !== undefined && { street: updateData.street }),
        ...(updateData.brgy !== undefined && { brgy: updateData.brgy }),
        ...(updateData.city !== undefined && { city: updateData.city }),
        ...(updateData.latitude !== undefined && { latitude: updateData.latitude }),
        ...(updateData.longtitude !== undefined && { longtitude: updateData.longtitude }),
        ...(updateData.description !== undefined && { description: updateData.description }),
        ...(updateData.rating !== undefined && { rating: updateData.rating }),
        ...(updateData.status !== undefined && { status: updateData.status }),
        ...(updateData.picture !== undefined && { picture: updateData.picture }),
      },
      include: {
        categories: true,
        business_hours: true
      }
    });

    res.json({ 
      message: "Business updated successfully",
      business
    });
  } catch (error) {
    console.error("Error updating business:", error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Business not found" });
    }
    res.status(500).json({ error: error.message });
  }
}
