// Datos de prueba para la tarea. Ejecutar con:  npm run seed
// No borra nada: si un autor (email) o libro (ISBN) ya existe, lo salta.
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const data = [
  {
    author: { name: 'Gabriel García Márquez', email: 'gabo@example.com', nationality: 'Colombia', birthYear: 1927, bio: 'Premio Nobel de Literatura 1982' },
    books: [
      { title: 'La hojarasca', isbn: '978-0307474452', publishedYear: 1955, genre: 'Novela', pages: 160 },
      { title: 'Relato de un náufrago', isbn: '978-0307476425', publishedYear: 1970, genre: 'Periodismo', pages: 110 },
      { title: 'Cien años de soledad', isbn: '978-0307474728', publishedYear: 1967, genre: 'Novela', pages: 417, description: 'Obra maestra del realismo mágico' },
      { title: 'El amor en los tiempos del cólera', isbn: '978-0307387264', publishedYear: 1985, genre: 'Novela', pages: 368 },
      { title: 'Doce cuentos peregrinos', isbn: '978-1400034956', publishedYear: 1992, genre: 'Cuento', pages: 192 },
      { title: 'Memoria de mis putas tristes', isbn: '978-1400095803', publishedYear: 2004, genre: 'Novela', pages: 128 },
    ],
  },
  {
    author: { name: 'Mario Vargas Llosa', email: 'mvll@example.com', nationality: 'Perú', birthYear: 1936, bio: 'Premio Nobel de Literatura 2010' },
    books: [
      { title: 'La ciudad y los perros', isbn: '978-8420412146', publishedYear: 1963, genre: 'Novela', pages: 448 },
      { title: 'La casa verde', isbn: '978-8420471839', publishedYear: 1966, genre: 'Novela', pages: 528 },
      { title: 'Los jefes', isbn: '978-8466318761', publishedYear: 1959, genre: 'Cuento', pages: 144 },
      { title: 'La tía Julia y el escribidor', isbn: '978-8420471846', publishedYear: 1977, genre: 'Novela', pages: 464 },
    ],
  },
  {
    author: { name: 'Isabel Allende', email: 'isabel@example.com', nationality: 'Chile', birthYear: 1942, bio: 'Autora de La casa de los espíritus' },
    books: [
      { title: 'La casa de los espíritus', isbn: '978-8401352836', publishedYear: 1982, genre: 'Novela', pages: 496 },
      { title: 'De amor y de sombra', isbn: '978-8401352843', publishedYear: 1984, genre: 'Novela', pages: 320 },
      { title: 'Cuentos de Eva Luna', isbn: '978-8401352874', publishedYear: 1989, genre: 'Cuento', pages: 256 },
    ],
  },
]

async function main() {
  for (const { author, books } of data) {
    const a = await prisma.author.upsert({
      where: { email: author.email },
      update: {},
      create: author,
    })
    for (const book of books) {
      const exists = await prisma.book.findUnique({ where: { isbn: book.isbn } })
      if (!exists) await prisma.book.create({ data: { ...book, authorId: a.id } })
    }
    console.log(`✔ ${a.name}`)
  }
  const total = await prisma.book.count()
  console.log(`Listo. Libros en la base de datos: ${total}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
