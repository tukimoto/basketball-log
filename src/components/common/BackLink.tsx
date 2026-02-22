import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface BackLinkProps {
  to: string;
  label?: string;
}

export default function BackLink({ to, label = "戻る" }: BackLinkProps) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors"
    >
      <ArrowLeft size={16} />
      {label}
    </Link>
  );
}
