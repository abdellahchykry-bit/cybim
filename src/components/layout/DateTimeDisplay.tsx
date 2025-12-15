import { useApp } from '@/contexts/AppContext';

export function DateTimeDisplay() {
  const { currentTime } = useApp();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="text-right">
      <div className="font-display text-3xl font-bold text-primary">
        {formatTime(currentTime)}
      </div>
      <div className="text-sm text-muted-foreground">
        {formatDate(currentTime)}
      </div>
    </div>
  );
}
