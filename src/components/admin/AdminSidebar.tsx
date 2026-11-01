import { useEffect } from "react";
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

  // Admin-only: a slightly darker primary so white text on it reaches 4.5:1. The public brand blue is untouched.
  useEffect(() => {
    document.body.classList.add("admin-area");
    return () => document.body.classList.remove("admin-area");
  }, []);

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <>
    <aside className="hidden lg:flex w-64 shrink-0 bg-[hsl(var(--sidebar-bg))] border-r border-border flex-col">
      <div className="p-6">
        <h2 className="text-xl font-semibold tracking-tight text-primary">Admin Panel</h2>
        <Link 
          to="/" 
          className="flex items-center gap-2 mt-3 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <nav aria-label="Admin" className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/admin"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
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

    {/* Phones and tablets: bottom tab bar instead of the side rail */}
    <nav
      aria-label="Admin"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex border-t border-border bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
    >
      {navItems.map((item) => (
        <NavLink
          key={item.url}
          to={item.url}
          end={item.url === "/admin"}
          className={({ isActive }) =>
            `flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors duration-150 ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`
          }
        >
          <item.icon className="h-5 w-5" />
          <span className="max-w-full truncate px-0.5">{item.title}</span>
        </NavLink>
      ))}
    </nav>
    </>
  );
}
