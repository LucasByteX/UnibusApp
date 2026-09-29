/**
 * Rotas.js
 *
 * Permissões:
 *   Membro         → inscrever/desinscrever
 *   Motorista      → criar, editar, excluir viagens + ver lista de inscritos
 *   Comissao/Admin → tudo acima + também pode se inscrever nas viagens
 *
 * Firestore:
 *   Viagens/{id} → { rota, hora, data, motorista, limite,
 *                    pessoasIda, pessoasVolta, criadoEm }
 *   Viagens/{id}/Inscritos/{uid} → { nome, instituicao, cargo, tipo, inscritoEm }
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, TouchableOpacity, View, Alert,
  ScrollView, Animated, StatusBar, ActivityIndicator,
  RefreshControl, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  collection, onSnapshot, doc, addDoc, updateDoc,
  deleteDoc, setDoc, getDoc, serverTimestamp, increment,
} from 'firebase/firestore';
import { MaterialCommunityIcons, Entypo, FontAwesome } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { getApp } from 'firebase/app';
import { getFirestore, doc as firestoreDoc, updateDoc as firestoreUpdate } from 'firebase/firestore';

// ─── BACKGROUND TASK ──────────────────────────────────────────────────────────
// Precisa ser definida no escopo global (fora de qualquer componente)
// É executada pelo sistema mesmo com app em background ou tela desligada
const TASK_RASTREAMENTO = 'unibus-rastreamento-motorista';

TaskManager.defineTask(TASK_RASTREAMENTO, async ({ data, error }) => {
  if (error) { console.log('Erro rastreamento background:', error); return; }
  if (!data) return;
  const { locations } = data;
  const loc = locations?.[0];
  if (!loc) return;

  // Recupera o viagemId salvo anteriormente
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const viagemId = await AsyncStorage.getItem('rastreamento_viagem_id');
    if (!viagemId) return;
    // Usa instância do Firestore já inicializada pelo app
    const dbInstance = getFirestore(getApp());
    await firestoreUpdate(firestoreDoc(dbInstance, 'Rastreamento', viagemId), {
      lat:          loc.coords.latitude,
      lng:          loc.coords.longitude,
      atualizadoEm: Date.now(),
    });
  } catch {
    // Sem rede — o sistema tentará novamente na próxima posição
  }
});

import { db } from '../../firebaseConnection';
import { useAuth, temPermissao } from '../../../AuthContext';
import EscolhaRotaModal  from '../../assets/ObjetoRota/EscolhaRotaModal';
import EditarViagemModal from '../../assets/ObjetoRota/EditarViagemModal';
import NovaViagemModal   from '../../assets/ObjetoRota/NovaViagemModal';

// ─── PALETA AREIA-PB ─────────────────────────────────────────────────────────
const C = {
  bgProfundo:  '#0b110d',
  bgCard:      '#111a14',
  bgSutil:     '#192b1e',
  bordaSutil:  '#243d2a',
  verde:       '#3d8b5c',
  verdeClaro:  '#52b876',
  terracota:   '#c2622a',
  ocre:        '#d4872f',
  textoClaro:  '#dfe8da',
  textoMedio:  '#7a9e82',
  textoSuave:  '#3d5c43',
  erro:        '#c0392b',
};

const CARGO_COR = {
  Administrador: '#d4872f',
  Comissao:      '#3d8b5c',
  Motorista:     '#52b876',
  Membro:        '#3d5c43',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function podeGerenciarViagens(cargo) { return temPermissao(cargo, 'Motorista'); }
function podeVerInscritos(cargo)     { return temPermissao(cargo, 'Motorista'); }
function podeSeInscrever(cargo)      { return cargo === 'Membro' || cargo === 'Comissao' || cargo === 'Administrador'; }
// Pode fazer chamada (confirmar presença): Motorista+
function podeFazerChamada(cargo)     { return temPermissao(cargo, 'Motorista'); }
// Pode ver lista de presença: todos
function podeVerPresenca()           { return true; }

// Retorna true se faltam menos de 30min para a partida
function dentroDoBloqueioDeinscricao(partida) {
  if (!partida) return false;
  return Date.now() >= partida - 30 * 60 * 1000;
}

// Converte "DD/MM/AAAA" + "H:MM" ou "HH:MM" para timestamp Unix (ms) em horário local
function parsearTimestamp(data, hora) {
  try {
    if (!data || !hora) return null;
    const partsData = data.split('/');
    if (partsData.length !== 3) return null;
    const dia = parseInt(partsData[0], 10);
    const mes = parseInt(partsData[1], 10);
    const ano = parseInt(partsData[2], 10);
    const partsHora = hora.split(':');
    if (partsHora.length !== 2) return null;
    const h   = parseInt(partsHora[0], 10);
    const min = parseInt(partsHora[1], 10);
    if (isNaN(dia) || isNaN(mes) || isNaN(ano) || isNaN(h) || isNaN(min)) return null;
    // Usa setFullYear/setHours para garantir horário local sem interferência de UTC
    const d = new Date();
    d.setFullYear(ano, mes - 1, dia);
    d.setHours(h, min, 0, 0);
    return d.getTime();
  } catch { return null; }
}

// ─── MODAL DE PRESENÇA ────────────────────────────────────────────────────────
function PresencaModal({ visible, onClose, viagemId, viagem }) {
  const { usuario } = useAuth();
  const cargo       = usuario?.cargo;
  const fazChamada  = podeFazerChamada(cargo);

  const [presenca,    setPresenca]    = useState([]);
  const [carregando,  setCarregando]  = useState(true);
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible || !viagemId) return;
    setCarregando(true);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 18, stiffness: 200, useNativeDriver: true }),
    ]).start();

    const unsub = onSnapshot(
      collection(db, 'Viagens', viagemId, 'Presenca'),
      (snap) => {
        const lista = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
        lista.sort((a, b) => (a.ordem || 999) - (b.ordem || 999));
        setPresenca(lista);
        setCarregando(false);
      },
      () => setCarregando(false)
    );
    return unsub;
  }, [visible, viagemId]);

  function fechar() {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 60, duration: 180, useNativeDriver: true }),
    ]).start(() => { slideAnim.setValue(60); fadeAnim.setValue(0); onClose(); });
  }

  async function confirmarPresenca(inscrito) {
    // Verifica se já está na lista de presença
    const jaConfirmado = presenca.some(p => p.uid === inscrito.uid);
    if (jaConfirmado) {
      Alert.alert('Já confirmado', `${inscrito.nome} já está na lista de presença.`);
      return;
    }
    try {
      const ordem = presenca.length + 1;
      await setDoc(doc(db, 'Viagens', viagemId, 'Presenca', inscrito.uid), {
        nome:          inscrito.nome        || '',
        instituicao:   inscrito.instituicao || '',
        tipo:          inscrito.tipo        || '',
        ordem,
        confirmadoEm:  serverTimestamp(),
        confirmadoPor: usuario.nome         || '',
      });
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível confirmar presença.');
    }
  }

  async function removerPresenca(uid, nome) {
    Alert.alert('Remover', `Remover ${nome} da lista de presença?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        try {
          await deleteDoc(doc(db, 'Viagens', viagemId, 'Presenca', uid));
          // Reordena os restantes
          const restantes = presenca.filter(p => p.uid !== uid).sort((a, b) => a.ordem - b.ordem);
          await Promise.all(restantes.map((p, i) =>
            updateDoc(doc(db, 'Viagens', viagemId, 'Presenca', p.uid), { ordem: i + 1 })
          ));
        } catch { Alert.alert('Erro', 'Não foi possível remover.'); }
      }},
    ]);
  }

  // Inscritos da viagem para a chamada (Motorista+)
  const [inscritos, setInscritos] = useState([]);
  useEffect(() => {
    if (!visible || !viagemId || !fazChamada) return;
    const unsub = onSnapshot(
      collection(db, 'Viagens', viagemId, 'Inscritos'),
      (snap) => setInscritos(snap.docs.map(d => ({ uid: d.id, ...d.data() }))),
      () => {}
    );
    return unsub;
  }, [visible, viagemId, fazChamada]);

  const idaPresenca = presenca.filter(p => p.tipo === 'ida' || p.tipo === 'ida_volta');

  function ListaPresenca({ lista, label }) {
    return (
      <View style={pres.secao}>
        <View style={pres.secaoHeader}>
          <MaterialCommunityIcons
            name={label === 'PRAÇA' ? 'map-marker-outline' : 'arrow-left-circle-outline'}
            size={15} color={C.ocre}
          />
          <Text style={pres.secaoTitulo}>{label}</Text>
          <View style={pres.contBadge}>
            <Text style={pres.contTexto}>{lista.length}</Text>
          </View>
        </View>
        {lista.length === 0 ? (
          <Text style={pres.vazio}>Nenhuma presença confirmada</Text>
        ) : (
          lista.map((p) => (
            <View key={p.uid} style={pres.item}>
              <View style={pres.ordemBadge}>
                <Text style={pres.ordemTexto}>{p.ordem}°</Text>
              </View>
              <View style={pres.itemInfo}>
                <Text style={pres.itemNome}>{p.nome || 'Sem nome'}</Text>
                {p.instituicao ? <Text style={pres.itemInst}>{p.instituicao}</Text> : null}
              </View>
              {fazChamada && (
                <TouchableOpacity onPress={() => removerPresenca(p.uid, p.nome)} style={pres.removerBtn}>
                  <MaterialCommunityIcons name="close" size={14} color={C.erro} />
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>
    );
  }

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={fechar}>
      <Animated.View style={[pres.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[pres.box, { transform: [{ translateY: slideAnim }] }]}>

          {/* Header */}
          <View style={pres.header}>
            <View style={pres.headerIcon}>
              <MaterialCommunityIcons name="clipboard-check-outline" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={pres.headerTitulo}>Lista de Presença</Text>
              <Text style={pres.headerSub}>
                {presenca.length} confirmado{presenca.length !== 1 ? 's' : ''} · ordem de chegada
              </Text>
            </View>
            <TouchableOpacity onPress={fechar} style={pres.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>

          {/* Seção de chamada — só Motorista+ */}
          {fazChamada && inscritos.length > 0 && (
            <View style={pres.chamadaArea}>
              <Text style={pres.chamadaTitulo}>Confirmar chegada</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {inscritos
                  .filter(i => !presenca.some(p => p.uid === i.uid) && (i.tipo === 'ida' || i.tipo === 'ida_volta'))
                  .map(i => (
                    <TouchableOpacity
                      key={i.uid}
                      style={pres.chamadaChip}
                      onPress={() => confirmarPresenca(i)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="account-check-outline" size={14} color={C.verde} />
                      <Text style={pres.chamadaChipTexto} numberOfLines={1}>{i.nome}</Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
              {inscritos.filter(i => !presenca.some(p => p.uid === i.uid) && (i.tipo === 'ida' || i.tipo === 'ida_volta')).length === 0 && (
                <Text style={pres.chamadaVazio}>Todos os inscritos foram confirmados</Text>
              )}
            </View>
          )}

          {/* Listas de presença */}
          {carregando ? (
            <View style={pres.loading}>
              <ActivityIndicator color={C.verde} />
            </View>
          ) : (
            <ScrollView style={pres.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 8 }}>
              <ListaPresenca lista={idaPresenca} label="PRAÇA" />
              <View style={{ height: 8 }} />
            </ScrollView>
          )}

          <TouchableOpacity style={pres.fecharBtn} onPress={fechar} activeOpacity={0.8}>
            <Text style={pres.fecharTexto}>Fechar</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const pres = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(11,17,13,0.75)',
    justifyContent: 'flex-end', paddingBottom: 20, paddingHorizontal: 16,
  },
  box: {
    backgroundColor: C.bgCard, borderRadius: 24, overflow: 'hidden',
    maxHeight: '88%', borderWidth: 1, borderColor: C.bordaSutil,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 12,
  },
  header: {
    backgroundColor: C.bgSutil, flexDirection: 'row', alignItems: 'center',
    gap: 12, padding: 18, borderBottomWidth: 1, borderBottomColor: C.bordaSutil,
  },
  headerIcon: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: C.verde, justifyContent: 'center', alignItems: 'center',
  },
  headerTitulo: { fontSize: 17, fontWeight: '800', color: C.textoClaro },
  headerSub:    { fontSize: 12, color: C.textoSuave, marginTop: 1 },
  closeBtn:     { padding: 4 },
  chamadaArea: {
    padding: 14, borderBottomWidth: 1, borderBottomColor: C.bordaSutil,
    backgroundColor: C.bgSutil, gap: 10,
  },
  chamadaTitulo: { fontSize: 11, fontWeight: '800', color: C.ocre, letterSpacing: 0.8, textTransform: 'uppercase' },
  chamadaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1a3d26', borderRadius: 20,
    paddingVertical: 8, paddingHorizontal: 12,
    borderWidth: 1, borderColor: `${C.verde}55`,
  },
  chamadaChipTexto: { fontSize: 13, fontWeight: '600', color: C.textoClaro, maxWidth: 120 },
  chamadaVazio: { fontSize: 12, color: C.textoSuave, textAlign: 'center', paddingVertical: 4 },
  loading: { padding: 40, alignItems: 'center' },
  scroll:  { maxHeight: 380 },
  secao: {
    backgroundColor: C.bgSutil, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: C.bordaSutil,
  },
  secaoHeader:  { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  secaoTitulo:  { fontSize: 11, fontWeight: '800', color: C.ocre, letterSpacing: 1, textTransform: 'uppercase', flex: 1 },
  contBadge:    { backgroundColor: C.bgProfundo, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  contTexto:    { fontSize: 11, fontWeight: '700', color: C.textoMedio },
  vazio:        { fontSize: 13, color: C.textoSuave, textAlign: 'center', paddingVertical: 8 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.bordaSutil,
  },
  ordemBadge: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: C.verde, justifyContent: 'center', alignItems: 'center',
  },
  ordemTexto:  { fontSize: 13, fontWeight: '900', color: '#fff' },
  itemInfo:    { flex: 1 },
  itemNome:    { fontSize: 14, fontWeight: '600', color: C.textoClaro },
  itemInst:    { fontSize: 11, color: C.textoSuave, marginTop: 2 },
  removerBtn:  { padding: 6 },
  fecharBtn:   { margin: 16, backgroundColor: C.bgSutil, borderRadius: 14, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: C.bordaSutil },
  fecharTexto: { fontSize: 15, fontWeight: '600', color: C.textoMedio },
});

