import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type BookInfo = {
  title: string
  genre: string | null
  publishedYear: number | null
  pages: number | null
}

// GET - Estadísticas completas de un autor
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const author = await prisma.author.findUnique({
      where: { id },
      include: { books: true },
    })

    if (!author) {
      return NextResponse.json(
        { error: 'Autor no encontrado' },
        { status: 404 }
      )
    }

    const books: BookInfo[] = author.books

    // Libros que tienen año de publicación, ordenados del más antiguo al más reciente
    const withYear = books
      .filter((b) => b.publishedYear !== null)
      .sort((a, b) => a.publishedYear! - b.publishedYear!)

    // Libros que tienen número de páginas, ordenados de menor a mayor
    const withPages = books
      .filter((b) => b.pages !== null)
      .sort((a, b) => a.pages! - b.pages!)

    const firstBook = withYear[0]
    const latestBook = withYear[withYear.length - 1]
    const shortestBook = withPages[0]
    const longestBook = withPages[withPages.length - 1]

    const averagePages =
      withPages.length > 0
        ? Math.round(
            withPages.reduce((sum: number, b) => sum + b.pages!, 0) / withPages.length
          )
        : 0

    // Géneros únicos (sin vacíos ni repetidos)
    const genres = [
      ...new Set(books.map((b) => b.genre).filter((g): g is string => !!g)),
    ]

    return NextResponse.json({
      authorId: author.id,
      authorName: author.name,
      totalBooks: books.length,
      firstBook: firstBook
        ? { title: firstBook.title, year: firstBook.publishedYear }
        : null,
      latestBook: latestBook
        ? { title: latestBook.title, year: latestBook.publishedYear }
        : null,
      averagePages,
      genres,
      longestBook: longestBook
        ? { title: longestBook.title, pages: longestBook.pages }
        : null,
      shortestBook: shortestBook
        ? { title: shortestBook.title, pages: shortestBook.pages }
        : null,
    })
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas del autor' },
      { status: 500 }
    )
  }
}
