import { BrandMark } from "@/components/brand-mark";

export function WorkspaceSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading workspace">
      <div className="app-header border-b border-line bg-paper">
        <div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <BrandMark className="h-8 w-8 text-ink" />
            <div className="flex flex-col gap-1.5">
              <div className="skeleton h-3 w-28 rounded-[4px]" />
              <div className="skeleton h-2 w-20 rounded-[4px]" />
            </div>
          </div>
          <div className="skeleton hidden h-2.5 w-36 rounded-[4px] sm:block" />
        </div>
      </div>
      <main className="mx-auto max-w-[1180px] px-6 py-12">
        <div className="skeleton mb-4 h-2.5 w-24 rounded-[4px]" />
        <div className="skeleton mb-3 h-12 w-[min(100%,460px)] rounded-[8px]" />
        <div className="skeleton h-4 w-[min(100%,520px)] rounded-[4px]" />
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {[0, 1].map((index) => (
            <div key={index} className="paper-panel p-6">
              <div className="flex justify-between">
                <div className="skeleton h-5 w-16 rounded-full" />
                <div className="skeleton h-4 w-4 rounded-[4px]" />
              </div>
              <div className="skeleton mt-6 h-8 w-3/4 rounded-[6px]" />
              <div className="mt-3 space-y-2">
                <div className="skeleton h-3 w-full rounded-[4px]" />
                <div className="skeleton h-3 w-5/6 rounded-[4px]" />
              </div>
              <div className="mt-6 flex gap-2">
                {[0, 1, 2, 3, 4].map((lane) => (
                  <div key={lane} className="skeleton h-12 flex-1 rounded-[6px]" />
                ))}
              </div>
              <div className="skeleton mt-6 h-3 w-1/2 rounded-[4px]" />
            </div>
          ))}
        </div>
        <span className="sr-only">Loading workspace</span>
      </main>
    </div>
  );
}

export function EditorSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading map">
      <div className="editor-header border-b border-line bg-paper">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5">
          <div className="flex items-center gap-4">
            <div className="skeleton h-8 w-8 rounded-[8px]" />
            <div className="skeleton h-5 w-48 rounded-[5px]" />
          </div>
          <div className="skeleton h-8 w-24 rounded-full" />
        </div>
      </div>
      <div className="border-b border-line bg-paper px-5 py-3">
        <div className="mx-auto flex max-w-[1280px] gap-2">
          <div className="skeleton h-7 w-24 rounded-[8px]" />
          <div className="skeleton h-7 w-20 rounded-[8px]" />
        </div>
      </div>
      <div className="mx-auto max-w-[1180px] px-6 py-8">
        <div className="grid gap-3 md:grid-cols-5">
          {[0, 1, 2, 3, 4].map((lane) => (
            <div key={lane} className="skeleton h-64 rounded-card" />
          ))}
        </div>
        <span className="sr-only">Loading map</span>
      </div>
    </div>
  );
}
