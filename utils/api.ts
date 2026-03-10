import {
  getAllTailors,
  getTailorById,
  updateTailor,
  disableTailor,
  deleteTailor,
   getAllTailorWorks,
  addTailorWork,
  getTailorWorkById,
  updateTailorWork,
  disableTailorWork,
  deleteTailorWork,
} from "@/agent-services/tailorWorks"

export const fetchTailors = async () => {
  return await getAllTailors()
}

export const fetchTailor = async (id: string) => {
  return await getTailorById(id)
}

export const saveTailor = async (id: string, updates: any) => {
  return await updateTailor(id, updates)
}

export const disableTailorAccount = async (id: string) => {
  return await disableTailor(id)
}

export const deleteTailorAccount = async (id: string) => {
  return await deleteTailor(id)
}
