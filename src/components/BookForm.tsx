'use client'

import { useState } from 'react'
import type { Author, Book } from '@/lib/types'
import { Alert, Field, btn, inputCls } from './ui'

interface Props {
  book?: Book | null // si viene, el formulario es de edición
  authors?: Author[] // para el selector de autor
  fixedAuthorId?: string // si viene, el autor ya está definido (página de detalle)
  onSaved: (book: Book) => void
  onCancel?: () => void
}

export default function BookForm({
  book,
  authors = [],
  fixedAuthorId,
  onSaved,
  onCancel,
}: Props) {
  const [form, setForm] = useState({
    title: book?.title ?? '',
    description: book?.description ?? '',
    isbn: book?.isbn ?? '',
    publishedYear: book?.publishedYear?.toString() ?? '',
    genre: book?.genre ?? '',
    pages: book?.pages?.toString() ?? '',
    authorId: book?.authorId ?? fixedAuthorId ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm({ ...form, [k]: e.target.value })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch(book ? `/api/books/${book.id}` : '/api/books', {
        method: book ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          isbn: form.isbn || null,
          pages: form.pages ? Number(form.pages) : null,
          publishedYear: form.publishedYear || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')
      onSaved(data)
      if (!book) {
        setForm({
          title: '', description: '', isbn: '', publishedYear: '', genre: '', pages: '',
          authorId: fixedAuthorId ?? '',
        })
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <Alert>{error}</Alert>}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Título *">
          <input className={inputCls} value={form.title} onChange={set('title')} required minLength={3} />
        </Field>
        {!fixedAuthorId && (
          <Field label="Autor *">
            <select className={inputCls} value={form.authorId} onChange={set('authorId')} required>
              <option value="">Selecciona un autor</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Género">
          <input className={inputCls} value={form.genre} onChange={set('genre')} placeholder="Novela, Cuento..." />
        </Field>
        <Field label="ISBN">
          <input className={inputCls} value={form.isbn} onChange={set('isbn')} />
        </Field>
        <Field label="Año de publicación">
          <input className={inputCls} type="number" value={form.publishedYear} onChange={set('publishedYear')} />
        </Field>
        <Field label="Páginas">
          <input className={inputCls} type="number" min={1} value={form.pages} onChange={set('pages')} />
        </Field>
      </div>
      <Field label="Descripción">
        <textarea className={inputCls} rows={2} value={form.description} onChange={set('description')} />
      </Field>
      <div className="flex gap-2">
        <button className={btn.primary} disabled={saving}>
          {saving ? 'Guardando...' : book ? 'Guardar cambios' : 'Crear libro'}
        </button>
        {onCancel && (
          <button type="button" className={btn.secondary} onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
