import { useEffect, useState } from 'react'

const OMDB_API_URL = 'https://www.omdbapi.com'
const DEBOUNCE_MS = 400

// Known OMDB HTTP failures mapped to friendly messages.
const HTTP_ERROR_MESSAGES = {
  401: 'Invalid OMDB API key. Check VITE_OMDB_API_KEY.',
  429: 'Too many requests. Please wait a moment and try again.',
}

/**
 * Fetches OMDB search results for a search term.
 *
 * @param {string} searchTerm raw input value from the search box
 * @returns {{ movies: object[], status: 'idle'|'loading'|'success'|'error',
 *             error: {code:string,message:string}|null, retry: () => void }}
 */
export default function useMovies(searchTerm) {
  const [movies, setMovies] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [error, setError] = useState(null)
  const [retryTick, setRetryTick] = useState(0)

  useEffect(() => {
    const term = searchTerm.trim()

    // 1. Empty / too-short input → idle (no network call).
    if (term.length < 2) {
      setMovies([])
      setStatus('idle')
      setError(null)
      return undefined
    }

    // 2. Missing key → error state before we ever hit the network.
    const apiKey = import.meta.env.VITE_OMDB_API_KEY
    if (!apiKey) {
      setStatus('error')
      setError({
        code: 'MISSING_API_KEY',
        message: 'Set VITE_OMDB_API_KEY in your .env file (free key at omdbapi.com).',
      })
      return undefined
    }

    // 3. AbortController lets us cancel the in-flight request if the user
    //    types again (or the component unmounts) — prevents stale results.
    const controller = new AbortController()
    setStatus('loading')
    setError(null)

    // 4. Debounce: wait until the user stops typing before we fire a request.
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ apikey: apiKey, s: term })
        const res = await fetch(`${OMDB_API_URL}/?${params}`, {
          signal: controller.signal,
        })

        // 5. Network-level failures (non-2xx) are checked explicitly.
        if (!res.ok) {
          throw {
            code: `HTTP_${res.status}`,
            message:
              HTTP_ERROR_MESSAGES[res.status] ||
              `The server responded with status ${res.status}.`,
          }
        }

        const data = await res.json()

        // 6. OMDB signals app-level errors with { Response: "False" }.
        if (data.Response === 'False') {
          throw { code: 'API_ERROR', message: data.Error || 'The API returned an error.' }
        }

        setMovies(data.Search ?? [])
        setStatus('success')
      } catch (err) {
        // 7. Aborted requests are not real errors — ignore them silently.
        if (err.name === 'AbortError') return
        setError({
          code: err.code || 'UNKNOWN',
          message: err.message || 'Something went wrong while fetching movies.',
        })
        setStatus('error')
      }
    }, DEBOUNCE_MS)

    // 8. Cleanup runs on every dependency change AND unmount: cancels the
    //    pending debounce and aborts the fetch if it already fired.
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [searchTerm, retryTick])

  const retry = () => setRetryTick((t) => t + 1)

  return { movies, status, error, retry }
}