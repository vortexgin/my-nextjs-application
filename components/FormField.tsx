import { useId } from "react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export type FieldSize = "md" | "sm";

const sizeInputClass: Record<FieldSize, string> = {
  md: "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100",
  sm: "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100",
};

const sizeLabelClass: Record<FieldSize, string> = {
  md: "mb-2 block text-sm font-medium text-slate-700",
  sm: "mb-1 block text-sm font-medium text-slate-700",
};

const TEXT_SIZES = new Set([
  "xs",
  "sm",
  "base",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
  "5xl",
  "6xl",
  "7xl",
  "8xl",
  "9xl",
]);

const DISPLAY_TOKENS = new Set([
  "block",
  "inline-block",
  "inline",
  "flex",
  "inline-flex",
  "grid",
  "inline-grid",
  "contents",
  "flow-root",
  "hidden",
]);

function splitVariant(token: string): { variant: string; base: string } {
  const index = token.lastIndexOf(":");
  if (index === -1) return { variant: "", base: token };
  return { variant: token.slice(0, index + 1), base: token.slice(index + 1) };
}

/**
 * Utility-group key for one Tailwind token. Tokens that set the same CSS
 * property share a key (e.g. `rounded-xl`/`rounded-lg`, `text-sm`/`text-base`,
 * `border-red-300`/`border-slate-200`), while independent axes stay apart
 * (text-size vs text-color, px-* vs py-*, border-width vs border-color,
 * base vs focus:/hover:-prefixed). Unknown tokens fall back to their first
 * dash segment (`min-w`/`max-h` keep two segments).
 */
function familyOf(base: string): string {
  if (
    base === "border" ||
    /^border-(0|2|4|8)$/.test(base) ||
    /^border-[xytrblse](-(0|2|4|8))?$/.test(base)
  ) {
    return "border-width";
  }
  if (base.startsWith("border-")) return "border-color";
  if (base === "rounded" || base.startsWith("rounded-")) return "rounded";
  if (base === "ring" || /^ring-(0|1|2|4|8)$/.test(base)) return "ring-width";
  if (base === "ring-inset") return "ring-inset";
  if (base.startsWith("ring-")) return "ring-color";
  if (base === "outline" || base.startsWith("outline-")) return "outline";
  if (base === "flex") return "display";
  if (base.startsWith("flex-")) return "flex";
  if (DISPLAY_TOKENS.has(base)) return "display";
  if (base.startsWith("text-")) {
    return TEXT_SIZES.has(base.slice("text-".length)) ? "text-size" : "text-color";
  }
  const segments = base.split("-");
  if (
    (segments[0] === "min" || segments[0] === "max") &&
    (segments[1] === "w" || segments[1] === "h")
  ) {
    return `${segments[0]}-${segments[1]}`;
  }
  return segments[0];
}

function groupKeyOf(token: string): string {
  const { variant, base } = splitVariant(token);
  return `${variant}${familyOf(base)}`;
}

/**
 * Deterministic class merge: every override token wins its utility group,
 * non-conflicting preset tokens are kept. Unlike `override ?? preset`, a
 * caller-supplied error chain (e.g. `border-red-300 ... focus:ring-red-100`)
 * recolors the field without dropping the preset layout tokens.
 */
export function mergeClasses(preset: string, override?: string): string {
  if (override === undefined) return preset;
  const presetTokens = preset.split(/\s+/).filter(Boolean);
  const overrideTokens = override.split(/\s+/).filter(Boolean);
  const overrideGroups = new Set(overrideTokens.map(groupKeyOf));
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const token of [...presetTokens.filter((t) => !overrideGroups.has(groupKeyOf(t))), ...overrideTokens]) {
    if (!seen.has(token)) {
      seen.add(token);
      merged.push(token);
    }
  }
  return merged.join(" ");
}

export type FieldOption = {
  value: string;
  label: string;
};

type FieldBase = {
  label?: string;
  hint?: string;
  /** Field-level error. Renders a `role="alert"` message and wires a11y ids. */
  error?: string;
  size?: FieldSize;
  labelClassName?: string;
};

function useFieldIds(idProp: string | undefined, hint: string | undefined, error: string | undefined) {
  const autoId = useId();
  const inputId = idProp ?? `${autoId}-field`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  return { inputId, hintId, errorId };
}

