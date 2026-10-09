import {
  FiHome,
  FiFolder,
  FiMap,
  FiMapPin,
  FiBarChart2,
  FiActivity,
} from "react-icons/fi";

import { NavLink, Outlet } from "react-router-dom";

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-slate-100">

      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col">

        {/* Header */}
        <div className="p-8 border-b border-slate-700">
          <h1 className="text-2xl font-bold tracking-wide">
            Platform
          </h1>

          <p className="text-slate-400 text-sm mt-1">
            Traffic Intelligence Platform
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-6 space-y-3">

          {/* Dashboard */}
          <SidebarItem
            to="/"
            icon={<FiHome />}
            text="Dashboard"
            end
          />

          {/* Projects */}
          <SidebarItem
            to="/projects"
            icon={<FiFolder />}
            text="Projects"
          />

          {/* Corridors */}
          <SidebarItem
            to="/corridors"
            icon={<FiMap />}
            text="Corridors"
          />

          {/* Stops */}
          <SidebarItem
            to="/stops"
            icon={<FiMapPin />}
            text="Stops"
          />

          {/* Analytics */}
          <SidebarItem
            to="/analytics"
            icon={<FiBarChart2 />}
            text="Analytics"
          />

          {/* Observations */}
          <SidebarItem
            to="/observations"
            icon={<FiActivity />}
            text="Observations"
          />

        </nav>

      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 bg-slate-50">
        <Outlet />
      </main>

    </div>
  );
}


function SidebarItem({
  to,
  icon,
  text,
  end = false,
}: {
  to: string;
  icon: React.ReactNode;
  text: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-4 rounded-xl p-3 transition ${
          isActive
            ? "bg-slate-800"
            : "hover:bg-slate-800"
        }`
      }
    >
      <div className="text-xl">
        {icon}
      </div>

      <span>{text}</span>
    </NavLink>
  );
}