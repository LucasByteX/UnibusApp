import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './src/firebaseConnection';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

  const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
  if (!firebaseUser) {
    setUsuario(null);
    return;
  }
  try {
    const snap = await getDoc(doc(db, 'Users', firebaseUser.uid));
    if (snap.exists()) {
      const d = snap.data();
      setUsuario({
        uid: firebaseUser.uid,
        nome:        d.nome        || d.Nome        || '',
        email:       d.email       || d.Email       || '',
        cargo:       d.cargo       || d.Cargo       || 'Membro',
        cpf:         d.cpf         || d.CPF         || '',
        status:      d.status      || 'ativo',
        instituicao: d.instituicao || d.Universidade || '',
        curso:       d.curso       || d.Curso       || '',
        matricula:   String(d.matricula || d.Matricula || ''),
        criadoEm:    d.criadoEm    || '',
      });
    } else {
      setUsuario(null);
      await auth.signOut();
    }
  } catch(e) {
    console.log('Erro ao buscar usuário:', e);
    // Mantém na tela de loading por mais 3s antes de deslogar
    setTimeout(() => setUsuario(null), 3000);
  }
});

  const [usuario, setUsuario] = useState(undefined); // undefined = ainda carregando
  // usuario = null → não logado
  // usuario = { uid, nome, email, cargo, status, ... } → logado

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUsuario(null);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'Users', firebaseUser.uid));
        if (snap.exists()) {
          setUsuario({ uid: firebaseUser.uid, ...snap.data() });
        } else {
          setUsuario(null);
          await auth.signOut();
        }
      } catch {
        setUsuario(null);
      }
    });
    return unsub;
  }, []);

  function atualizarUsuario(dados) {
    setUsuario(prev => ({ ...prev, ...dados }));
  }

  return (
    <AuthContext.Provider value={{ usuario, atualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Níveis de permissão
export function temPermissao(cargo, nivelMinimo) {
  const niveis = { Membro: 0, Motorista: 1, Comissao: 2, Administrador: 3 };
  return (niveis[cargo] ?? 0) >= (niveis[nivelMinimo] ?? 0);
}
