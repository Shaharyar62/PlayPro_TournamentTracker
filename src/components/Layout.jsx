import React from "react";
import { Outlet } from "react-router-dom";
import { ImageConstants } from "../assets/images/ImageConstants";

export default function Layout({}) {
  return (
    <div
      style={{ backgroundImage: `url(${ImageConstants.bg})` }}
      className="bg-cover bg-center main-body"
    >
      <Outlet />
    </div>
  );
}
