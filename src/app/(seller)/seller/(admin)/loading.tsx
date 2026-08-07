import { Skeleton } from "@/components/ui/skeleton";

export default function SellerLoading() {
  return (
    <div aria-busy="true" aria-label="Загружаем кабинет" className="space-y-8">
      <h1 className="sr-only">Загружаем кабинет</h1>
      <div className="border-b border-border-strong pb-6">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-3 h-10 w-64 max-w-full" />
      </div>
      <div className="grid gap-8 xl:grid-cols-2">
        <div>
          <Skeleton className="h-1 w-full" />
          <Skeleton className="mt-6 h-28 w-48 max-w-full" />
          <Skeleton className="mt-6 h-14 w-full" />
          <Skeleton className="mt-1 h-14 w-full" />
        </div>
        <div>
          <Skeleton className="h-1 w-full" />
          <Skeleton className="mt-5 h-20 w-full" />
          <Skeleton className="mt-1 h-20 w-full" />
        </div>
      </div>
    </div>
  );
}
