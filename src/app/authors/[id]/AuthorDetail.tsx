'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import type { Author, AuthorStats, Book } from '@/lib/types'
import AuthorForm from '@/components/AuthorForm'
import BookForm from '@/components/BookForm'
import { Alert, Card, Spinner, StatCard, btn } from '@/components/ui'

export default function AuthorDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [author, setAuthor] = useState<Author | null>(null)
  const [stats, setStats] = useState<AuthorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [editingAuthor, setEditingAuthor] = useState(false)
  const [addingBook, setAddingBook] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)

  // Consume /api/authors/[id] y /api/authors/[id]/stats
  const loadData = useCallback(async () => {
    setError('')
    try {
      const [aRes, sRes] = await Promise.all([
        fetch(`/api/authors/${id}`),
        fetch(`/api/authors/${id}/stats`),
      ])
      const aJson = await aRes.json()
      if (!aRes.ok) throw new Error(aJson.error || 'Error al cargar autor')
      setAuthor(aJson)
      if (sRes.ok) setStats(await sRes.json())
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  function flash(text: string) {
    setMessage(text)
    setTimeout(() => setMessage(''), 3000)
  }

  async function handleDeleteBook(book: Book) {
    if (!confirm(`¿Eliminar el libro "${book.title}"?`)) return
    const res = await fetch(`/api/books/${book.id}`, { method: 'DELETE' })
    if (!res.ok) return setError((await res.json()).error)
    flash('Libro eliminado correctamente')
    loadData()
  }

  async function handleDeleteAuthor() {
    if (!author || !confirm(`¿Eliminar a ${author.name} y todos sus libros?`)) return
    const res = await fetch(`/api/authors/${author.id}`, { method: 'DELETE' })
    if (res.ok) router.push('/')
    else setError((await res.json()).error)
  }

  if (loading) return <Spinner text="Cargando autor..." />

  if (!author) {
    return (
      <div className="space-y-4">
        <Alert>{error || 'Autor no encontrado'}</Alert>
        <Link href="/" className={btn.secondary}>← Volver</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-indigo-600 hover:underline">← Volver al dashboard</Link>

      {error && <Alert>{error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}

      {/* Información del autor */}
      <Card>
        {editingAuthor ? (
          <>
            <h2 className="mb-3 font-semibold">Editar información del autor</h2>
            <AuthorForm
              author={author}
              onSaved={() => { flash('Autor actualizado correctamente'); setEditingAuthor(false); loadData() }}
              onCancel={() => setEditingAuthor(false)}
            />
          </>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{author.name}</h1>
              <p className="text-sm text-slate-500">{author.email}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {author.nationality && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5">🌎 {author.nationality}</span>
                )}
                {author.birthYear && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5">🎂 {author.birthYear}</span>
                )}
                <span className="rounded-full bg-slate-100 px-2 py-0.5">
                  Registrado: {new Date(author.createdAt).toLocaleDateString('es-PE')}
                </span>
              </div>
              {author.bio && <p className="mt-3 max-w-2xl text-sm text-slate-700">{author.bio}</p>}
            </div>
            <div className="flex gap-2">
              <button className={btn.secondary} onClick={() => setEditingAuthor(true)}>Editar autor</button>
              <button className={btn.danger} onClick={handleDeleteAuthor}>Eliminar</button>
            </div>
          </div>
        )}
      </Card>

      {/* Estadísticas del autor (endpoint /stats) */}
      {stats && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Estadísticas</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total de libros" value={stats.totalBooks} />
            <StatCard
              label="Primer libro"
              value={stats.firstBook?.year ?? '—'}
              hint={stats.firstBook?.title}
            />
            <StatCard
              label="Último libro"
              value={stats.latestBook?.year ?? '—'}
              hint={stats.latestBook?.title}
            />
            <StatCard label="Promedio de páginas" value={stats.averagePages} />
            <StatCard
              label="Libro más largo"
              value={stats.longestBook ? `${stats.longestBook.pages} págs.` : '—'}
              hint={stats.longestBook?.title}
            />
            <StatCard
              label="Libro más corto"
              value={stats.shortestBook ? `${stats.shortestBook.pages} págs.` : '—'}
              hint={stats.shortestBook?.title}
            />
            <Card className="col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Géneros</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {stats.genres.length ? stats.genres.map((g) => (
                  <span key={g} className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">{g}</span>
                )) : <span className="text-sm text-slate-500">Sin géneros</span>}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Libros del autor */}
      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold">Libros ({author.books?.length ?? 0})</h2>
          <button className={btn.primary} onClick={() => { setAddingBook(!addingBook); setEditingBook(null) }}>
            {addingBook ? 'Cerrar' : '+ Agregar libro'}
          </button>
        </div>

        {addingBook && (
          <div className="border-b border-slate-200 bg-slate-50 p-5">
            <h3 className="mb-3 text-sm font-semibold">Nuevo libro para {author.name}</h3>
            <BookForm
              fixedAuthorId={author.id}
              onSaved={() => { flash('Libro agregado correctamente'); setAddingBook(false); loadData() }}
              onCancel={() => setAddingBook(false)}
            />
          </div>
        )}

        {editingBook && (
          <div className="border-b border-slate-200 bg-slate-50 p-5">
            <h3 className="mb-3 text-sm font-semibold">Editar: {editingBook.title}</h3>
            <BookForm
              key={editingBook.id}
              book={editingBook}
              fixedAuthorId={author.id}
              onSaved={() => { flash('Libro actualizado correctamente'); setEditingBook(null); loadData() }}
              onCancel={() => setEditingBook(null)}
            />
          </div>
        )}

        {author.books && author.books.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {author.books.map((b) => (
              <li key={b.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-slate-900">📖 {b.title}</p>
                  <p className="text-sm text-slate-500">
                    {b.genre ?? 'Sin género'} · {b.publishedYear ?? 's/a'} · {b.pages ? `${b.pages} págs.` : 's/p'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className={btn.small} onClick={() => { setEditingBook(b); setAddingBook(false) }}>Editar</button>
                  <button className={btn.danger} onClick={() => handleDeleteBook(b)}>Eliminar</button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-slate-500">Este autor aún no tiene libros.</p>
        )}
      </Card>
    </div>
  )
}
