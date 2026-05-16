/**
 * Perfil.js
 * Exibe os dados do usuário logado e botão de logout.
 */

import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, StatusBar, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { auth } from '../../firebaseConnection';
import { useAuth } from '../../../AuthContext';

// ─── PALETA AREIA-PB ─────────────────────────────────────────────────────────
const C = {
  bgProfundo: '#0b110d', bgCard: '#111a14', bgSutil: '#192b1e',
  bordaSutil: '#243d2a', verde: '#3d8b5c', verdeClaro: '#52b876',
  terracota: '#c2622a', ocre: '#d4872f',
  textoClaro: '#dfe8da', textoMedio: '#7a9e82', textoSuave: '#3d5c43',
  erro: '#c0392b',
};

const CARGO_CONFIG = {
  Administrador: { cor: C.ocre,       icone: 'crown-outline',            desc: 'Acesso total ao sistema'        },
  Comissao:      { cor: C.verde,      icone: 'shield-check-outline',     desc: 'Gerencia viagens e usuários'    },
  Motorista:     { cor: C.verdeClaro, icone: 'steering',                 desc: 'Conduz e gerencia viagens'      },
  Membro:        { cor: C.textoMedio, icone: 'account-outline',          desc: 'Passageiro do transporte'       },
};

function InfoLinha({ icone, label, valor }) {
  if (!valor) return null;
  return (
    <View style={linha.wrapper}>
      <View style={linha.iconeBox}>
        <MaterialCommunityIcons name={icone} size={16} color={C.verde} />
      </View>
      <View style={linha.textos}>
        <Text style={linha.label}>{label}</Text>
        <Text style={linha.valor}>{valor}</Text>
      </View>
    </View>
  );
}

const linha = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconeBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.bgSutil, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.bordaSutil,
  },
  textos: { flex: 1 },
  label:  { fontSize: 10, fontWeight: '700', color: C.textoSuave, letterSpacing: 0.8, textTransform: 'uppercase' },
  valor:  { fontSize: 14, color: C.textoClaro, fontWeight: '500', marginTop: 1 },
});

