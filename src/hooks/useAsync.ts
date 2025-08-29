import { useState, useCallback } from 'react'
import { ApiError } from '@/types'

interface UseAsyncState<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
}

interface UseAsyncReturn<T> extends UseAsyncState<T> {
  execute: (...args: any[]) => Promise<T | null>
  reset: () => void
}

export function useAsync<T>(
  asyncFunction: (...args: any[]) => Promise<T>
): UseAsyncReturn<T> {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    error: null,
    isLoading: false,
  })

  const execute = useCallback(
    async (...args: any[]) => {
      setState({ data: null, error: null, isLoading: true })
      
      try {
        const data = await asyncFunction(...args)
        setState({ data, error: null, isLoading: false })
        return data
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error')
        setState({ data: null, error: err, isLoading: false })
        return null
      }
    },
    [asyncFunction]
  )

  const reset = useCallback(() => {
    setState({ data: null, error: null, isLoading: false })
  }, [])

  return { ...state, execute, reset }
}