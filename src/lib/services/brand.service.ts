import { brandRepository } from "@/lib/repositories/brand.repository"

export const brandService = {
  createBrand: async (name: string) => {
    const trimmed = name.trim()
    const existing = await brandRepository.findByName(trimmed)
    if (existing) {
      throw new Error(`La marca "${trimmed}" ya existe.`)
    }
    return brandRepository.create({ name: trimmed })
  },

  getAllBrands: async () => {
    return brandRepository.findAll()
  },

  deleteBrand: async (id: string): Promise<void> => {
    await brandRepository.delete(id)
  },

  renameBrand: async (id: string, name: string) => {
    const trimmed = name.trim()
    const existing = await brandRepository.findByName(trimmed)
    if (existing && existing.id !== id) {
      throw new Error(`La marca "${trimmed}" ya existe.`)
    }
    return brandRepository.rename(id, trimmed)
  },
}
