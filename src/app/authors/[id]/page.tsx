import { Suspense } from 'react'
import AuthorDetail from './AuthorDetail'
import { Spinner } from '@/components/ui'

// En Next.js 16 los componentes cliente que usan useParams() deben ir dentro de <Suspense>
export default function AuthorDetailPage() {
  return (
    <Suspense fallback={<Spinner text="Cargando autor..." />}>
      <AuthorDetail />
    </Suspense>
  )
}
