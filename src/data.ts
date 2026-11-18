import { useEffect, useState } from 'react'

export type Group = 'baseline' | 'proprietary' | 'open' | 'ours' | 'proprietary-mean' | 'open-mean'
export interface Row {
  name: string
  group: Group
  scores: Record<string, number>
}
export interface Results {
  source: string
  columns: string[]
  rows: Row[]
}
export interface City {
  id: string
  name: string
  country_code: string
  lat: number
  lon: number
  split: 'train' | 'val' | 'test'
}
export interface Manifest {
  hero: { city: string; render: string; field: string }
  matched: { tiles: string[]; adds?: string[]; stats?: Record<string, { coverage: number; added: number }> }
  gallery: { id: string; render: string; field: string }[]
}
export interface Land {
  step: number
  points: [number, number][]
}

const cache = new Map<string, Promise<unknown>>()
export function useJson<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  useEffect(() => {
    let live = true
    if (!cache.has(url)) cache.set(url, fetch(url).then((r) => r.json()))
    ;(cache.get(url) as Promise<T>).then((d) => {
      if (live) setData(d)
    })
    return () => {
      live = false
    }
  }, [url])
  return data
}

export const RV = '/rv/'
export const useResults = () => useJson<Results>('/data/results.json')
export const useCities = () => useJson<City[]>(`${RV}cities.json`)
export const useManifest = () => useJson<Manifest>(`${RV}manifest.json`)
export const useLand = () => useJson<Land>(`${RV}land.json`)

// Hidden-target accuracy = mean of F2–F4 (matches tab:copyref "All").
export const hiddenTarget = (r: Row) => (r.scores.F2 + r.scores.F3 + r.scores.F4) / 3

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
