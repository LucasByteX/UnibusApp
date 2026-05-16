/**
 * Usuarios.js
 * Gerenciamento de usuários cadastrados.
 * Visível apenas para Motorista, Comissao e Administrador.
 *
 * Filtros:
 *   Cadastrados → usuários com status 'ativo' (aprovados)
 *   Análise     → aguardando aprovação
 *   Banidos     → bloqueados
 *
 * Ações por status:
 *   analise → Aprovar | Rejeitar (pode tentar de novo) | Rejeitar e Banir
 *   ativo   → Banir
 *   banido  → Desbanir
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, TextInput, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { db } from '../../firebaseConnection';
import { useAuth } from '../../../AuthContext';

// ─── PALETA AREIA-PB ─────────────────────────────────────────────────────────
const C = {
  bgProfundo: '#0b110d', bgCard: '#111a14', bgSutil: '#192b1e',
  bordaSutil: '#243d2a', verde: '#3d8b5c', verdeClaro: '#52b876',
  terracota: '#c2622a', ocre: '#d4872f',
  textoClaro: '#dfe8da', textoMedio: '#7a9e82', textoSuave: '#3d5c43',
  erro: '#c0392b',
};

const STATUS_CONFIG = {
  analise: { label: 'Em Análise', cor: C.ocre,  icone: 'clock-outline'        },
  ativo:   { label: 'Ativo',      cor: C.verde,  icone: 'check-circle-outline' },
  banido:  { label: 'Banido',     cor: C.erro,   icone: 'cancel'               },
};

const CARGOS = ['Membro', 'Motorista', 'Comissao', 'Administrador'];

// ─── FILTROS ──────────────────────────────────────────────────────────────────
// 'cadastrados' = ativos aprovados | 'analise' | 'banido'
const CARGOS_ELEVADOS = ['motorista', 'comissao', 'administrador'];

const FILTROS = [
  { key: 'membros', label: 'Membros', icone: 'account-outline'       },
  { key: 'equipe',  label: 'Equipe',  icone: 'shield-check-outline'  },
  { key: 'analise', label: 'Análise', icone: 'clock-outline'         },
  { key: 'banido',  label: 'Banidos', icone: 'cancel'                },
];

// ─── CARD DE USUÁRIO ──────────────────────────────────────────────────────────
function UsuarioCard({
  usuario, podeTudo, usuarioLogadoUid,
  onAprovar, onRejeitar, onRejeitarBanir,
  onBanir, onDesbanir, onAlterarCargo,
}) {
  const { nome, email, cargo, status, instituicao, curso, matricula, cpf } = usuario;
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.analise;
  const [expandido, setExpandido] = useState(false);

  const ehSiMesmo       = usuario.uid === usuarioLogadoUid;
  const ehAdmin         = cargo?.toLowerCase() === 'administrador';
  // Só Administrador pode agir sobre outro Administrador
  const podeAgir        = podeTudo || !ehAdmin;

  return (
    <View style={card.wrapper}>
      {/* Topo clicável */}
      <TouchableOpacity
        style={card.topo}
        onPress={() => setExpandido(!expandido)}
        activeOpacity={0.8}
      >
        <View style={[card.avatar, { backgroundColor: `${cfg.cor}22`, borderColor: `${cfg.cor}55` }]}>
          <Text style={[card.avatarTexto, { color: cfg.cor }]}>
            {nome?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>

        <View style={card.info}>
          <Text style={card.nome} numberOfLines={1}>{nome}</Text>
          <Text style={card.email} numberOfLines={1}>{email}</Text>
          <View style={card.badges}>
            <View style={[card.badge, { backgroundColor: `${cfg.cor}18`, borderColor: `${cfg.cor}44` }]}>
              <MaterialCommunityIcons name={cfg.icone} size={11} color={cfg.cor} />
              <Text style={[card.badgeTexto, { color: cfg.cor }]}>{cfg.label}</Text>
            </View>
            <View style={[card.badge, { backgroundColor: C.bgSutil, borderColor: C.bordaSutil }]}>
              <Text style={[card.badgeTexto, { color: C.textoMedio }]}>{cargo}</Text>
            </View>
          </View>
        </View>

        <MaterialCommunityIcons
          name={expandido ? 'chevron-up' : 'chevron-down'}
          size={20} color={C.textoSuave}
        />
      </TouchableOpacity>

      {/* Detalhe expandido */}
      {expandido && (
        <View style={card.detalhe}>
          <View style={card.divider} />

          {/* Dados */}
          {[
            { icon: 'card-account-details-outline', label: 'CPF',         val: podeTudo ? cpf : null },
            { icon: 'school-outline',               label: 'Instituição', val: instituicao  },
            { icon: 'book-outline',                 label: 'Curso',       val: curso        },
            { icon: 'identifier',                   label: 'Matrícula',   val: matricula    },
          ].filter(x => x.val).map(({ icon, label, val }) => (
            <View key={label} style={card.infoRow}>
              <MaterialCommunityIcons name={icon} size={14} color={C.textoSuave} />
              <Text style={card.infoLabel}>{label}:</Text>
              <Text style={card.infoVal}>{val}</Text>
            </View>
          ))}

          {/* Alterar cargo — só Administrador, e só para usuários ativos */}
          {podeTudo && status === 'ativo' && (
            <View style={card.cargoArea}>
              <Text style={card.cargoTitulo}>Cargo</Text>
              <View style={card.cargoRow}>
                {CARGOS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[card.cargoChip, cargo === c && card.cargoChipAtivo]}
                    onPress={() => onAlterarCargo(usuario.uid, c)}
                    activeOpacity={0.8}
                  >
                    <Text style={[card.cargoChipTexto, cargo === c && { color: '#fff' }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── Ações por status ── */}
          <View style={card.acoes}>

            {/* EM ANÁLISE: Aprovar | Rejeitar | Rejeitar e Banir */}
            {status === 'analise' && podeAgir && (
              <>
                <TouchableOpacity
                  style={[card.btn, card.btnAprovar]}
                  onPress={() => onAprovar(usuario.uid)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="check" size={14} color="#fff" />
                  <Text style={card.btnTexto}>Aprovar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[card.btn, card.btnRejeitar]}
                  onPress={() => onRejeitar(usuario.uid, nome)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="close" size={14} color="#fff" />
                  <Text style={card.btnTexto}>Rejeitar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[card.btn, card.btnBanir]}
                  onPress={() => onRejeitarBanir(usuario.uid, nome)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="cancel" size={14} color="#fff" />
                  <Text style={card.btnTexto}>Rejeitar e Banir</Text>
                </TouchableOpacity>
              </>
            )}

            {/* ATIVO: Banir — não aparece para si mesmo nem se não tiver permissão */}
            {status === 'ativo' && !ehSiMesmo && podeAgir && (
              <TouchableOpacity
                style={[card.btn, card.btnBanir]}
                onPress={() => onBanir(usuario.uid, nome)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="cancel" size={14} color="#fff" />
                <Text style={card.btnTexto}>Banir</Text>
              </TouchableOpacity>
            )}

            {/* BANIDO: Desbanir */}
            {status === 'banido' && podeAgir && (
              <TouchableOpacity
                style={[card.btn, card.btnAprovar]}
                onPress={() => onDesbanir(usuario.uid)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="account-reactivate-outline" size={14} color="#fff" />
                <Text style={card.btnTexto}>Desbanir</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const card = StyleSheet.create({
  wrapper: {
    backgroundColor: C.bgCard, borderRadius: 16, marginBottom: 10,
    borderWidth: 1, borderColor: C.bordaSutil, overflow: 'hidden',
  },
  topo: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarTexto: { fontSize: 18, fontWeight: '900' },
  info:        { flex: 1 },
  nome:        { fontSize: 14, fontWeight: '800', color: C.textoClaro },
  email:       { fontSize: 12, color: C.textoSuave, marginTop: 1 },
  badges:      { flexDirection: 'row', gap: 6, marginTop: 5, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1,
  },
  badgeTexto:  { fontSize: 10, fontWeight: '700' },
  detalhe:     { paddingHorizontal: 14, paddingBottom: 14 },
  divider:     { height: 1, backgroundColor: C.bordaSutil, marginBottom: 12 },
  infoRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  infoLabel:   { fontSize: 12, color: C.textoSuave, fontWeight: '600', width: 70 },
  infoVal:     { fontSize: 12, color: C.textoMedio, flex: 1 },
  cargoArea:   { marginTop: 10, marginBottom: 4 },
  cargoTitulo: { fontSize: 10, fontWeight: '800', color: C.textoSuave, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  cargoRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cargoChip: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8,
    backgroundColor: C.bgSutil, borderWidth: 1, borderColor: C.bordaSutil,
  },
  cargoChipAtivo:  { backgroundColor: C.verde, borderColor: C.verde },
  cargoChipTexto:  { fontSize: 12, fontWeight: '600', color: C.textoSuave },
  acoes:      { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  btn:        { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 9, paddingHorizontal: 13, borderRadius: 10 },
  btnAprovar: { backgroundColor: C.verde },
  btnRejeitar:{ backgroundColor: C.ocre  },
  btnBanir:   { backgroundColor: C.erro  },
  btnTexto:   { fontSize: 12, fontWeight: '700', color: '#fff' },
});

// ─── TELA PRINCIPAL ───────────────────────────────────────────────────────────
export default function Usuarios() {
  const { usuario } = useAuth();
  const podeTudo       = usuario?.cargo?.toLowerCase() === 'administrador';
  const uidLogado      = usuario?.uid ?? usuario?.id ?? null;

  const [usuarios, setUsuarios]     = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState('membros');
  const [busca, setBusca]           = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'Users'), snap => {
      const lista = snap.docs.map(d => {
        const data = d.data();
        return {
          uid: d.id,
          ...data,
          // Normaliza status e cargo para minúsculo para comparações seguras
          status: data.status?.toLowerCase() || 'analise',
          cargo:  data.cargo  || 'Membro',
        };
      });
      // Ordena: análise primeiro, depois ativos, depois banidos
      lista.sort((a, b) => {
        const ordem = { analise: 0, ativo: 1, banido: 2 };
        return (ordem[a.status] ?? 3) - (ordem[b.status] ?? 3);
      });
      setUsuarios(lista);
      setCarregando(false);
    });
    return unsub;
  }, []);

  // ── Ações ────────────────────────────────────────────────────────────────
  async function aprovar(uid) {
    try { await updateDoc(doc(db, 'Users', uid), { status: 'ativo' }); }
    catch { Alert.alert('Erro', 'Não foi possível aprovar.'); }
  }

  // Rejeitar: apaga o documento do Firestore e do CPFs
  // O usuário ainda existe no Auth, mas sem documento não consegue logar
  // e pode se cadastrar novamente (o cadastro recriará o documento)
  function rejeitar(uid, nome) {
    Alert.alert(
      'Rejeitar Cadastro',
      `Deseja rejeitar o cadastro de ${nome}?\n\nEle poderá tentar se cadastrar novamente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Rejeitar', style: 'destructive', onPress: async () => {
          try {
            await updateDoc(doc(db, 'Users', uid), { status: 'rejeitado' });
          } catch {
            Alert.alert('Erro', 'Não foi possível rejeitar.');
          }
        }},
      ]
    );
  }

  function rejeitarBanir(uid, nome) {
    Alert.alert(
      'Rejeitar e Banir',
      `Deseja rejeitar e banir ${nome}?\n\nEle não poderá acessar o app nem se cadastrar novamente com este CPF.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Rejeitar e Banir', style: 'destructive', onPress: async () => {
          try { await updateDoc(doc(db, 'Users', uid), { status: 'banido' }); }
          catch { Alert.alert('Erro', 'Não foi possível rejeitar e banir.'); }
        }},
      ]
    );
  }

  function banir(uid, nome) {
    Alert.alert(
      'Banir Usuário',
      `Deseja banir ${nome}? Ele não conseguirá mais acessar o app.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Banir', style: 'destructive', onPress: async () => {
          try { await updateDoc(doc(db, 'Users', uid), { status: 'banido' }); }
          catch { Alert.alert('Erro', 'Não foi possível banir.'); }
        }},
      ]
    );
  }

  async function desbanir(uid) {
    try { await updateDoc(doc(db, 'Users', uid), { status: 'ativo' }); }
    catch { Alert.alert('Erro', 'Não foi possível desbanir.'); }
  }

  async function alterarCargo(uid, novoCargo) {
    try { await updateDoc(doc(db, 'Users', uid), { cargo: novoCargo }); }
    catch { Alert.alert('Erro', 'Não foi possível alterar cargo.'); }
  }

  // ── Filtragem ─────────────────────────────────────────────────────────────
  function passaFiltro(u) {
    const cargoNorm = u.cargo?.toLowerCase() || '';
    if (filtro === 'membros') return u.status === 'ativo' && cargoNorm === 'membro';
    if (filtro === 'equipe')  return u.status === 'ativo' && CARGOS_ELEVADOS.includes(cargoNorm);
    if (filtro === 'analise') return u.status === 'analise';
    if (filtro === 'banido')  return u.status === 'banido';
    return false;
  }

  const usuariosFiltrados = usuarios.filter(u => {
    // Não exclui mais o próprio usuário — ele deve aparecer na lista
    const passaBusca = !busca.trim() ||
      u.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      u.email?.toLowerCase().includes(busca.toLowerCase());
    return passaFiltro(u) && passaBusca;
  });

  const cargoNorm = (u) => u.cargo?.toLowerCase() || '';
  const contadores = {
    membros: usuarios.filter(u => u.status === 'ativo'   && cargoNorm(u) === 'membro').length,
    equipe:  usuarios.filter(u => u.status === 'ativo'   && CARGOS_ELEVADOS.includes(cargoNorm(u))).length,
    analise: usuarios.filter(u => u.status === 'analise').length,
    banido:  usuarios.filter(u => u.status === 'banido').length,
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.bgProfundo} />
      <View style={styles.manchaVerde} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitulo}>Usuários</Text>
        <Text style={styles.headerSub}>
          {contadores.membros} membros · {contadores.equipe} equipe · {contadores.analise} em análise
        </Text>
      </View>

      {/* Busca */}
      <View style={styles.buscaWrapper}>
        <MaterialCommunityIcons name="magnify" size={18} color={C.textoSuave} />
        <TextInput
          style={styles.buscaInput}
          placeholder="Buscar por nome ou e-mail…"
          placeholderTextColor={C.textoSuave}
          value={busca}
          onChangeText={setBusca}
          selectionColor={C.verde}
        />
        {busca.length > 0 && (
          <TouchableOpacity onPress={() => setBusca('')}>
            <MaterialCommunityIcons name="close-circle" size={16} color={C.textoSuave} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtrosScroll}
        contentContainerStyle={styles.filtrosContent}
      >
        {FILTROS.map(f => {
          const ativo = filtro === f.key;
          const count = contadores[f.key] || 0;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filtroChip, ativo && styles.filtroChipAtivo]}
              onPress={() => setFiltro(f.key)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={f.icone}
                size={13}
                color={ativo ? '#fff' : C.textoSuave}
              />
              <Text style={[styles.filtroTexto, ativo && styles.filtroTextoAtivo]}>
                {f.label}
              </Text>
              {count > 0 && (
                <View style={[styles.filtroCount, ativo && styles.filtroCountAtivo]}>
                  <Text style={[styles.filtroCountTexto, ativo && { color: C.verde }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Lista */}
      {carregando ? (
        <View style={styles.loadingArea}>
          <ActivityIndicator size="large" color={C.verde} />
        </View>
      ) : (
        <ScrollView
          style={styles.lista}
          contentContainerStyle={styles.listaContent}
          showsVerticalScrollIndicator={false}
        >
          {usuariosFiltrados.length === 0 ? (
            <View style={styles.vazio}>
              <MaterialCommunityIcons name="account-search-outline" size={44} color={C.textoSuave} />
              <Text style={styles.vazioTexto}>
                {filtro === 'membros' ? 'Nenhum membro aprovado'
                : filtro === 'equipe'  ? 'Nenhum membro da equipe'
                : filtro === 'analise' ? 'Nenhum cadastro em análise'
                : 'Nenhum usuário banido'}
              </Text>
            </View>
          ) : (
            usuariosFiltrados.map(u => (
              <UsuarioCard
                key={u.uid}
                usuario={u}
                podeTudo={podeTudo}
                usuarioLogadoUid={uidLogado}
                onAprovar={aprovar}
                onRejeitar={rejeitar}
                onRejeitarBanir={rejeitarBanir}
                onBanir={banir}
                onDesbanir={desbanir}
                onAlterarCargo={alterarCargo}
              />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bgProfundo },
  manchaVerde: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    backgroundColor: C.verde, opacity: 0.05, top: -60, left: -60,
  },
  header:       { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12 },
  headerTitulo: { fontSize: 24, fontWeight: '900', color: C.textoClaro, letterSpacing: -0.4 },
  headerSub:    { fontSize: 12, color: C.textoSuave, marginTop: 2 },
  buscaWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: C.bgCard, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: C.bordaSutil,
  },
  buscaInput: { flex: 1, fontSize: 14, color: C.textoClaro },
  filtrosScroll:   { maxHeight: 46 },
  filtrosContent:  { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  filtroChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
    backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.bordaSutil,
  },
  filtroChipAtivo:   { backgroundColor: C.verde, borderColor: C.verde },
  filtroTexto:       { fontSize: 12, fontWeight: '600', color: C.textoSuave },
  filtroTextoAtivo:  { color: '#fff' },
  filtroCount: {
    backgroundColor: C.bgSutil, borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 1,
    minWidth: 18, alignItems: 'center',
  },
  filtroCountAtivo:  { backgroundColor: 'rgba(255,255,255,0.2)' },
  filtroCountTexto:  { fontSize: 10, fontWeight: '800', color: C.textoMedio },
  loadingArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lista:        { flex: 1, marginTop: 10 },
  listaContent: { paddingHorizontal: 16, paddingBottom: 30 },
  vazio:        { alignItems: 'center', paddingVertical: 60, gap: 10 },
  vazioTexto:   { fontSize: 14, fontWeight: '600', color: C.textoMedio },
});