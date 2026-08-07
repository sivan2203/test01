import {
  PRODUCT_WIZARD_STEPS,
  type ProductWizardStepId,
} from "./product-wizard-state";

type ProductWizardStepperProps = {
  currentStepId: ProductWizardStepId;
};

export function ProductWizardStepper({
  currentStepId,
}: ProductWizardStepperProps) {
  const currentIndex = PRODUCT_WIZARD_STEPS.findIndex(
    (step) => step.id === currentStepId,
  );
  const currentStep = PRODUCT_WIZARD_STEPS[currentIndex];

  return (
    <div aria-label="Ход создания товара">
      <p aria-atomic="true" aria-live="polite" className="sr-only">
        Шаг {currentIndex + 1} из {PRODUCT_WIZARD_STEPS.length}: {currentStep.label}
      </p>
      <div className="sm:hidden">
        <p className="font-mono text-xs text-ink-secondary">
          Шаг {currentIndex + 1} из {PRODUCT_WIZARD_STEPS.length}
        </p>
        <p className="mt-1 font-semibold" aria-current="step">
          {currentStep.label}
        </p>
        <div
          aria-hidden="true"
          className="mt-3 h-1 overflow-hidden rounded-full bg-surface-muted"
        >
          <div
            className="h-full bg-primary transition-[width] motion-reduce:transition-none"
            style={{
              width: `${((currentIndex + 1) / PRODUCT_WIZARD_STEPS.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <ol className="hidden grid-cols-4 border-y border-border sm:grid">
        {PRODUCT_WIZARD_STEPS.map((step, index) => {
          const current = step.id === currentStepId;
          const complete = index < currentIndex;

          return (
            <li
              aria-current={current ? "step" : undefined}
              className="relative min-w-0 border-r border-border px-3 py-3 last:border-r-0"
              key={step.id}
            >
              {current ? (
                <span className="absolute inset-x-0 -top-px h-0.5 bg-primary" />
              ) : null}
              <span className="block font-mono text-[0.6875rem] text-ink-secondary">
                {String(index + 1).padStart(2, "0")} / {complete ? "ГОТОВО" : current ? "СЕЙЧАС" : "ДАЛЕЕ"}
              </span>
              <span className="mt-1 block truncate text-sm font-semibold">
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
