import { Button } from "./Button";

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  emoji = "📭",
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="mb-4 text-5xl">{emoji}</span>
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      {description && (
        <p className="mb-4 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
