'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { Author, Book } from '@/lib/types'
import AuthorForm from '@/components/AuthorForm'
import { Alert, Card, Spinner, StatCard, btn } from '@/components/ui'

export default function DashboardPage() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Author | null>(null)
  const [viewingBooks, setViewingBooks] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [aRes, bRes] = await Promise.all([
        fetch('/api/authors'),
        fetch('/api/books'),
      ])
      if (!aRes.ok || !bRes.ok) throw new Error('Error al cargar datos')
      setAuthors(await aRes.json())
      setBooks(await bRes.json())
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Estadísticas generales calculadas a partir de los datos de la API
  const stats = useMemo(() => {
    const withPages = books.filter((b) => b.pages)
    const avgPages = withPages.length
      ? Math.round(withPages.reduce((s, b) => s + (b.pages ?? 0), 0) / withPages.length)
      : 0
    const genres = new Set(books.map((b) => b.genre).filter(Boolean))
    const top = [...authors].sort(
      (a, b) => (b._count?.books ?? 0) - (a._count?.books ?? 0)
    )[0]
    return { avgPages, genres: genres.size, top }
  }, [authors, books])

  async function handleDelete(author: Author) {
    const n = author._count?.books ?? 0
    if (!confirm(`¿Eliminar a ${author.name}?${n ? ` También se eliminarán sus ${n} libro(s).` : ''}`)) return
    const res = await fetch(`/api/authors/${author.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) return setError(data.error)
    setMessage('Autor eliminado correctamente')
    loadData()
  }

  function flash(text: string) {
    setMessage(text)
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Gestión de autores de la biblioteca</p>
        </div>
        <button
          className={btn.primary}
          onClick={() => { setShowCreate(!showCreate); setEditing(null) }}
        >
          {showCreate ? 'Cerrar' : '+ Nuevo autor'}
        </button>
      </div>

      {error && <Alert>{error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}

      {/* Estadísticas generales */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Autores" value={authors.length} />
        <StatCard label="Libros" value={books.length} />
        <StatCard label="Géneros" value={stats.genres} />
        <StatCard
          label="Promedio de páginas"
          value={stats.avgPages}
          hint={stats.top?._count?.books ? `Autor con más libros: ${stats.top.name}` : undefined}
        />
      </div>

      {/* Crear autor */}
      {showCreate && (
        <Card>
          <h2 className="mb-3 font-semibold">Crear autor</h2>
          <AuthorForm
            onSaved={() => { flash('Autor creado correctamente'); setShowCreate(false); loadData() }}
            onCancel={() => setShowCreate(false)}
          />
        </Card>
      )}

      {/* Editar autor */}
      {editing && (
        <Card>
          <h2 className="mb-3 font-semibold">Editar: {editing.name}</h2>
          <AuthorForm
            key={editing.id}
            author={editing}
            onSaved={() => { flash('Autor actualizado correctamente'); setEditing(null); loadData() }}
            onCancel={() => setEditing(null)}
          />
        </Card>
      )}

      {/* Lista de autores */}
      <Card className="p-0">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold">Autores ({authors.length})</h2>
        </div>

        {loading ? (
          <Spinner text="Cargando autores..." />
        ) : authors.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            Aún no hay autores. ¡Crea el primero!
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {authors.map((a) => (
              <li key={a.id} className="px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Link href={`/authors/${a.id}`} className="font-semibold text-slate-900 hover:text-indigo-700">
                      {a.name}
                    </Link>
                    <p className="text-sm text-slate-500">
                      {a.email}
                      {a.nationality && ` · ${a.nationality}`}
                      {a.birthYear && ` · ${a.birthYear}`}
                    </p>
                    <span className="mt-1 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      {a._count?.books ?? 0} libro(s)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className={btn.small}
                      onClick={() => setViewingBooks(viewingBooks === a.id ? null : a.id)}
                    >
                      {viewingBooks === a.id ? 'Ocultar libros' : 'Ver libros'}
                    </button>
                    <Link href={`/authors/${a.id}`} className={btn.small}>Detalle</Link>
                    <button
                      className={btn.small}
                      onClick={() => { setEditing(a); setShowCreate(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    >
                      Editar
                    </button>
                    <button className={btn.danger} onClick={() => handleDelete(a)}>Eliminar</button>
                  </div>
                </div>

                {viewingBooks === a.id && (
                  <div className="mt-3 rounded-lg bg-slate-50 p-3">
                    {a.books && a.books.length > 0 ? (
                      <ul className="space-y-1 text-sm">
                        {a.books.map((b) => (
                          <li key={b.id} className="flex justify-between gap-2">
                            <span>📖 {b.title}</span>
                            <span className="text-slate-500">
                              {b.genre ?? 'Sin género'} {b.publishedYear && `· ${b.publishedYear}`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">Este autor no tiene libros registrados.</p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