function describeIds(
  propValue: string | undefined,
  hintId: string | undefined,
  errorId: string | undefined,
): string | undefined {
  const ids = [propValue, hintId, errorId].filter((part): part is string => Boolean(part));
  return ids.length > 0 ? ids.join(" ") : undefined;
}

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> &
  FieldBase & {
    /**
     * Trailing element rendered beside the input, e.g. a File upload
     * button. The form owns the upload behavior; the field only
     * provides the slot.
     */
    action?: ReactNode;
  };

export function TextField({
  label,
  hint,
  error,
  action,
  size = "md",
  labelClassName,
  className,
  id: idProp,
  "aria-describedby": ariaDescribedByProp,
  "aria-invalid": ariaInvalidProp,
  ...inputProps
}: TextFieldProps) {
  const { inputId, hintId, errorId } = useFieldIds(idProp, hint, error);
  return (
    <label className="block" htmlFor={inputId}>
      {label ? <span className={mergeClasses(sizeLabelClass[size], labelClassName)}>{label}</span> : null}
      <div className={action ? "flex gap-2" : undefined}>
        <input
          {...inputProps}
          id={inputId}
          className={mergeClasses(sizeInputClass[size], className)}
          aria-invalid={error ? true : ariaInvalidProp}
          aria-describedby={describeIds(ariaDescribedByProp, hintId, errorId)}
        />
        {action}
      </div>
      {hint ? <span id={hintId} className="mt-2 block text-xs text-slate-500">{hint}</span> : null}
      {error ? <span id={errorId} role="alert" className="mt-2 block text-sm text-red-600">{error}</span> : null}
    </label>
  );
}

export type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> & FieldBase;

export function TextAreaField({
  label,
  hint,
  error,
  size = "md",
  labelClassName,
  className,
  id: idProp,
  "aria-describedby": ariaDescribedByProp,
  "aria-invalid": ariaInvalidProp,
  ...textareaProps
}: TextAreaFieldProps) {
  const { inputId, hintId, errorId } = useFieldIds(idProp, hint, error);
  return (
    <label className="block" htmlFor={inputId}>
      {label ? <span className={mergeClasses(sizeLabelClass[size], labelClassName)}>{label}</span> : null}
      <textarea
        {...textareaProps}
        id={inputId}
        className={mergeClasses(sizeInputClass[size], className)}
        aria-invalid={error ? true : ariaInvalidProp}
        aria-describedby={describeIds(ariaDescribedByProp, hintId, errorId)}
      />
      {hint ? <span id={hintId} className="mt-2 block text-xs text-slate-500">{hint}</span> : null}
      {error ? <span id={errorId} role="alert" className="mt-2 block text-sm text-red-600">{error}</span> : null}
    </label>
  );
}

export type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> &
  FieldBase & {
    options: FieldOption[];
    /** First-option label for the empty value. Omitted when undefined. */
    placeholder?: string;
  };

export function SelectField({
  label,
  hint,
  error,
  size = "md",
  labelClassName,
  className,
  options,
  placeholder,
  id: idProp,
  "aria-describedby": ariaDescribedByProp,
  "aria-invalid": ariaInvalidProp,
  ...selectProps
}: SelectFieldProps) {
  const { inputId, hintId, errorId } = useFieldIds(idProp, hint, error);
  return (
    <label className="block" htmlFor={inputId}>
      {label ? <span className={mergeClasses(sizeLabelClass[size], labelClassName)}>{label}</span> : null}
      <select
        {...selectProps}
        id={inputId}
        className={mergeClasses(sizeInputClass[size], className)}
        aria-invalid={error ? true : ariaInvalidProp}
        aria-describedby={describeIds(ariaDescribedByProp, hintId, errorId)}
      >
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <span id={hintId} className="mt-2 block text-xs text-slate-500">{hint}</span> : null}
      {error ? <span id={errorId} role="alert" className="mt-2 block text-sm text-red-600">{error}</span> : null}
    </label>
  );
}

export type DateFieldProps = Omit<TextFieldProps, "type">;

export function DateField(props: DateFieldProps) {
  return <TextField {...props} type="date" />;
}

export function DateTimeField(props: DateFieldProps) {
  return <TextField {...props} type="datetime-local" />;
}
