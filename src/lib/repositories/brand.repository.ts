import { prisma } from "@/lib/prisma"
import type { Brand } from "@/generated/prisma/client"

export const brandRepository = {
  findAll: async (): Promise<Brand[]> => {
    return prisma.brand.findMany({
      orderBy: { name: "asc" },
    })
  },

  findByName: async (name: string): Promise<Brand | null> => {
    return prisma.brand.findUnique({
      where: { name },
    })
  },

  create: async (data: { name: string }): Promise<Brand> => {
    return prisma.brand.create({ data })
  },

  rename: async (id: string, name: string): Promise<Brand> => {
    return prisma.brand.update({
      where: { id },
      data: { name },
    })
  },

  delete: async (id: string): Promise<void> => {
    await prisma.brand.delete({ where: { id } })
  },
}
