'use client'

import { useState } from 'react'
import type { Author } from '@/lib/types'
import { Alert, Field, btn, inputCls } from './ui'

interface Props {
  author?: Author | null // si viene, el formulario es de edición
  onSaved: (author: Author) => void
  onCancel?: () => void
}

export default function AuthorForm({ author, onSaved, onCancel }: Props) {
  const [form, setForm] = useState({
    name: author?.name ?? '',
    email: author?.email ?? '',
    nationality: author?.nationality ?? '',
    birthYear: author?.birthYear?.toString() ?? '',
    bio: author?.bio ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch(
        author ? `/api/authors/${author.id}` : '/api/authors',
        {
          method: author ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            birthYear: form.birthYear || null,
          }),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')
      onSaved(data)
      if (!author) {
        setForm({ name: '', email: '', nationality: '', birthYear: '', bio: '' })
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
        <Field label="Nombre *">
          <input className={inputCls} value={form.name} onChange={set('name')} required />
        </Field>
        <Field label="Email *">
          <input className={inputCls} type="email" value={form.email} onChange={set('email')} required />
        </Field>
        <Field label="Nacionalidad">
          <input className={inputCls} value={form.nationality} onChange={set('nationality')} />
        </Field>
        <Field label="Año de nacimiento">
          <input className={inputCls} type="number" value={form.birthYear} onChange={set('birthYear')} />
        </Field>
      </div>
      <Field label="Biografía">
        <textarea className={inputCls} rows={2} value={form.bio} onChange={set('bio')} />
      </Field>
      <div className="flex gap-2">
        <button className={btn.primary} disabled={saving}>
          {saving ? 'Guardando...' : author ? 'Guardar cambios' : 'Crear autor'}
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
