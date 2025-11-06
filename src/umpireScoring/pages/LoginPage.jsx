import React from "react";
import LoginForm from "../components/LoginForm";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate("/matches");
  };

  return <LoginForm onLoginSuccess={handleLoginSuccess} />;
};

export default LoginPage;
