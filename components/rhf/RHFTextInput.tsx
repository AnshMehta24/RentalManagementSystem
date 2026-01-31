import { Control, Controller, FieldValues, Path } from "react-hook-form";

interface RHFInputProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  error?: string;
}

export const RHFTextInput = <T extends FieldValues>({
  name,
  control,
  label,
  error,
  ...rest
}: RHFInputProps<T> & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-sm font-medium">{label}</label>}
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <input
          {...field}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          {...rest}
        />
      )}
    />
    {error && <span className="text-xs text-destructive">{error}</span>}
  </div>
);

