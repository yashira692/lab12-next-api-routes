import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const SORT_FIELDS = ['title', 'publishedYear', 'createdAt'] as const
type SortField = (typeof SORT_FIELDS)[number]

// GET - Búsqueda de libros con filtros, ordenamiento y paginación
// Ej: /api/books/search?search=amor&genre=Novela&page=1&limit=10&sortBy=publishedYear&order=desc
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search')?.trim() || ''
    const genre = searchParams.get('genre')?.trim() || ''
    const authorName = searchParams.get('authorName')?.trim() || ''
    const authorId = searchParams.get('authorId')?.trim() || '' // extra: usado por el dropdown de autores

    // page: default 1, mínimo 1
    let page = parseInt(searchParams.get('page') || '1')
    if (isNaN(page) || page < 1) page = 1

    // limit: default 10, máximo 50
    let limit = parseInt(searchParams.get('limit') || '10')
    if (isNaN(limit) || limit < 1) limit = 10
    if (limit > 50) limit = 50

    // sortBy: title | publishedYear | createdAt (default createdAt)
    const sortParam = searchParams.get('sortBy') || 'createdAt'
    const sortBy: SortField = SORT_FIELDS.includes(sortParam as SortField)
      ? (sortParam as SortField)
      : 'createdAt'

    // order: asc | desc (default desc)
    const order: 'asc' | 'desc' =
      searchParams.get('order') === 'asc' ? 'asc' : 'desc'

    // Construcción dinámica del filtro
    const where = {
      ...(search && {
        title: { contains: search, mode: 'insensitive' as const },
      }),
      ...(genre && { genre }),
      ...(authorId && { authorId }),
      ...(authorName && {
        author: {
          name: { contains: authorName, mode: 'insensitive' as const },
        },
      }),
    }

    // Consulta de datos y conteo total en una sola transacción
    const [data, total] = await prisma.$transaction([
      prisma.book.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy:
          sortBy === 'title'
            ? { title: order }
            : sortBy === 'publishedYear'
              ? { publishedYear: order }
              : { createdAt: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.book.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      { error: 'Error al buscar libros' },
      { status: 500 }
    )
  }
}
