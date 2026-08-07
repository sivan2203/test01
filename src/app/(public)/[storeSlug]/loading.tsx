import { Skeleton } from "@/components/ui/skeleton";

export default function StorefrontLoading() {
  return (
    <main aria-busy="true" aria-label="Загружаем витрину" className="mx-auto min-h-dvh w-full max-w-[90rem] px-4 py-8 sm:px-8" id="main-content" tabIndex={-1}>
      <h1 className="sr-only">Загружаем витрину</h1>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-6 h-16 w-[34rem] max-w-full sm:h-24" />
      <Skeleton className="mt-5 h-6 w-[30rem] max-w-full" />
      <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => <Skeleton className="aspect-[4/5] w-full" key={index} />)}
      </div>
    </main>
  );
}
