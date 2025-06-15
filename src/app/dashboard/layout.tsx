import { Icons } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent">
      <Button className="fixed top-5" variant={"outline"} asChild>
        <Link href={"/"}>
          <Icons.chevronLeft className="h-4 w-4" />
          Back
        </Link>
      </Button>
      {children}
    </section>
  );
}
