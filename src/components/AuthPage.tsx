import React, { useState } from 'react';
import { Bot, Loader2, ArrowRight, ShieldCheck, Mail, Lock } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

const authMessages: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/user-disabled': 'Esta conta foi desativada.',
  'auth/email-already-in-use': 'Já existe uma conta com este e-mail. Entre ou recupere a senha.',
  'auth/weak-password': 'Escolha uma senha que atenda aos requisitos do Firebase.',
  'auth/invalid-email': 'Informe um e-mail válido.',
  'auth/network-request-failed': 'Falha de conexão. Confira sua internet e tente novamente.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
};

function getAuthMessage(error: unknown, fallback: string): string {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  return authMessages[code] || fallback;
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setNotice('');
    setErrorMessage('');
    const address = email.trim();
    if (!address || !password) {
      setErrorMessage('Informe seu e-mail e sua senha.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, address, password);
      } else {
        await createUserWithEmailAndPassword(auth, address, password);
      }
    } catch (error) {
      setErrorMessage(getAuthMessage(error, 'Não foi possível autenticar. Tente novamente.'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const address = email.trim();
    if (loading) return;
    setNotice('');
    setErrorMessage('');
    if (!address) {
      setErrorMessage('Informe seu e-mail para recuperar a senha.');
      return;
    }

    setLoading(true);
    const confirmation = 'Se houver uma conta com esse e-mail, você receberá um link para redefinir a senha.';
    try {
      await sendPasswordResetEmail(auth, address);
      setNotice(confirmation);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/user-not-found') {
        setNotice(confirmation);
      } else {
        setErrorMessage(getAuthMessage(error, 'Não foi possível solicitar a recuperação. Tente novamente.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[500px] flex items-center justify-center py-10 px-4">
      <div className="max-w-md w-full bg-[#121214]/30 border border-gray-900 rounded-3xl p-6 sm:p-10 space-y-8 relative overflow-hidden text-left shadow-2xl">
        {/* Glow decorative corner */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full" />

        <div className="space-y-2 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-950 border border-gray-800 flex items-center justify-center text-emerald-400 mx-auto">
            <Bot className="w-6 h-6" />
          </div>
          <h3 className="text-white text-xl font-bold font-display tracking-tight">
            {isLogin ? "Acessar Atlas Intelligence" : "Criar Conta de Consultor"}
          </h3>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            {isLogin 
              ? "Insira suas credenciais para gerenciar auditorias, CRM de leads e utilizar o Copilot." 
              : "Cadastre-se para liberar relatórios executivos ilimitados e conectar seu WhatsApp."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-mono font-bold text-gray-500">Nome Completo</label>
              <input
                type="text"
                placeholder="Ex: João da Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-950 text-white border border-gray-850 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#E2B755]"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="portal-email" className="block text-[10px] uppercase font-mono font-bold text-gray-500">E-mail Corporativo</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
              <input
                type="email"
                id="portal-email"
                autoComplete="email"
                required
                placeholder="Ex: consultor@atlasdigital.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-950 text-white border border-gray-850 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-[#E2B755]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="portal-password" className="block text-[10px] uppercase font-mono font-bold text-gray-500">Senha</label>
              {isLogin && (
                <button 
                  type="button" 
                  onClick={handlePasswordReset}
                  disabled={loading}
                  className="text-[9px] font-mono text-gray-500 hover:text-white"
                >
                  Esqueceu?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
              <input
                type="password"
                id="portal-password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-950 text-white border border-gray-850 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-[#E2B755]"
              />
            </div>
          </div>

          {errorMessage && <p role="alert" className="text-xs text-red-400">{errorMessage}</p>}
          {notice && <p role="status" className="text-xs text-emerald-400">{notice}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-white hover:bg-gray-200 text-black font-semibold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : (
              <>
                {isLogin ? "Acessar Control Center" : "Criar Minha Conta"}
                <ArrowRight className="w-4 h-4 text-black" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-gray-900/60 text-center text-xs text-gray-500">
          <span>{isLogin ? "Não possui uma licença?" : "Já possui cadastro?"}</span>{' '}
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMessage('');
              setNotice('');
            }}
            className="text-white hover:text-[#E2B755] font-semibold"
          >
            {isLogin ? "Cadastre-se Grátis" : "Acessar Portal"}
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[9px] font-mono text-gray-600">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Autenticação SSL Criptografada</span>
        </div>
      </div>
    </div>
  );
}
