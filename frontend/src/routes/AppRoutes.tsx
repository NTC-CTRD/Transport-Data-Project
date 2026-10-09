import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Corridors from "../pages/Corridors";
import Observations from "../pages/Observations";
import Analytics from "../pages/Analytics";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Login */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* Main application */}
        <Route
          path="/"
          element={<DashboardLayout />}
        >

          {/* Dashboard */}
          <Route
            index
            element={<Dashboard />}
          />

          {/* Projects */}
          {/* We will add this when Projects.tsx is ready */}

          {/* Corridors */}
          <Route
            path="corridors"
            element={<Corridors />}
          />

          {/* Traffic Observations */}
          <Route
            path="observations"
            element={<Observations />}
          />

          {/* Analytics */}
          <Route
            path="analytics"
            element={<Analytics />}
          />

        </Route>

        {/* Unknown route */}
        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}