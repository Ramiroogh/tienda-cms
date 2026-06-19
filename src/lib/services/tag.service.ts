import { tagRepository } from "@/lib/repositories/tag.repository"

export const tagService = {
  createTag: async (name: string) => {
    const trimmed = name.trim()
    const existing = await tagRepository.findByName(trimmed)
    if (existing) {
      throw new Error(`La etiqueta "${trimmed}" ya existe.`)
    }
    return tagRepository.create({ name: trimmed })
  },

  getAllTags: async () => {
    return tagRepository.findAll()
  },

  deleteTag: async (id: string): Promise<void> => {
    await tagRepository.delete(id)
  },

  renameTag: async (id: string, name: string) => {
    const trimmed = name.trim()
    const existing = await tagRepository.findByName(trimmed)
    if (existing && existing.id !== id) {
      throw new Error(`La etiqueta "${trimmed}" ya existe.`)
    }
    return tagRepository.rename(id, trimmed)
  },
}
