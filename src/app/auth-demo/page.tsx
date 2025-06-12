import { Metadata } from 'next'
import { AuthDemo } from './auth-demo'

export const metadata: Metadata = {
  title: 'Auth Demo | Ink 37 Tattoos Admin',
  description: 'Login and logout components demo',
}

export default function AuthDemoPage() {
  return <AuthDemo />
}