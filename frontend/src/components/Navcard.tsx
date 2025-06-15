import { Link } from "react-router-dom";

interface NavCardProps {
  icon: string;
  label: string;
  href: string;
}

const NavCard: React.FC<NavCardProps> = ({ icon, label, href }) => (
  <Link 
  to={href} className="block bg-white p-4 rounded-lg shadow text-neutral-600 hover:bg-rose-100">
    {icon} {label}
  </Link>
);

export default NavCard;