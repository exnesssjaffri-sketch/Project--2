import MovieSearch from './components/MovieSearch'

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>🎬 Movie Search</h1>
        <p>Search the OMDB catalog and browse posters in a responsive grid.</p>
      </header>
      <MovieSearch />
    </div>
  )
}