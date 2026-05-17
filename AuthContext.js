import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './src/firebaseConnection';

const AuthContext = createContext(null);

// Tenta buscar o documento do usuário até 5 vezes com intervalo crescente.
// Necessário porque o onAuthStateChanged pode disparar antes do setDoc
// do cadastro propagar no Firestore.
async function buscarUsuarioComRetry(uid, tentativas = 5, intervaloMs = 800) {
  for (let i = 0; i < tentativas; i++) {
    const snap = await getDoc(doc(db, 'Users', uid));
    if (snap.exists()) return snap;
    if (i < tentativas - 1) {
      await new Promise(res => setTimeout(res, intervaloMs * (i + 1)));
    }
  }
  return null;
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUsuario(null);
        return;
      }
      try {
        const snap = await buscarUsuarioComRetry(firebaseUser.uid);
        if (snap) {
          const d = snap.data();
          setUsuario({
            uid:         firebaseUser.uid,
            nome:        d.nome        || d.Nome        || '',
            email:       d.email       || d.Email       || '',
            cargo:       d.cargo       || d.Cargo       || 'Membro',
            cpf:         d.cpf         || d.CPF         || '',
            status:      (d.status     || 'ativo').toLowerCase(),
            instituicao: d.instituicao || d.Universidade || '',
            curso:       d.curso       || d.Curso       || '',
            matricula:   String(d.matricula || d.Matricula || ''),
            criadoEm:    d.criadoEm    || '',
          });
        } else {
          // Documento realmente não existe após várias tentativas
          setUsuario(null);
          await auth.signOut();
        }
      } catch (e) {
        console.log('Erro ao buscar usuário:', e);
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

export function temPermissao(cargo, nivelMinimo) {
  const niveis = { Membro: 0, Motorista: 1, Comissao: 2, Administrador: 3 };
  return (niveis[cargo] ?? 0) >= (niveis[nivelMinimo] ?? 0);
}