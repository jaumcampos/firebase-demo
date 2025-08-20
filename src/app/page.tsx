"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD4Ig_ZFmcCEygIbCfm3YpJq6IixKmVLj0",
  authDomain: "projeto-teste-meddeck.firebaseapp.com",
  projectId: "projeto-teste-meddeck",
  storageBucket: "projeto-teste-meddeck.firebasestorage.app",
  messagingSenderId: "899323743894",
  appId: "1:899323743894:web:4445a862307432a7dc7cb7",
  measurementId: "G-MFB8CZ2MG2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!email || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      setSuccess("Login realizado com sucesso!");
      console.log("Usuário logado:", user);
    } catch (error: any) {
      const errorCode = error.code;
      const errorMessage = error.message;

      // Personalizar mensagens de erro em português
      switch (errorCode) {
        case "auth/user-not-found":
          setError("Usuário não encontrado.");
          break;
        case "auth/wrong-password":
          setError("Senha incorreta.");
          break;
        case "auth/invalid-email":
          setError("Email inválido.");
          break;
        case "auth/too-many-requests":
          setError("Muitas tentativas. Tente novamente mais tarde.");
          break;
        default:
          setError("Erro no login: " + errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!email || !password || !confirmPassword) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      setSuccess("Conta criada com sucesso!");
      console.log("Usuário criado:", user);
    } catch (error: any) {
      const errorCode = error.code;
      const errorMessage = error.message;

      // Personalizar mensagens de erro em português
      switch (errorCode) {
        case "auth/email-already-in-use":
          setError("Este email já está em uso.");
          break;
        case "auth/invalid-email":
          setError("Email inválido.");
          break;
        case "auth/weak-password":
          setError("Senha muito fraca. Use pelo menos 6 caracteres.");
          break;
        default:
          setError("Erro ao criar conta: " + errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setSuccess("Logout realizado com sucesso!");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      clearMessages();
    } catch (error: any) {
      setError("Erro ao fazer logout: " + error.message);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    clearMessages();
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Bem-vindo!</h2>
            <p className="text-gray-600 mt-2">Você está logado como:</p>
            <p className="text-blue-600 font-semibold">{user.email}</p>
          </div>

          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold mb-2">Informações do usuário:</h3>
              <p>
                <strong>UID:</strong> {user.uid}
              </p>
              <p>
                <strong>Email verificado:</strong>{" "}
                {user.emailVerified ? "Sim" : "Não"}
              </p>
              <p>
                <strong>Criado em:</strong>{" "}
                {user.metadata?.creationTime
                  ? new Date(user.metadata.creationTime).toLocaleString("pt-BR")
                  : "N/A"}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition duration-200"
            >
              Fazer Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {isLogin ? "Fazer Login" : "Criar Conta"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isLogin ? "Entre com sua conta" : "Crie uma nova conta"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        <form
          onSubmit={isLogin ? handleLogin : handleRegister}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Senha
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Sua senha"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirmar Senha
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirme sua senha"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar Conta"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={toggleMode}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {isLogin
              ? "Não tem uma conta? Clique aqui para criar uma"
              : "Já tem uma conta? Clique aqui para fazer login"}
          </button>
        </div>
      </div>
    </div>
  );
}
