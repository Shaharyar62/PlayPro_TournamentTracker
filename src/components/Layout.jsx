import React from "react";
import { Outlet } from "react-router-dom";
import { useTournamentImages } from "../context/TournamentImagesContext";

export default function Layout({}) {
  const images = useTournamentImages();
  return (
    <div
      style={{ backgroundImage: `url(${images.bg})` }}
      className="bg-cover bg-center main-body"
    >
      <Outlet />
    </div>
  );
}
