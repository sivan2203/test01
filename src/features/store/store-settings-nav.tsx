import { cn } from "@/lib/utils";

export type StoreSettingsSection =
  | "profile"
  | "public-link"
  | "contact"
  | "about";

const STORE_SETTINGS_SECTIONS: Array<{
  id: StoreSettingsSection;
  label: string;
  number: string;
}> = [
  { id: "profile", label: "Профиль", number: "01" },
  { id: "public-link", label: "Публичная ссылка", number: "02" },
  { id: "contact", label: "Связь", number: "03" },
  { id: "about", label: "О витрине", number: "04" },
];

type StoreSettingsNavProps = {
  activeSection: StoreSettingsSection;
  onNavigate: (section: StoreSettingsSection) => void;
  className?: string;
};

export function StoreSettingsNav({
  activeSection,
  onNavigate,
  className,
}: StoreSettingsNavProps) {
  return (
    <nav
      aria-label="Разделы настроек магазина"
      className={cn("min-w-0 xl:sticky xl:top-8", className)}
    >
      <p className="mb-2 hidden font-mono text-[0.6875rem] tracking-wide text-ink-secondary xl:block">
        РАЗДЕЛЫ
      </p>
      <ul className="grid grid-cols-2 gap-1 sm:grid-cols-4 xl:flex xl:flex-col">
        {STORE_SETTINGS_SECTIONS.map((section) => {
          const active = activeSection === section.id;

          return (
            <li key={section.id}>
              <a
                aria-current={active ? "location" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-2 border-b-2 px-2 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:border-b-0 xl:border-l-2 xl:px-3",
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-ink-secondary hover:bg-surface-muted hover:text-foreground",
                )}
                href={`#store-settings-${section.id}`}
                onClick={() => onNavigate(section.id)}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "font-mono text-[0.6875rem]",
                    active ? "text-primary" : "text-ink-disabled",
                  )}
                >
                  {section.number}
                </span>
                <span>{section.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
