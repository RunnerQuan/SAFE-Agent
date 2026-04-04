'use client'

import { useMutation, useQuery } from '@tanstack/react-query'

import {
  createSkillPeckerScan,
  getSkillPeckerHealth,
  getSkillPeckerJobDetail,
  getSkillPeckerLibrary,
  getSkillPeckerLibraryDetail,
  getSkillPeckerOverview,
  getSkillPeckerQueue,
  getSkillPeckerSkillResult,
} from '@/lib/skillpecker/api'
import { SkillPeckerLibraryQuery } from '@/lib/skillpecker/types'

export function useSkillPeckerHealth() {
  return useQuery({
    queryKey: ['skillpecker', 'health'],
    queryFn: getSkillPeckerHealth,
    staleTime: 60 * 1000,
  })
}

export function useSkillPeckerQueue() {
  return useQuery({
    queryKey: ['skillpecker', 'queue'],
    queryFn: getSkillPeckerQueue,
    refetchInterval: (query) => {
      const counts = query.state.data?.queue
      return counts && (counts.running > 0 || counts.queued > 0) ? 4000 : 12000
    },
  })
}

export function useSkillPeckerOverview() {
  return useQuery({
    queryKey: ['skillpecker', 'overview'],
    queryFn: getSkillPeckerOverview,
    refetchInterval: 12000,
  })
}

export function useSkillPeckerJobDetail(jobId?: string) {
  return useQuery({
    queryKey: ['skillpecker', 'job', jobId],
    queryFn: () => getSkillPeckerJobDetail(jobId!),
    enabled: Boolean(jobId),
    refetchInterval: 4000,
  })
}

export function useSkillPeckerSkillResult(jobId?: string, skillName?: string) {
  return useQuery({
    queryKey: ['skillpecker', 'job', jobId, 'skill', skillName],
    queryFn: () => getSkillPeckerSkillResult(jobId!, skillName!),
    enabled: Boolean(jobId && skillName),
  })
}

export function useSkillPeckerLibrary(query: SkillPeckerLibraryQuery) {
  return useQuery({
    queryKey: ['skillpecker', 'library', query],
    queryFn: () => getSkillPeckerLibrary(query),
    placeholderData: (previous) => previous,
  })
}

export function useSkillPeckerLibraryDetail(skillId?: string) {
  return useQuery({
    queryKey: ['skillpecker', 'library', 'detail', skillId],
    queryFn: () => getSkillPeckerLibraryDetail(skillId!),
    enabled: Boolean(skillId),
  })
}

export function useCreateSkillPeckerScan() {
  return useMutation({
    mutationFn: createSkillPeckerScan,
  })
}
