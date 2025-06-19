import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import LogIn from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Authentication",
  description: "Authentication forms built using the components.",
}

export default function AuthenticationPage() {
  return (
    <div className="container relative hidden h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <Image
          src="/images/tattoogun.jpg"
          alt="Professional tattoo equipment and workspace"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#020505] to-transparent" />
        <div className="relative z-20 pt-8">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Where artistry meets precision. Experience the finest tattoo craftsmanship in our state-of-the-art studio.&rdquo;
            </p>
            <footer className="text-sm text-gray-300">Master Artist</footer>
          </blockquote>
        </div>
      </div>
      <div className="relative flex h-full items-center p-4 lg:p-8 bg-[#020505]">
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#020505] to-transparent pointer-events-none" />
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Welcome back
            </h1>
            <p className="text-sm !text-gray-300">
              Enter your credentials to access the admin dashboard
            </p>
          </div>
          <LogIn />
          <p className="px-8 text-center text-sm text-gray-400">
            By clicking continue, you agree to our{" "}
            <Link
              href="/terms"
              className="underline underline-offset-4 hover:text-white transition-colors"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
      <div className="md:hidden">
        <Image
          src="/images/tattoogun.jpg"
          width={1280}
          height={843}
          alt="Professional tattoo equipment and workspace"
          className="block dark:hidden"
        />
        <Image
          src="/images/tattoogun.jpg"
          width={1280}
          height={843}
          alt="Professional tattoo equipment and workspace"
          className="hidden dark:block"
        />
      </div>
    </div>
  )
}