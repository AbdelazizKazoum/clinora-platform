import type { Metadata } from 'next'
import Preloader from './components/Preloader'

export const metadata: Metadata = { title: 'Preloader Layout' }

const Page = () => {
  return <Preloader />
}

export default Page