export default function Perfil() {
  const { usuario } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 22, stiffness: 160, useNativeDriver: true }),
    ]).start();
  }, []);

  function confirmarLogout() {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair? Você precisará fazer login novamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: () => signOut(auth) },
      ]
    );
  }

  if (!usuario) return null;

  const cargo = usuario.cargo || 'Membro';
  const cfg   = CARGO_CONFIG[cargo] || CARGO_CONFIG.Membro;
  const inicial = usuario.nome?.charAt(0)?.toUpperCase() || '?';

  // Formata data de criação
  let membroDesde = '';
  if (usuario.criadoEm) {
    try {
      const d = new Date(usuario.criadoEm);
      membroDesde = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {}
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.bgProfundo} />
      <View style={styles.manchaVerde} />
      <View style={styles.manchaOcre}  />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Avatar + nome */}
          <View style={styles.topoArea}>
            <View style={[styles.avatarBg, { borderColor: `${cfg.cor}66` }]}>
              <Text style={[styles.avatarLetra, { color: cfg.cor }]}>{inicial}</Text>
            </View>
            <Text style={styles.nomeTexto}>{usuario.nome}</Text>
            <Text style={styles.emailTexto}>{usuario.email}</Text>

            {/* Badge de cargo */}
            <View style={[styles.cargoBadge, { backgroundColor: `${cfg.cor}18`, borderColor: `${cfg.cor}55` }]}>
              <MaterialCommunityIcons name={cfg.icone} size={14} color={cfg.cor} />
              <Text style={[styles.cargoTexto, { color: cfg.cor }]}>{cargo}</Text>
            </View>
            <Text style={styles.cargoDesc}>{cfg.desc}</Text>
          </View>

          {/* Divisor folha */}
          <View style={styles.dividerFolha}>
            <View style={styles.divLinha} />
            <MaterialCommunityIcons name="leaf" size={13} color={C.verdeClaro} style={{ marginHorizontal: 8 }} />
            <View style={styles.divLinha} />
          </View>

          {/* Dados pessoais */}
          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>
              <MaterialCommunityIcons name="account-outline" size={13} color={C.ocre} />
              {'  '}Dados Pessoais
            </Text>
            <InfoLinha icone="card-account-details-outline" label="CPF"          valor={usuario.cpf ? usuario.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : ''} />
            {membroDesde && (
              <InfoLinha icone="calendar-check-outline" label="Membro desde" valor={membroDesde} />
            )}
          </View>

          {/* Dados acadêmicos (se não for motorista) */}
          {cargo !== 'Motorista' && (usuario.instituicao || usuario.curso || usuario.matricula) && (
            <>
              <View style={styles.divisor} />
              <View style={styles.secao}>
                <Text style={styles.secaoTitulo}>
                  <MaterialCommunityIcons name="school-outline" size={13} color={C.ocre} />
                  {'  '}Dados Acadêmicos
                </Text>
                <InfoLinha icone="domain"        label="Instituição" valor={usuario.instituicao} />
                <InfoLinha icone="book-outline"  label="Curso"       valor={usuario.curso}       />
                <InfoLinha icone="identifier"    label="Matrícula"   valor={usuario.matricula}   />
              </View>
            </>
          )}

          {/* Status da conta */}
          <View style={styles.divisor} />
          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>
              <MaterialCommunityIcons name="shield-outline" size={13} color={C.ocre} />
              {'  '}Conta
            </Text>
            <View style={styles.statusCard}>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={20}
                color={C.verde}
              />
              <Text style={styles.statusTexto}>Conta ativa e aprovada</Text>
            </View>
          </View>

          {/* Botão logout */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={confirmarLogout}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="logout" size={18} color={C.erro} />
            <Text style={styles.logoutTexto}>Sair da conta</Text>
          </TouchableOpacity>

          {/* Rodapé */}
          <View style={styles.rodape}>
            <MaterialCommunityIcons name="leaf" size={12} color={C.textoSuave} />
            <Text style={styles.rodapeTexto}>Transporte Universitário · Areia-PB</Text>
          </View>

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bgProfundo },
  manchaVerde: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: C.verde, opacity: 0.05, top: -50, right: -60,
  },
  manchaOcre: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: C.terracota, opacity: 0.04, bottom: 100, left: -40,
  },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },

  // Topo
  topoArea: { alignItems: 'center', marginBottom: 24 },
  avatarBg: {
    width: 88, height: 88, borderRadius: 26,
    backgroundColor: C.bgCard, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  avatarLetra:  { fontSize: 36, fontWeight: '900' },
  nomeTexto:    { fontSize: 22, fontWeight: '900', color: C.textoClaro, textAlign: 'center', letterSpacing: -0.3 },
  emailTexto:   { fontSize: 13, color: C.textoSuave, marginTop: 4, marginBottom: 12 },
  cargoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, marginBottom: 6,
  },
  cargoTexto: { fontSize: 13, fontWeight: '800' },
  cargoDesc:  { fontSize: 12, color: C.textoSuave, textAlign: 'center' },

  // Divisor
  dividerFolha: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  divLinha:     { flex: 1, height: 1, backgroundColor: C.bordaSutil },

  // Seções
  secao: {
    backgroundColor: C.bgCard, borderRadius: 18, padding: 18,
    marginBottom: 12, borderWidth: 1, borderColor: C.bordaSutil,
  },
  secaoTitulo: {
    fontSize: 10, fontWeight: '800', color: C.ocre,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 16,
  },
  divisor: { height: 1, backgroundColor: C.bordaSutil, marginBottom: 12 },

  // Status card
  statusCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#1a3d26', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: `${C.verde}44`,
  },
  statusTexto: { fontSize: 14, color: C.verdeClaro, fontWeight: '600' },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1.5, borderColor: `${C.erro}55`, borderRadius: 14,
    paddingVertical: 14, marginTop: 8, backgroundColor: '#2a1010',
  },
  logoutTexto: { fontSize: 15, fontWeight: '700', color: C.erro },

  // Rodapé
  rodape: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 28 },
  rodapeTexto: { fontSize: 11, color: C.textoSuave },
});