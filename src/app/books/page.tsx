'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import type { Author, Book, Pagination } from '@/lib/types'
import BookForm from '@/components/BookForm'
import { Alert, Card, Spinner, btn, inputCls } from '@/components/ui'

export default function BooksPage() {
  // Datos para los dropdowns
  const [authors, setAuthors] = useState<Author[]>([])
  const [genres, setGenres] = useState<string[]>([])

  // Filtros
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [genre, setGenre] = useState('')
  const [authorId, setAuthorId] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(5)

  // Resultados
  const [books, setBooks] = useState<Book[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Book | null>(null)

  // Carga autores y géneros disponibles
  const loadOptions = useCallback(async () => {
    const [aRes, bRes] = await Promise.all([fetch('/api/authors'), fetch('/api/books')])
    if (aRes.ok) setAuthors(await aRes.json())
    if (bRes.ok) {
      const all: Book[] = await bRes.json()
      setGenres([...new Set(all.map((b) => b.genre).filter((g): g is string => !!g))].sort())
    }
  }, [])

  useEffect(() => {
    loadOptions()
  }, [loadOptions])

  // Búsqueda en tiempo real: espera 400 ms después de dejar de escribir
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [search])

  // Consume el endpoint /api/books/search
  const loadBooks = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy,
        order,
      })
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (genre) params.set('genre', genre)
      if (authorId) params.set('authorId', authorId)

      const res = await fetch(`/api/books/search?${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al buscar')
      setBooks(json.data)
      setPagination(json.pagination)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [page, limit, sortBy, order, debouncedSearch, genre, authorId])

  useEffect(() => {
    loadBooks()
  }, [loadBooks])

  function flash(text: string) {
    setMessage(text)
    setTimeout(() => setMessage(''), 3000)
  }

  function refreshAll() {
    loadBooks()
    loadOptions()
  }

  async function handleDelete(book: Book) {
    if (!confirm(`¿Eliminar el libro "${book.title}"?`)) return
    const res = await fetch(`/api/books/${book.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) return setError(data.error)
    flash('Libro eliminado correctamente')
    // Si era el último de la página, retrocede una página
    if (books.length === 1 && page > 1) setPage(page - 1)
    else refreshAll()
  }

  function clearFilters() {
    setSearch('')
    setGenre('')
    setAuthorId('')
    setSortBy('createdAt')
    setOrder('desc')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Búsqueda de libros</h1>
          <p className="text-sm text-slate-500">Busca, filtra, ordena y gestiona los libros</p>
        </div>
        <button className={btn.primary} onClick={() => { setShowCreate(!showCreate); setEditing(null) }}>
          {showCreate ? 'Cerrar' : '+ Nuevo libro'}
        </button>
      </div>

      {error && <Alert>{error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}

      {showCreate && (
        <Card>
          <h2 className="mb-3 font-semibold">Crear libro</h2>
          {authors.length === 0 ? (
            <p className="text-sm text-slate-500">
              Primero crea un autor en el <Link href="/" className="text-indigo-600 underline">dashboard</Link>.
            </p>
          ) : (
            <BookForm
              authors={authors}
              onSaved={() => { flash('Libro creado correctamente'); setShowCreate(false); refreshAll() }}
              onCancel={() => setShowCreate(false)}
            />
          )}
        </Card>
      )}

      {editing && (
        <Card>
          <h2 className="mb-3 font-semibold">Editar: {editing.title}</h2>
          <BookForm
            key={editing.id}
            book={editing}
            authors={authors}
            onSaved={() => { flash('Libro actualizado correctamente'); setEditing(null); refreshAll() }}
            onCancel={() => setEditing(null)}
          />
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-2">
            <input
              className={inputCls}
              placeholder="🔍 Buscar por título..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className={inputCls} value={genre} onChange={(e) => { setGenre(e.target.value); setPage(1) }}>
            <option value="">Todos los géneros</option>
            {genres.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <select className={inputCls} value={authorId} onChange={(e) => { setAuthorId(e.target.value); setPage(1) }}>
            <option value="">Todos los autores</option>
            {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <div className="flex gap-2">
            <select className={inputCls} value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1) }}>
              <option value="createdAt">Fecha de creación</option>
              <option value="title">Título</option>
              <option value="publishedYear">Año</option>
            </select>
            <button
              className={btn.secondary}
              title="Cambiar orden"
              onClick={() => { setOrder(order === 'asc' ? 'desc' : 'asc'); setPage(1) }}
            >
              {order === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
          <span>
            {loading ? 'Buscando...' : (
              <><strong>{pagination?.total ?? 0}</strong> resultado(s) encontrado(s)</>
            )}
          </span>
          <button className="text-indigo-600 hover:underline" onClick={clearFilters}>
            Limpiar filtros
          </button>
        </div>
      </Card>

      {/* Resultados */}
      {loading ? (
        <Spinner text="Buscando libros..." />
      ) : books.length === 0 ? (
        <Card><p className="py-6 text-center text-sm text-slate-500">No se encontraron libros.</p></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((b) => (
            <Card key={b.id} className="flex flex-col">
              <div className="flex-1">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{b.title}</h3>
                  {b.genre && (
                    <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      {b.genre}
                    </span>
                  )}
                </div>
                {b.author && (
                  <Link href={`/authors/${b.author.id}`} className="text-sm text-indigo-600 hover:underline">
                    {b.author.name}
                  </Link>
                )}
                {b.description && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{b.description}</p>}
                <p className="mt-2 text-xs text-slate-500">
                  {b.publishedYear ?? 's/a'} · {b.pages ? `${b.pages} págs.` : 's/p'}
                  {b.isbn && ` · ISBN ${b.isbn}`}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  className={btn.small}
                  onClick={() => { setEditing(b); setShowCreate(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                >
                  Editar
                </button>
                <button className={btn.danger} onClick={() => handleDelete(b)}>Eliminar</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Paginación */}
      {pagination && pagination.totalPages > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            Mostrar
            <select
              className="rounded-lg border border-slate-300 bg-white px-2 py-1"
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}
            >
              {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            por página
          </div>
          <div className="flex items-center gap-1">
            <button className={btn.small} disabled={!pagination.hasPrev} onClick={() => setPage(page - 1)}>
              ← Anterior
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`h-8 min-w-8 rounded-lg px-2 text-sm ${
                  n === page ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-white hover:bg-slate-50'
                }`}
              >
                {n}
              </button>
            ))}
            <button className={btn.small} disabled={!pagination.hasNext} onClick={() => setPage(page + 1)}>
              Siguiente →
            </button>
          </div>
          <span className="text-sm text-slate-500">
            Página {pagination.page} de {pagination.totalPages}
          </span>
        </div>
      )}
    </div>
  )
}
