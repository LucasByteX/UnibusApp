/**
 * AppNavigator.js
 * Raiz da navegação. Lê o AuthContext e decide qual stack exibir.
 * Coloque este componente dentro de <AuthProvider> no seu App.js.
 *
 * Estrutura de navegação:
 *   Auth Stack  → Login, Cadastro
 *   App Stack   → Menu (bottom tabs: Rotas, Usuarios*, Perfil)
 *
 * (*) Usuarios só aparece para Motorista, Comissao e Administrador
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth, temPermissao } from './AuthContext';
import Login    from './src/pages/Login';
import Cadastro from './src/pages/Cadastro';
import Rotas    from './src/pages/Rotas';       // tela de viagens (index.js renomeado)
import Usuarios from './src/pages/Usuarios';
import Perfil   from './src/pages/Perfil';

// ─── PALETA AREIA-PB ─────────────────────────────────────────────────────────
const C = {
  bgProfundo: '#0b110d',
  bgCard:     '#111a14',
  bordaSutil: '#243d2a',
  verde:      '#3d8b5c',
  textoClaro: '#dfe8da',
  textoSuave: '#3d5c43',
  ocre:       '#d4872f',
};

const AuthStack = createNativeStackNavigator();
const Tab       = createBottomTabNavigator();

// ─── LOADING ──────────────────────────────────────────────────────────────────
function Carregando() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={C.verde} />
    </View>
  );
}

// ─── BOTTOM TABS ──────────────────────────────────────────────────────────────
function MenuTabs() {
  const { usuario } = useAuth();
  const podeVerUsuarios = temPermissao(usuario?.cargo, 'Motorista');
  const insets = useSafeAreaInsets();

  // Altura total = conteúdo (48px) + padding inferior respeitando a barra do sistema
  const tabBarHeight = 52 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.bgCard,
          borderTopColor:  C.bordaSutil,
          borderTopWidth:  1,
          height:          tabBarHeight,
          paddingBottom:   insets.bottom > 0 ? insets.bottom : 8,
          paddingTop:      6,
        },
        tabBarActiveTintColor:   C.verde,
        tabBarInactiveTintColor: C.textoSuave,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
      }}
    >
      <Tab.Screen
        name="Rotas"
        component={Rotas}
        options={{
          tabBarLabel: 'Viagens',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bus-multiple" color={color} size={size} />
          ),
        }}
      />

      {podeVerUsuarios && (
        <Tab.Screen
          name="Usuarios"
          component={Usuarios}
          options={{
            tabBarLabel: 'Usuários',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="account-group-outline" color={color} size={size} />
            ),
          }}
        />
      )}

      <Tab.Screen
        name="Perfil"
        component={Perfil}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── NAVEGADOR RAIZ ───────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { usuario } = useAuth();

  // Ainda verificando auth state
  if (usuario === undefined) return <Carregando />;

  return (
    <NavigationContainer>
      {usuario && usuario.status === 'ativo' ? (
        // Usuário logado e aprovado → app principal
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Menu" component={MenuTabs} />
        </AuthStack.Navigator>
      ) : (
        // Não logado ou em análise/banido → auth
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login"    component={Login} />
          <AuthStack.Screen name="Cadastro" component={Cadastro} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: C.bgProfundo,
    justifyContent: 'center',
    alignItems: 'center',
  },
});