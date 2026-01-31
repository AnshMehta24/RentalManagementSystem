import { Control, Controller, FieldValues, Path } from "react-hook-form";

interface RHFCheckboxProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  error?: string;
}

export const RHFCheckbox = <T extends FieldValues>({
  name,
  control,
  label,
  error,
  ...rest
}: RHFCheckboxProps<T> & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="flex flex-col gap-1.5 w-full">
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            {...field}
            checked={field.value}
            className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...rest}
          />
          {label && (
            <label className="text-sm font-medium cursor-pointer" htmlFor={rest.id}>
              {label}
            </label>
          )}
        </div>
      )}
    />
    {error && <span className="text-xs text-destructive">{error}</span>}
  </div>
);

