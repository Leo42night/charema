import { RouterProvider, createBrowserRouter, Outlet } from "react-router-dom";

import Navbar from "@/components/Navbar";
import ChatbotPage from "@/pages/ChatbotPage";
import AboutPage from "@/pages/AboutPage";

import { useViewportHeight } from "@/hooks/useViewportHeight";
import useVersionLocalStorage from "./hooks/useVersionLocalStorage";

function Layout() {
  return (
    <div
      className="flex flex-col bg-neo-bg dark:bg-zinc-950 overflow-hidden"
      style={{
        height: "calc(var(--vh) * 100)",
      }}
    >
      <Navbar />

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <ChatbotPage />,
      },
      {
        path: "about",
        element: <AboutPage />,
      },
    ],
  },
]);

export default function App() {
  useVersionLocalStorage();
  useViewportHeight();

  return <RouterProvider router={router} />;
}