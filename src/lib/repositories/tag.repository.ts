import { prisma } from "@/lib/prisma"
import type { Tag } from "@/generated/prisma/client"

export const tagRepository = {
  findAll: async (): Promise<Tag[]> => {
    return prisma.tag.findMany({
      orderBy: { name: "asc" },
    })
  },

  findByName: async (name: string): Promise<Tag | null> => {
    return prisma.tag.findUnique({
      where: { name },
    })
  },

  create: async (data: { name: string }): Promise<Tag> => {
    return prisma.tag.create({ data })
  },

  delete: async (id: string): Promise<void> => {
    await prisma.tag.delete({ where: { id } })
  },

  rename: async (id: string, name: string): Promise<Tag> => {
    return prisma.tag.update({
      where: { id },
      data: { name },
    })
  },
}
