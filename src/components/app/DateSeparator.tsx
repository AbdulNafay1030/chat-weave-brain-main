import { format, isToday, isYesterday } from 'date-fns';

interface DateSeparatorProps {
  date: Date;
}

const DateSeparator = ({ date }: DateSeparatorProps) => {
  const getDateLabel = (date: Date): string => {
    if (isToday(date)) {
      return 'Today';
    }
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    return format(date, 'MMMM d, yyyy');
  };

  return (
    <div className="flex items-center justify-center my-4">
      <div className="px-3 py-1 rounded-lg bg-muted/80 text-muted-foreground text-xs font-medium shadow-sm">
        {getDateLabel(date)}
      </div>
    </div>
  );
};

export default DateSeparator;
