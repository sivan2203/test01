import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <main aria-busy="true" aria-label="Загружаем товар" className="mx-auto grid min-h-dvh w-full max-w-[90rem] grid-cols-[minmax(0,1fr)] gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.75fr)]" id="main-content" tabIndex={-1}>
      <h1 className="sr-only">Загружаем товар</h1>
      <Skeleton className="min-w-0 aspect-square w-full" />
      <div className="min-w-0 space-y-5 lg:pt-12">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </main>
  );
}
