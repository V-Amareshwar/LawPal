
interface IconButtonProps {
  onClick?: () => void;
  icon: JSX.Element;
  text?: string;
  className?: string;
  bordered?: boolean;
}

export function IconButton({ onClick, icon, text, className, bordered }: IconButtonProps) {
  const borderClasses = bordered ? 'border border-border-color shadow-sm hover:bg-accent' : 'hover:bg-accent';

  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 p-2 rounded-md text-sm transition-colors ${borderClasses} ${className}`}
    >
      {icon}
      {text && <span>{text}</span>}
    </button>
  );
}
