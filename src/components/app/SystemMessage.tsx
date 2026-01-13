import { motion } from 'framer-motion';

interface SystemMessageProps {
  message: string;
}

const SystemMessage = ({ message }: SystemMessageProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-center py-2"
    >
      <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-muted/60 shadow-sm">
        <span className="text-xs text-muted-foreground">{message}</span>
      </div>
    </motion.div>
  );
};

export default SystemMessage;
