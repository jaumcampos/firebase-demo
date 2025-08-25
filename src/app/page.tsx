"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  connectFirestoreEmulator,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User,
  connectAuthEmulator,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Configuração do emulator (apenas em desenvolvimento)
if (typeof window !== "undefined" && window.location.hostname === "localhost") {
  // Conectar aos emulators apenas se estivermos em localhost
  try {
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    console.log("Conectado aos emulators do Firebase");
  } catch (error) {
    console.log("Emulators já conectados ou não disponíveis");
  }
}

interface FormData {
  nome: string;
  idade: number;
  cidade: string;
  profissao: string;
  interesse: string;
  comentarios: string;
}

interface SavedDocument extends FormData {
  id: string;
  userId: string;
  createdAt: Timestamp;
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Estados para o formulário
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    idade: 0,
    cidade: "",
    profissao: "",
    interesse: "",
    comentarios: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [savedDocuments, setSavedDocuments] = useState<SavedDocument[]>([]);
  const [showDocuments, setShowDocuments] = useState(false);

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

  const handleLogin = async (e: React.FormEvent) => {
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

  const handleRegister = async (e: React.FormEvent) => {
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
      setShowForm(false);
      setShowDocuments(false);
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

  // Função para salvar no Firestore
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    clearMessages();
    setSubmitting(true);

    try {
      const docData = {
        ...formData,
        userId: user.uid,
        userEmail: user.email,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, "formularios"), docData);
      console.log("Documento salvo com ID: ", docRef.id);

      setSuccess("Formulário salvo com sucesso!");

      // Limpar formulário
      setFormData({
        nome: "",
        idade: 0,
        cidade: "",
        profissao: "",
        interesse: "",
        comentarios: "",
      });

      setShowForm(false);
    } catch (error: any) {
      console.error("Erro ao salvar documento: ", error);
      setError("Erro ao salvar formulário: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Função para carregar documentos salvos
  const loadUserDocuments = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Query simplificada - primeiro busca todos do usuário
      const userQuery = query(
        collection(db, "formularios"),
        where("userId", "==", user.uid)
      );

      const querySnapshot = await getDocs(userQuery);
      const documents: SavedDocument[] = [];

      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...(doc.data() as any),
        });
      });

      // Ordenar no lado do cliente por createdAt (mais recente primeiro)
      documents.sort((a, b) => {
        const aTime = a.createdAt?.toMillis() || 0;
        const bTime = b.createdAt?.toMillis() || 0;
        return bTime - aTime;
      });

      setSavedDocuments(documents);
      setShowDocuments(true);
      console.log(`Carregados ${documents.length} documentos`);
    } catch (error: any) {
      console.error("Erro ao carregar documentos: ", error);
      setError("Erro ao carregar documentos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "idade" ? parseInt(value) || 0 : value,
    }));
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
    if (showForm) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
          <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Formulário de Cadastro
              </h2>
              <p className="text-gray-600 mt-2">
                Preencha as informações abaixo
              </p>
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

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="nome"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nome Completo
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="idade"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Idade
                </label>
                <input
                  type="number"
                  id="idade"
                  name="idade"
                  value={formData.idade || ""}
                  onChange={handleInputChange}
                  min="1"
                  max="120"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="cidade"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Cidade
                </label>
                <input
                  type="text"
                  id="cidade"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="profissao"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Profissão
                </label>
                <input
                  type="text"
                  id="profissao"
                  name="profissao"
                  value={formData.profissao}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="interesse"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Área de Interesse
                </label>
                <select
                  id="interesse"
                  name="interesse"
                  value={formData.interesse}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione uma opção</option>
                  <option value="tecnologia">Tecnologia</option>
                  <option value="saude">Saúde</option>
                  <option value="educacao">Educação</option>
                  <option value="negocios">Negócios</option>
                  <option value="arte">Arte e Cultura</option>
                  <option value="esportes">Esportes</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="comentarios"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Comentários Adicionais
                </label>
                <textarea
                  id="comentarios"
                  name="comentarios"
                  value={formData.comentarios}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Deixe seus comentários aqui..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Salvando..." : "Salvar Formulário"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    if (showDocuments) {
      return (
        <div className="min-h-screen bg-gray-100 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Meus Formulários Salvos
                </h2>
                <p className="text-gray-600 mt-2">
                  Visualize todos os formulários que você preencheu
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <button
                  onClick={() => setShowDocuments(false)}
                  className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200"
                >
                  ← Voltar ao Menu
                </button>
              </div>

              {savedDocuments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum formulário encontrado.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {savedDocuments.map((doc, index) => (
                    <div
                      key={doc.id}
                      className="border border-gray-200 rounded-lg p-6"
                    >
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Formulário #{index + 1}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Criado em:{" "}
                          {doc.createdAt?.toDate().toLocaleString("pt-BR")}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <strong>Nome:</strong> {doc.nome}
                        </div>
                        <div>
                          <strong>Idade:</strong> {doc.idade} anos
                        </div>
                        <div>
                          <strong>Cidade:</strong> {doc.cidade}
                        </div>
                        <div>
                          <strong>Profissão:</strong> {doc.profissao}
                        </div>
                        <div>
                          <strong>Área de Interesse:</strong> {doc.interesse}
                        </div>
                      </div>

                      {doc.comentarios && (
                        <div className="mt-4">
                          <strong>Comentários:</strong>
                          <p className="mt-1 text-gray-700">
                            {doc.comentarios}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

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
              onClick={() => setShowForm(true)}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition duration-200"
            >
              Preencher Formulário
            </button>

            <button
              onClick={loadUserDocuments}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-200"
            >
              Ver Formulários Salvos
            </button>

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
