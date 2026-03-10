"use client"

import { useState, useEffect } from "react";
import {
  templateService,
  subscriberService,
  campaignService,
  listService,
  type Template,
  type Subscriber,
  type Campaign,
  type List,
} from "@/lib/firebase/collections"

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const data = await templateService.getAll()
      setTemplates(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  return { templates, loading, error, refetch: fetchTemplates }
}

export function useSubscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchSubscribers = async () => {
    try {
      setLoading(true)
      const data = await subscriberService.getAll()
      setSubscribers(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscribers()
  }, [])

  return { subscribers, loading, error, refetch: fetchSubscribers }
}

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const data = await campaignService.getAll()
      setCampaigns(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  return { campaigns, loading, error, refetch: fetchCampaigns }
}

export function useLists() {
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchLists = async () => {
    try {
      setLoading(true)
      const data = await listService.getAll()
      setLists(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLists()
  }, [])

  return { lists, loading, error, refetch: fetchLists }
}
