"use client"

import { useState, useEffect, useCallback } from "react"
import type { PrayerFlow } from "@/modules/shared"

export function usePrayerFlow() {
  const [flows, setFlows] = useState<PrayerFlow[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch("/data/prayer-flow.json")
      .then(res => res.json())
      .then((data: PrayerFlow[]) => {
        setFlows(data)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  const getFlow = useCallback(
    (week: number, day: string, hour: 'morning' | 'evening'): PrayerFlow | undefined => {
      return flows.find(f => f.week === week && f.day === day && f.hour === hour)
    },
    [flows]
  )

  return { flows, loaded, getFlow }
}
