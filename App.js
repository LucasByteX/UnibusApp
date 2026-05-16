/**
 * App.js — Ponto de entrada do aplicativo
 *
 * Estrutura:
 *   <AuthProvider>        → contexto global do usuário logado
 *     <AppNavigator />    → decide qual stack mostrar (Auth ou App)
 *   </AuthProvider>
 *
 * O AppNavigator já contém o <NavigationContainer>.
 */

import React from 'react';
import { AuthProvider } from './AuthContext';
import AppNavigator from './AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}