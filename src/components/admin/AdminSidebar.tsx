import { NavLink, Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  Calendar, 
  HelpCircle, 
  Star, 
  BarChart3, 
  Settings,
  LogOut,
  Wrench,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const navItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Bookings", url: "/admin/bookings", icon: Calendar },
  { title: "Services", url: "/admin/services", icon: Wrench },
  { title: "Technicians", url: "/admin/technicians", icon: HelpCircle },
  { title: "Ratings", url: "/admin/ratings", icon: Star },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <aside className="w-64 bg-[hsl(var(--sidebar-bg))] border-r border-border flex flex-col">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-primary">Admin Panel</h2>
        <Link 
          to="/" 
          className="flex items-center gap-2 mt-3 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/admin"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full justify-start gap-3"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
