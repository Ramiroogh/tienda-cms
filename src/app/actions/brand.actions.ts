"use server"

import { brandService } from "@/lib/services/brand.service"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ActionResult = { success: boolean; data?: any; error?: string }

export async function createBrandAction(name: string): Promise<ActionResult> {
  try {
    const brand = await brandService.createBrand(name)
    return { success: true, data: brand }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Error al crear la marca." }
  }
}

export async function getBrandsAction(): Promise<ActionResult> {
  try {
    const brands = await brandService.getAllBrands()
    return { success: true, data: brands }
  } catch {
    return { success: false, error: "Error al obtener marcas." }
  }
}

export async function deleteBrandAction(id: string): Promise<ActionResult> {
  try {
    await brandService.deleteBrand(id)
    return { success: true }
  } catch {
    return { success: false, error: "Error al eliminar la marca." }
  }
}

export async function renameBrandAction(id: string, name: string): Promise<ActionResult> {
  try {
    const brand = await brandService.renameBrand(id, name)
    return { success: true, data: brand }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Error al renombrar la marca." }
  }
}