// ─── MODAL DE INSCRITOS ───────────────────────────────────────────────────────
function InscritosModal({ visible, onClose, viagemId }) {
  const [inscritos, setInscritos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible || !viagemId) return;
    setCarregando(true);

    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 18, stiffness: 200, useNativeDriver: true }),
    ]).start();

    // Listener em tempo real dos inscritos desta viagem
    const unsub = onSnapshot(
      collection(db, 'Viagens', viagemId, 'Inscritos'),
      (snap) => {
        const lista = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
        lista.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
        setInscritos(lista);
        setCarregando(false);
      },
      () => setCarregando(false)
    );
    return unsub;
  }, [visible, viagemId]);

  function fechar() {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 60, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      slideAnim.setValue(60);
      fadeAnim.setValue(0);
      onClose();
    });
  }

  const ida      = inscritos.filter(i => i.tipo === 'ida' || i.tipo === 'ida_volta');
  const volta    = inscritos.filter(i => i.tipo === 'volta' || i.tipo === 'ida_volta');

  function ListaInscritos({ lista, label }) {
    return (
      <View style={ins.secao}>
        <View style={ins.secaoHeader}>
          <MaterialCommunityIcons
            name={label === 'IDA' ? 'arrow-right-circle-outline' : 'arrow-left-circle-outline'}
            size={15} color={C.ocre}
          />
          <Text style={ins.secaoTitulo}>{label}</Text>
          <View style={ins.contBadge}>
            <Text style={ins.contTexto}>{lista.length}</Text>
          </View>
        </View>
        {lista.length === 0 ? (
          <Text style={ins.vazio}>Nenhum inscrito</Text>
        ) : (
          lista.map((p, idx) => (
            <View key={p.uid} style={ins.item}>
              <Text style={ins.numero}>{idx + 1}.</Text>
              <View style={ins.itemInfo}>
                <Text style={ins.itemNome}>{p.nome || 'Sem nome'}</Text>
                {p.instituicao ? (
                  <Text style={ins.itemInst}>{p.instituicao}</Text>
                ) : null}
              </View>
            </View>
          ))
        )}
      </View>
    );
  }

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={fechar}>
      <Animated.View style={[ins.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[ins.box, { transform: [{ translateY: slideAnim }] }]}>
          {/* Header */}
          <View style={ins.header}>
            <View style={ins.headerIcon}>
              <MaterialCommunityIcons name="account-group-outline" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ins.headerTitulo}>Passageiros</Text>
              <Text style={ins.headerSub}>{inscritos.length} inscrito{inscritos.length !== 1 ? 's' : ''} no total</Text>
            </View>
            <TouchableOpacity onPress={fechar} style={ins.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>

          {carregando ? (
            <View style={ins.loading}>
              <ActivityIndicator color={C.verde} />
            </View>
          ) : (
            <ScrollView style={ins.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 8 }}>
              <ListaInscritos lista={ida}   label="IDA"   />
              <View style={{ height: 8 }} />
              <ListaInscritos lista={volta} label="VOLTA" />
              <View style={{ height: 8 }} />
            </ScrollView>
          )}

          <TouchableOpacity style={ins.fecharBtn} onPress={fechar} activeOpacity={0.8}>
            <Text style={ins.fecharTexto}>Fechar</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const ins = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(11,17,13,0.75)',
    justifyContent: 'flex-end', paddingBottom: 20, paddingHorizontal: 16,
  },
  box: {
    backgroundColor: C.bgCard, borderRadius: 24, overflow: 'hidden',
    maxHeight: '80%', borderWidth: 1, borderColor: C.bordaSutil,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 12,
  },
  header: {
    backgroundColor: C.bgSutil, flexDirection: 'row', alignItems: 'center',
    gap: 12, padding: 18, borderBottomWidth: 1, borderBottomColor: C.bordaSutil,
  },
  headerIcon: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: C.verde, justifyContent: 'center', alignItems: 'center',
  },
  headerTitulo: { fontSize: 17, fontWeight: '800', color: C.textoClaro },
  headerSub:    { fontSize: 12, color: C.textoSuave, marginTop: 1 },
  closeBtn:     { padding: 4 },
  loading:      { padding: 40, alignItems: 'center' },
  scroll:       { maxHeight: 400 },
  secao: {
    backgroundColor: C.bgSutil, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: C.bordaSutil,
  },
  secaoHeader:  { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  secaoTitulo:  { fontSize: 11, fontWeight: '800', color: C.ocre, letterSpacing: 1, textTransform: 'uppercase', flex: 1 },
  contBadge:    { backgroundColor: C.bgProfundo, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  contTexto:    { fontSize: 11, fontWeight: '700', color: C.textoMedio },
  vazio:        { fontSize: 13, color: C.textoSuave, textAlign: 'center', paddingVertical: 8 },
  item:         { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 7, borderTopWidth: 1, borderTopColor: C.bordaSutil },
  numero:       { fontSize: 12, color: C.textoSuave, fontWeight: '700', width: 22, marginTop: 1 },
  itemInfo:     { flex: 1 },
  itemNome:     { fontSize: 14, fontWeight: '600', color: C.textoClaro },
  itemInst:     { fontSize: 11, color: C.textoSuave, marginTop: 2 },
  fecharBtn:    { margin: 16, backgroundColor: C.bgSutil, borderRadius: 14, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: C.bordaSutil },
  fecharTexto:  { fontSize: 15, fontWeight: '600', color: C.textoMedio },
});

