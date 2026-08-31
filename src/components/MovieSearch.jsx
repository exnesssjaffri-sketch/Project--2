import { useState } from 'react'
import useMovies from '../hooks/useMovies'

export default function MovieSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const { movies, status, error, retry } = useMovies(searchTerm)

  const isNotFound =
    status === 'error' &&
    error.code === 'API_ERROR' &&
    /not found/i.test(error.message)

  return (
    <main>
      <div className="search-bar">
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Type a movie name… e.g. Batman"
          aria-label="Search movies"
        />
      </div>

      {/* IDLE: nothing searched yet */}
      {status === 'idle' && <p className="hint">Start typing to search the OMDB catalog.</p>}

      {/* LOADING: waiting for the API response */}
      {status === 'loading' && (
        <div className="state-box" role="status">
          <span className="spinner" aria-hidden="true" />
          <p>Loading movies…</p>
        </div>
      )}

      {/* ERROR: API failure (network, key, rate limit…) */}
      {status === 'error' && !isNotFound && (
        <div className="state-box error" role="alert">
          <p>
            <strong>{error.code}</strong> — {error.message}
          </p>
          <button type="button" onClick={retry}>
            Try again
          </button>
        </div>
      )}

      {/* ERROR mapped to empty state: OMDB "Movie not found!" */}
      {isNotFound && status === 'error' && (
        <p className="hint">No movies found for “{searchTerm}”. Try another title.</p>
      )}

      {/* SUCCESS with zero results */}
      {status === 'success' && movies.length === 0 && (
        <p className="hint">No movies found for “{searchTerm}”. Try another title.</p>
      )}

      {/* SUCCESS: render posters in a CSS grid */}
      {status === 'success' && movies.length > 0 && (
        <section className="movie-grid" aria-label="Movie results" aria-live="polite">
          {movies.map((movie) => (
            <article className="movie-card" key={movie.imdbID}>
              {movie.Poster !== 'N/A' ? (
                <img
                  src={movie.Poster}
                  alt={`${movie.Title} (${movie.Year}) poster`}
                  loading="lazy"
                />
              ) : (
                <div className="no-poster">🎞️</div>
              )}
              <h3>{movie.Title}</h3>
              <p>{movie.Year}</p>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}