"use server"

import { tagService } from "@/lib/services/tag.service"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ActionResult = { success: boolean; data?: any; error?: string }

export async function createTagAction(name: string): Promise<ActionResult> {
  try {
    const tag = await tagService.createTag(name)
    return { success: true, data: tag }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Error al crear la etiqueta." }
  }
}

export async function getTagsAction(): Promise<ActionResult> {
  try {
    const tags = await tagService.getAllTags()
    return { success: true, data: tags }
  } catch {
    return { success: false, error: "Error al obtener etiquetas." }
  }
}

export async function deleteTagAction(id: string): Promise<ActionResult> {
  try {
    await tagService.deleteTag(id)
    return { success: true }
  } catch {
    return { success: false, error: "Error al eliminar la etiqueta." }
  }
}

export async function renameTagAction(id: string, name: string): Promise<ActionResult> {
  try {
    const tag = await tagService.renameTag(id, name)
    return { success: true, data: tag }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Error al renombrar la etiqueta." }
  }
}