// ─── CARD DE VIAGEM ───────────────────────────────────────────────────────────
function ViagemCard({ viagem, onEditar, onExcluir, onInscrever, onVerInscritos, onVerPresenca, onToggleRastreamento, onVerMapa, rastreamentoAtivo }) {
  const { usuario } = useAuth();
  const cargo       = usuario?.cargo;
  const gerenciar   = podeGerenciarViagens(cargo);
  const verList     = podeVerInscritos(cargo);
  const inscrever   = podeSeInscrever(cargo);
  const ehMotorista = cargo === 'Motorista';
  const scaleAnim   = useRef(new Animated.Value(1)).current;

  const {
    id, rota, pessoasIda = 0, pessoasVolta = 0,
    hora, data, limite = 40, motorista, inscritoTipo, partida,
  } = viagem;

  const bloqueado     = dentroDoBloqueioDeinscricao(parsearTimestamp(data, hora));
  const idaExcedida   = pessoasIda   > limite;
  const voltaExcedida = pessoasVolta > limite;
  const inscrito      = !!inscritoTipo;

  function pressIn()  { Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, damping: 20 }).start(); }
  function pressOut() { Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, damping: 20 }).start(); }

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.card}>
        <View style={[styles.cardStripe, {
          backgroundColor: inscrito ? C.verde : gerenciar ? C.ocre : C.bordaSutil
        }]} />

        <View style={styles.cardBody}>
          {/* Rota + ações */}
          <View style={styles.cardTop}>
            <View style={styles.rotaContainer}>
              <MaterialCommunityIcons name="routes" size={14} color={C.ocre} />
              <Text style={styles.rotaTexto} numberOfLines={1}>{rota}</Text>
            </View>

            <View style={styles.acoesBtns}>
              {/* Botão do mapa — aparece para não-motoristas quando rastreamento está ativo */}
              {!ehMotorista && rastreamentoAtivo && (
                <TouchableOpacity
                  style={[styles.acaoBtn, { backgroundColor: '#1a3d26', borderColor: `${C.verde}66` }]}
                  onPress={() => onVerMapa(viagem)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="map-marker-radius-outline" size={16} color={C.verde} />
                </TouchableOpacity>
              )}
              {/* Botão de rastreamento — só Motorista */}
              {ehMotorista && (
                <TouchableOpacity
                  style={[styles.acaoBtn, rastreamentoAtivo
                    ? { backgroundColor: C.verde, borderColor: C.verde }
                    : { borderColor: `${C.verde}55` }
                  ]}
                  onPress={() => onToggleRastreamento(viagem)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={rastreamentoAtivo ? 'map-marker' : 'map-marker-outline'}
                    size={16}
                    color={rastreamentoAtivo ? '#fff' : C.verde}
                  />
                </TouchableOpacity>
              )}
              {/* Lista de presença — todos podem ver */}
              {bloqueado && (
                <TouchableOpacity
                  style={[styles.acaoBtn, { borderColor: `${C.verde}66` }]}
                  onPress={() => onVerPresenca(id, viagem)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="clipboard-check-outline" size={16} color={C.verde} />
                </TouchableOpacity>
              )}
              {/* Ver inscritos — Motorista+ */}
              {verList && (
                <TouchableOpacity
                  style={styles.acaoBtn}
                  onPress={() => onVerInscritos(id)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="account-group-outline" size={16} color={C.verde} />
                </TouchableOpacity>
              )}
              {/* Editar — Motorista+ */}
              {gerenciar && (
                <TouchableOpacity
                  style={styles.acaoBtn}
                  onPress={() => onEditar(viagem)}
                  activeOpacity={0.7}
                >
                  <FontAwesome name="edit" size={15} color={C.verde} />
                </TouchableOpacity>
              )}
              {/* Excluir — Motorista+ */}
              {gerenciar && (
                <TouchableOpacity
                  style={[styles.acaoBtn, styles.acaoBtnPerigo]}
                  onPress={() => onExcluir(id)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={16} color={C.erro} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Pills de info */}
          <View style={styles.infosRow}>
            {[
              { icon: 'calendar-outline',    val: data      },
              { icon: 'clock-outline',       val: hora      },
              { icon: 'account-tie-outline', val: motorista },
            ].map(({ icon, val }) => (
              <View key={icon} style={styles.infoPill}>
                <MaterialCommunityIcons name={icon} size={12} color={C.textoMedio} />
                <Text style={styles.infoPillTexto}>{val}</Text>
              </View>
            ))}
            {/* Badge de bloqueio */}
            {bloqueado && (
              <View style={[styles.infoPill, { borderColor: `${C.ocre}55`, backgroundColor: '#2a1a00' }]}>
                <MaterialCommunityIcons name="lock-clock" size={12} color={C.ocre} />
                <Text style={[styles.infoPillTexto, { color: C.ocre }]}>Inscrições encerradas</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Contadores + botão de inscrição */}
          <View style={styles.cardBottom}>
            <View style={styles.contadoresArea}>
              {[
                { label: 'IDA',   val: pessoasIda,   excedeu: idaExcedida   },
                { label: 'VOLTA', val: pessoasVolta, excedeu: voltaExcedida },
              ].map(({ label, val, excedeu }) => (
                <View key={label} style={styles.contador}>
                  <Text style={styles.contadorLabel}>{label}</Text>
                  <View style={styles.contadorValorRow}>
                    {excedeu && <Entypo name="warning" size={13} color={C.erro} style={{ marginRight: 4 }} />}
                    <Text style={[styles.contadorValor, excedeu && { color: C.erro }]}>{val}</Text>
                    <Text style={styles.contadorSep}>/{limite}</Text>
                  </View>
                  <View style={styles.barraContainer}>
                    <View style={[
                      styles.barra,
                      { width: `${Math.min((val / limite) * 100, 100)}%`,
                        backgroundColor: excedeu ? C.erro : C.verde }
                    ]} />
                  </View>
                </View>
              ))}
            </View>

            {/* Botão de inscrição — bloqueado 30min antes */}
            {inscrever && !bloqueado && (
              <View style={styles.botaoArea}>
                <TouchableOpacity
                  onPress={() => onInscrever(viagem)}
                  onPressIn={pressIn} onPressOut={pressOut}
                  style={[
                    styles.statusBtn,
                    inscrito
                      ? { backgroundColor: C.verde }
                      : { backgroundColor: C.bgSutil, borderWidth: 1.5, borderColor: C.verde }
                  ]}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name={inscrito ? 'check-bold' : 'plus'}
                    size={24}
                    color={inscrito ? '#fff' : C.verde}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Badge de inscrição */}
          {inscrito && (
            <View style={styles.inscritoBadge}>
              <MaterialCommunityIcons name="ticket-confirmation-outline" size={12} color={C.verdeClaro} />
              <Text style={styles.inscritoTexto}>
                Inscrito · {inscritoTipo === 'ida' ? 'Ida' : inscritoTipo === 'volta' ? 'Volta' : 'Ida e Volta'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// ─── TELA PRINCIPAL ───────────────────────────────────────────────────────────
export default function Rotas({ navigation }) {
  const { usuario } = useAuth();
  const cargo = usuario?.cargo;
  const ehMotorista = cargo === 'Motorista';

  const [viagens, setViagens]               = useState([]);
  const [carregando, setCarregando]         = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [mostrarEditar, setMostrarEditar]   = useState(false);
  const [mostrarNova, setMostrarNova]       = useState(false);
  const [mostrarInscrever, setMostrarInscrever] = useState(false);
  const [mostrarInscritos, setMostrarInscritos] = useState(false);
  const [mostrarPresenca, setMostrarPresenca]   = useState(false);
  const [viagemInscritos, setViagemInscritos]   = useState(null);
  const [viagemPresenca, setViagemPresenca]     = useState(null);
  const [viagemAlvo, setViagemAlvo]         = useState(null);
  const [viagemEditando, setViagemEditando] = useState(null);
  // Rastreamento: { [viagemId]: { ativo, expiraEm } }
  const [rastreamentos, setRastreamentos]   = useState({});
  const rastreamentoTimerRef = useRef(null);

  // ── Cooldown persistido por data/hora no AsyncStorage ─────────────────────
  // Chave: "cooldown_inscricao_{uid}_{viagemId}"
  // Valor: ISO string do momento da última ação
  // Comparação usa Date.now() - Date.parse(salvo) para não depender de timer
  function chaveStorage(viagemId) {
    return `cooldown_inscricao_${usuario.uid}_${viagemId}`;
  }

  async function segundosRestantes(viagemId) {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const salvo = await AsyncStorage.getItem(chaveStorage(viagemId));
      if (!salvo) return 0;
      const diff = Date.now() - new Date(salvo).getTime();
      const restante = Math.ceil((60_000 - diff) / 1000);
      return restante > 0 ? restante : 0;
    } catch {
      return 0;
    }
  }

  async function gravarCooldown(viagemId) {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem(chaveStorage(viagemId), new Date().toISOString());
    } catch {}
  }

  // ── Listener Firestore ────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'Viagens'),
      async (snap) => {
        const lista = await Promise.all(
          snap.docs.map(async (d) => {
            const dados = { id: d.id, ...d.data() };
            try {
              const inscSnap = await getDoc(doc(db, 'Viagens', d.id, 'Inscritos', usuario.uid));
              dados.inscritoTipo = inscSnap.exists() ? inscSnap.data().tipo : null;
            } catch {
              dados.inscritoTipo = null;
            }
            return dados;
          })
        );
        lista.sort((a, b) => `${a.data} ${a.hora}`.localeCompare(`${b.data} ${b.hora}`));
        setViagens(lista);
        setCarregando(false);
        setRefreshing(false);
      },
      (err) => {
        console.error('Firestore listen error:', err);
        setCarregando(false);
        setRefreshing(false);
      }
    );
    return unsub;
  }, [usuario.uid]);

  // ── Listener de rastreamentos ativos ──────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'Rastreamento'),
      (snap) => {
        const obj = {};
        snap.docs.forEach(d => {
          const dados = d.data();
          // Ignora expirados
          if (!dados.expiraEm || Date.now() > dados.expiraEm) return;
          obj[d.id] = dados;
        });
        setRastreamentos(obj);
      },
      () => {}
    );
    return unsub;
  }, []);

  // ── Rastreamento do Motorista ─────────────────────────────────────────────
  async function toggleRastreamento(viagem) {
    const jaAtivo = rastreamentos[viagem.id]?.ativo &&
      rastreamentos[viagem.id]?.motoristaUid === usuario.uid;

    if (jaAtivo) {
      await pararRastreamento(viagem.id);
      Alert.alert('Rastreamento encerrado', 'Sua localização não está mais sendo compartilhada.');
    } else {
      // 1. Permissão de foreground
      const { status: fg } = await Location.requestForegroundPermissionsAsync();
      if (fg !== 'granted') {
        Alert.alert('Permissão necessária', 'Autorize o acesso à localização para ativar o rastreamento.');
        return;
      }
      // 2. Permissão de background (necessária para funcionar com tela desligada)
      const { status: bg } = await Location.requestBackgroundPermissionsAsync();
      if (bg !== 'granted') {
        Alert.alert(
          'Permissão de background necessária',
          'Para o rastreamento continuar com a tela desligada, vá em Configurações → Aplicativos → Unibus → Permissões → Localização e selecione "Sempre permitir".',
          [{ text: 'Entendido' }]
        );
        return;
      }
      Alert.alert(
        'Ativar Rastreamento',
        'Sua localização será compartilhada em tempo real com os passageiros por até 3 horas, mesmo com a tela desligada. Deseja continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ativar', onPress: () => iniciarRastreamento(viagem) },
        ]
      );
    }
  }

  async function iniciarRastreamento(viagem) {
    try {
      const expiraEm = Date.now() + 3 * 60 * 60 * 1000;

      // Salva viagemId no AsyncStorage para a task de background acessar
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('rastreamento_viagem_id', viagem.id);

      // Salva estado inicial no Firestore
      await setDoc(doc(db, 'Rastreamento', viagem.id), {
        ativo:         true,
        motoristaUid:  usuario.uid,
        motoristaNome: usuario.nome || '',
        rotaNome:      viagem.rota  || '',
        lat:           null,
        lng:           null,
        atualizadoEm:  Date.now(),
        expiraEm,
      });

      // Para qualquer task anterior antes de iniciar nova
      const taskAtiva = await TaskManager.isTaskRegisteredAsync(TASK_RASTREAMENTO);
      if (taskAtiva) {
        await Location.stopLocationUpdatesAsync(TASK_RASTREAMENTO);
      }

      // Inicia rastreamento em background com notificação persistente
      await Location.startLocationUpdatesAsync(TASK_RASTREAMENTO, {
        accuracy:          Location.Accuracy.Balanced,
        timeInterval:      15_000,    // mínimo 15s entre atualizações
        distanceInterval:  50,        // ou 50m de deslocamento
        deferredUpdatesInterval:  15_000,
        deferredUpdatesDistance:  50,
        pausesUpdatesAutomatically: false,
        foregroundService: {
          notificationTitle: 'Unibus — Rastreamento ativo',
          notificationBody:  'Sua localização está sendo compartilhada com os passageiros.',
          notificationColor: '#3d8b5c',
        },
        // Mantém ativo mesmo sem movimento (ônibus parado no ponto)
        activityType: Location.ActivityType.AutomotiveNavigation,
      });

      // Timer de expiração automática (3h)
      rastreamentoTimerRef.current = setTimeout(async () => {
        await pararRastreamento(viagem.id);
        Alert.alert('Rastreamento encerrado', 'O tempo máximo de 3 horas foi atingido.');
      }, 3 * 60 * 60 * 1000);

    } catch (e) {
      Alert.alert('Erro', `Não foi possível iniciar o rastreamento: ${e.message}`);
    }
  }

  async function pararRastreamento(viagemId) {
    // Para a task de background
    try {
      const taskAtiva = await TaskManager.isTaskRegisteredAsync(TASK_RASTREAMENTO);
      if (taskAtiva) {
        await Location.stopLocationUpdatesAsync(TASK_RASTREAMENTO);
      }
    } catch {}

    // Limpa timer
    if (rastreamentoTimerRef.current) {
      clearTimeout(rastreamentoTimerRef.current);
      rastreamentoTimerRef.current = null;
    }

    // Limpa viagemId do AsyncStorage
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.removeItem('rastreamento_viagem_id');
    } catch {}

    // Marca como inativo no Firestore
    try {
      await updateDoc(doc(db, 'Rastreamento', viagemId), { ativo: false });
    } catch {}
  }

  // Para o rastreamento se o componente desmontar
  useEffect(() => {
    return () => {
      if (rastreamentoTimerRef.current) clearTimeout(rastreamentoTimerRef.current);
      // Não para a task de background ao desmontar —
      // o motorista pode navegar para outra tela e o rastreamento continua
    };
  }, []);

  // ── Inscrever ─────────────────────────────────────────────────────────────
  async function clickInscrever(viagem) {
    // Bloqueia inscrição 30min antes da partida
    const partida = viagem.partida ?? parsearTimestamp(viagem.data, viagem.hora);
    if (dentroDoBloqueioDeinscricao(partida)) {
      Alert.alert('Inscrições encerradas', 'As inscrições para esta viagem foram encerradas 30 minutos antes da partida.');
      return;
    }
    const restante = await segundosRestantes(viagem.id);
    if (restante > 0) {
      Alert.alert('Aguarde', `Espere ${restante}s antes de alterar sua inscrição novamente.`);
      return;
    }
    if (viagem.inscritoTipo) {
      Alert.alert('Cancelar Inscrição', 'Deseja se desinscrever desta viagem?', [
        { text: 'Não', style: 'cancel' },
        { text: 'Sim', style: 'destructive', onPress: () => desinscrever(viagem.id) },
      ]);
    } else {
      setViagemAlvo(viagem);
      setMostrarInscrever(true);
    }
  }

  async function inscrever(tipo) {
    if (!viagemAlvo) return;
    try {
      await setDoc(doc(db, 'Viagens', viagemAlvo.id, 'Inscritos', usuario.uid), {
        nome:        usuario.nome        || '',
        instituicao: usuario.instituicao || '',
        cargo:       usuario.cargo       || '',
        tipo,
        inscritoEm: serverTimestamp(),
      });
      const decIda   = tipo === 'ida'   || tipo === 'ida_volta';
      const decVolta = tipo === 'volta' || tipo === 'ida_volta';
      await updateDoc(doc(db, 'Viagens', viagemAlvo.id), {
        ...(decIda   ? { pessoasIda:   (viagemAlvo.pessoasIda   || 0) + 1 } : {}),
        ...(decVolta ? { pessoasVolta: (viagemAlvo.pessoasVolta || 0) + 1 } : {}),
      });
      await gravarCooldown(viagemAlvo.id);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível se inscrever.');
    }
    setMostrarInscrever(false);
    setViagemAlvo(null);
  }

  async function desinscrever(id) {
    const viagem = viagens.find(v => v.id === id);
    if (!viagem) return;
    try {
      await deleteDoc(doc(db, 'Viagens', id, 'Inscritos', usuario.uid));
      const tipo     = viagem.inscritoTipo;
      const decIda   = tipo === 'ida'   || tipo === 'ida_volta';
      const decVolta = tipo === 'volta' || tipo === 'ida_volta';
      await updateDoc(doc(db, 'Viagens', id), {
        ...(decIda   ? { pessoasIda:   Math.max(0, (viagem.pessoasIda   || 1) - 1) } : {}),
        ...(decVolta ? { pessoasVolta: Math.max(0, (viagem.pessoasVolta || 1) - 1) } : {}),
      });
      await gravarCooldown(id);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível se desinscrever.');
    }
  }

  async function salvarEdicao(dados) {
    if (!viagemEditando?.id) return;
    try {
      const { rota, hora, data, motorista, limite, partida } = dados;
      await updateDoc(doc(db, 'Viagens', viagemEditando.id), {
        ...(rota      !== undefined ? { rota }      : {}),
        ...(hora      !== undefined ? { hora }      : {}),
        ...(data      !== undefined ? { data }      : {}),
        ...(motorista !== undefined ? { motorista } : {}),
        ...(limite    !== undefined ? { limite: Number(limite) } : {}),
        // Recalcula partida se data ou hora mudaram
        partida: partida ?? parsearTimestamp(data ?? viagemEditando.data, hora ?? viagemEditando.hora),
      });
    } catch (e) {
      Alert.alert('Erro', `Não foi possível salvar: ${e.message}`);
    }
    setMostrarEditar(false);
    setViagemEditando(null);
  }

  // ── Excluir ───────────────────────────────────────────────────────────────
  function excluirViagem(id) {
    Alert.alert('Excluir Viagem', 'Tem certeza? Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        try { await deleteDoc(doc(db, 'Viagens', id)); }
        catch (e) { Alert.alert('Erro', 'Não foi possível excluir.'); }
      }},
    ]);
  }

  // ── Adicionar ─────────────────────────────────────────────────────────────
  async function adicionarViagem(dados) {
    try {
      await addDoc(collection(db, 'Viagens'), {
        rota:         dados.rota       || '',
        hora:         dados.hora       || '',
        data:         dados.data       || '',
        motorista:    dados.motorista  || '',
        limite:       Number(dados.limite) || 40,
        partida:      dados.partida    || parsearTimestamp(dados.data, dados.hora) || null,
        pessoasIda:   0,
        pessoasVolta: 0,
        criadoEm:     serverTimestamp(),
      });
    } catch (e) { Alert.alert('Erro', 'Não foi possível criar a viagem.'); }
  }

  const cargoCor   = CARGO_COR[cargo] || C.textoSuave;
  const cargoLabel = cargo || 'Membro';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.bgProfundo} />
      <View style={styles.manchaVerde} />
      <View style={styles.manchaOcre}  />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitulo}>Viagens</Text>
          <Text style={styles.headerSub}>
            {viagens.length} {viagens.length === 1 ? 'viagem' : 'viagens'} disponíveis
          </Text>
        </View>
        <View style={[styles.cargoBadge, { backgroundColor: `${cargoCor}18`, borderColor: `${cargoCor}44` }]}>
          <MaterialCommunityIcons
            name={
              cargoLabel === 'Administrador' ? 'crown-outline'
              : cargoLabel === 'Comissao'    ? 'shield-check-outline'
              : cargoLabel === 'Motorista'   ? 'steering'
              : 'account-outline'
            }
            size={13}
            color={cargoCor}
          />
          <Text style={[styles.cargoTexto, { color: cargoCor }]}>{cargoLabel}</Text>
        </View>
      </View>

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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => setRefreshing(true)}
              tintColor={C.verde}
              colors={[C.verde]}
            />
          }
        >
          {viagens.length === 0 ? (
            <View style={styles.vazio}>
              <MaterialCommunityIcons name="bus-clock" size={48} color={C.textoSuave} />
              <Text style={styles.vazioTexto}>Nenhuma viagem disponível</Text>
              {podeGerenciarViagens(cargo) && (
                <Text style={styles.vazioSub}>Toque no + para adicionar uma viagem</Text>
              )}
            </View>
          ) : (
            viagens.map(v => (
              <ViagemCard
                key={v.id}
                viagem={v}
                onEditar={(viagem) => { setViagemEditando(viagem); setMostrarEditar(true); }}
                onExcluir={excluirViagem}
                onInscrever={clickInscrever}
                onVerInscritos={(id) => { setViagemInscritos(id); setMostrarInscritos(true); }}
                onVerPresenca={(id, viagem) => { setViagemPresenca({ id, viagem }); setMostrarPresenca(true); }}
                onToggleRastreamento={toggleRastreamento}
                onVerMapa={(viagem) => navigation.navigate('MapaMotorista', {
                  viagemId:     viagem.id,
                  rotaNome:     viagem.rota      || '',
                  motoristaNome: viagem.motorista || '',
                })}
                rastreamentoAtivo={
                  !!(rastreamentos[v.id]?.ativo &&
                     Date.now() < (rastreamentos[v.id]?.expiraEm ?? 0))
                }
              />
            ))
          )}
        </ScrollView>
      )}

      {/* FAB — só Motorista+ */}
      {podeGerenciarViagens(cargo) && (
        <TouchableOpacity
          style={styles.fabBtn}
          onPress={() => setMostrarNova(true)}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="plus" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Modal inscrição */}
      <EscolhaRotaModal
        visible={mostrarInscrever}
        titulo="Como vai participar?"
        onClose={() => { setMostrarInscrever(false); setViagemAlvo(null); }}
        onSelect={inscrever}
      />

      {/* Modal editar */}
      <EditarViagemModal
        visible={mostrarEditar}
        onClose={() => { setMostrarEditar(false); setViagemEditando(null); }}
        onSave={salvarEdicao}
        dadosViagem={viagemEditando}
      />

      {/* Modal nova viagem */}
      <NovaViagemModal
        visible={mostrarNova}
        onClose={() => setMostrarNova(false)}
        onSave={adicionarViagem}
      />

      {/* Modal inscritos */}
      <InscritosModal
        visible={mostrarInscritos}
        viagemId={viagemInscritos}
        onClose={() => { setMostrarInscritos(false); setViagemInscritos(null); }}
      />

      {/* Modal presença */}
      <PresencaModal
        visible={mostrarPresenca}
        viagemId={viagemPresenca?.id}
        viagem={viagemPresenca?.viagem}
        onClose={() => { setMostrarPresenca(false); setViagemPresenca(null); }}
      />
    </SafeAreaView>
  );
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bgProfundo },
  manchaVerde: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: C.verde, opacity: 0.05, top: -60, right: -60,
  },
  manchaOcre: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: C.terracota, opacity: 0.04, bottom: 80, left: -40,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12,
  },
  headerTitulo: { fontSize: 24, fontWeight: '900', color: C.textoClaro, letterSpacing: -0.4 },
  headerSub:    { fontSize: 12, color: C.textoSuave, marginTop: 2 },
  cargoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  cargoTexto:   { fontSize: 12, fontWeight: '700' },
  loadingArea:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lista:        { flex: 1 },
  listaContent: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 4, gap: 12 },

  // Card
  cardWrapper: {
    shadowColor: C.verde, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
  },
  card: {
    backgroundColor: C.bgCard, borderRadius: 18, overflow: 'hidden',
    flexDirection: 'row', borderWidth: 1, borderColor: C.bordaSutil,
  },
  cardStripe: { width: 4 },
  cardBody:   { flex: 1, padding: 14 },
  cardTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 8,
  },
  rotaContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  rotaTexto:     { fontSize: 14, fontWeight: '800', color: C.textoClaro, letterSpacing: 0.1 },
  acoesBtns:     { flexDirection: 'row', gap: 6 },
  acaoBtn: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: C.bgSutil, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.bordaSutil,
  },
  acaoBtnPerigo: { backgroundColor: '#2a1010' },
  infosRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 },
  infoPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.bgSutil, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 7, borderWidth: 1, borderColor: C.bordaSutil,
  },
  infoPillTexto: { fontSize: 11, color: C.textoMedio, fontWeight: '500' },
  divider:       { height: 1, backgroundColor: C.bordaSutil, marginBottom: 10 },
  cardBottom: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
  },
  contadoresArea:    { flex: 1, flexDirection: 'row' },
  contador:          { flex: 1 },
  contadorLabel:     { fontSize: 9, fontWeight: '800', color: C.textoSuave, letterSpacing: 1, marginBottom: 2 },
  contadorValorRow:  { flexDirection: 'row', alignItems: 'baseline' },
  contadorValor:     { fontSize: 20, fontWeight: '900', color: C.textoClaro },
  contadorSep:       { fontSize: 12, color: C.textoSuave, marginLeft: 1 },
  barraContainer:    { height: 3, backgroundColor: C.bordaSutil, borderRadius: 2, marginTop: 5, overflow: 'hidden', marginRight: 10 },
  barra:             { height: '100%', borderRadius: 2 },
  botaoArea:         { alignItems: 'center', gap: 5 },
  statusBtn: {
    width: 52, height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
  },
  inscritoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#1a3d26', borderRadius: 7,
    paddingHorizontal: 9, paddingVertical: 4, marginTop: 8,
    alignSelf: 'flex-start', borderWidth: 1, borderColor: `${C.verde}44`,
  },
  inscritoTexto: { fontSize: 11, color: C.verdeClaro, fontWeight: '600' },
  fabBtn: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: C.verde, justifyContent: 'center', alignItems: 'center',
    shadowColor: C.verde, shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  vazio:     { alignItems: 'center', justifyContent: 'center', paddingVertical: 70, gap: 10 },
  vazioTexto:{ fontSize: 15, fontWeight: '700', color: C.textoMedio },
  vazioSub:  { fontSize: 12, color: C.textoSuave },
});