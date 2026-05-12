import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ScrollView,
  Animated,
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Entypo, FontAwesome } from '@expo/vector-icons';
import EscolhaRotaModal from '../../assets/ObjetoRota/EscolhaRotaModal';
import EditarViagemModal from '../../assets/ObjetoRota/EditarViagemModal';
import NovaViagemModal from '../../assets/ObjetoRota/NovaViagemModal';

// ─── DADOS INICIAIS (substituir por Firebase) ─────────────────────────────────
const VIAGENS_INICIAIS = [
  {
    id: '1',
    rota: 'UEPB-UFCG-IFPB',
    pessoas: 35,
    pessoasVolta: 30,
    botaoStatus: false,
    hora: '5:30',
    data: '11/04/2026',
    limite: 40,
    motorista: 'Josemir',
    dataCold: null,
    idavol: '',
  },
];

// Cargo do usuário logado (substituir pela autenticação real)
const CARGO_USUARIO = 'Comissao'; // 'Comissao' | 'Motorista' | 'Passageiro'

function temAcesso() {
  return CARGO_USUARIO === 'Comissao' || CARGO_USUARIO === 'Motorista';
}

// ─── CARD DE VIAGEM ───────────────────────────────────────────────────────────
function ViagemCard({ viagem, onClickStatus, onEditar, onExcluir }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { rota, pessoas, pessoasVolta, botaoStatus, hora, data, limite, motorista, idavol } = viagem;

  const idaExcedida = pessoas > limite;
  const voltaExcedida = pessoasVolta > limite;

  function handlePressIn() {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, damping: 20 }).start();
  }
  function handlePressOut() {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 20 }).start();
  }

  const idaVolLabel = idavol === 'ida' ? 'Ida' : idavol === 'volta' ? 'Volta' : idavol === 'ida_volta' ? 'Ida e Volta' : null;

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.card}>
        {/* Faixa colorida lateral */}
        <View style={[styles.cardStripe, { backgroundColor: botaoStatus ? '#22c55e' : '#ef4444' }]} />

        <View style={styles.cardBody}>
          {/* Linha superior: rota + ações */}
          <View style={styles.cardTop}>
            <View style={styles.rotaContainer}>
              <MaterialCommunityIcons name="routes" size={15} color="#1a56db" />
              <Text style={styles.rotaTexto} numberOfLines={1}>{rota}</Text>
            </View>

            {temAcesso() && (
              <View style={styles.acoesBtns}>
                <TouchableOpacity
                  style={styles.acaoBtn}
                  onPress={() => onEditar(viagem)}
                  activeOpacity={0.7}
                >
                  <FontAwesome name="edit" size={17} color="#1a56db" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.acaoBtn, styles.acaoBtnPerigo]}
                  onPress={() => onExcluir(viagem.id)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={17} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Infos: data/hora/motorista */}
          <View style={styles.infosRow}>
            <View style={styles.infoPill}>
              <MaterialCommunityIcons name="calendar-outline" size={13} color="#5a6480" />
              <Text style={styles.infoPillTexto}>{data}</Text>
            </View>
            <View style={styles.infoPill}>
              <MaterialCommunityIcons name="clock-outline" size={13} color="#5a6480" />
              <Text style={styles.infoPillTexto}>{hora}</Text>
            </View>
            <View style={styles.infoPill}>
              <MaterialCommunityIcons name="account-tie-outline" size={13} color="#5a6480" />
              <Text style={styles.infoPillTexto}>{motorista}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Linha inferior: contadores + botão */}
          <View style={styles.cardBottom}>
            <View style={styles.contadoresArea}>
              {/* IDA */}
              <View style={styles.contador}>
                <Text style={styles.contadorLabel}>IDA</Text>
                <View style={styles.contadorValorRow}>
                  {idaExcedida && (
                    <Entypo name="warning" size={14} color="#ef4444" style={{ marginRight: 4 }} />
                  )}
                  <Text style={[styles.contadorValor, idaExcedida && styles.contadorValorPerigo]}>
                    {pessoas}
                  </Text>
                  <Text style={styles.contadorSeparador}>/{limite}</Text>
                </View>
                <View style={styles.barraContainer}>
                  <View
                    style={[
                      styles.barra,
                      {
                        width: `${Math.min((pessoas / limite) * 100, 100)}%`,
                        backgroundColor: idaExcedida ? '#ef4444' : '#22c55e',
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.contadorSep} />

              {/* VOLTA */}
              <View style={styles.contador}>
                <Text style={styles.contadorLabel}>VOLTA</Text>
                <View style={styles.contadorValorRow}>
                  {voltaExcedida && (
                    <Entypo name="warning" size={14} color="#ef4444" style={{ marginRight: 4 }} />
                  )}
                  <Text style={[styles.contadorValor, voltaExcedida && styles.contadorValorPerigo]}>
                    {pessoasVolta}
                  </Text>
                  <Text style={styles.contadorSeparador}>/{limite}</Text>
                </View>
                <View style={styles.barraContainer}>
                  <View
                    style={[
                      styles.barra,
                      {
                        width: `${Math.min((pessoasVolta / limite) * 100, 100)}%`,
                        backgroundColor: voltaExcedida ? '#ef4444' : '#22c55e',
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Botão status */}
            <View style={styles.botaoArea}>
              {idaVolLabel && (
                <View style={[styles.idavolBadge, { backgroundColor: botaoStatus ? '#dcfce7' : '#fee2e2' }]}>
                  <Text style={[styles.idavolTexto, { color: botaoStatus ? '#16a34a' : '#dc2626' }]}>
                    {idaVolLabel}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => onClickStatus(viagem.id)}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[styles.statusBtn, { backgroundColor: botaoStatus ? '#22c55e' : '#ef4444' }]}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name={botaoStatus ? 'bus-stop' : 'bus-electric'}
                  size={26}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── TELA PRINCIPAL ───────────────────────────────────────────────────────────
export default function TelaViagens() {
  const [viagens, setViagens] = useState(VIAGENS_INICIAIS);
  const [mostrarEscolha, setMostrarEscolha] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [mostrarNova, setMostrarNova] = useState(false);
  const [viagemAlvo, setViagemAlvo] = useState(null); // id da viagem que clicou o status
  const [viagemEditando, setViagemEditando] = useState(null);

  // Carrega estados persistidos
  useEffect(() => {
    async function carregarStorage() {
      try {
        const raw = await AsyncStorage.getItem('viagens_cold');
        if (raw) {
          const parsed = JSON.parse(raw);
          setViagens((prev) =>
            prev.map((v) => ({
              ...v,
              dataCold: parsed[v.id] ? new Date(parsed[v.id]) : null,
            }))
          );
        }
      } catch (e) {}
    }
    carregarStorage();
  }, []);

  // Salva dataCold sempre que mudar
  async function salvarCold(viagensAtual) {
    try {
      const obj = {};
      viagensAtual.forEach((v) => {
        if (v.dataCold) obj[v.id] = v.dataCold.toISOString();
      });
      await AsyncStorage.setItem('viagens_cold', JSON.stringify(obj));
    } catch (e) {}
  }

  function clickStatus(id) {
    const viagem = viagens.find((v) => v.id === id);
    if (!viagem) return;

    const atual = new Date();
    const diferenca = viagem.dataCold ? atual - viagem.dataCold : Infinity;

    const podeMexer = viagem.dataCold === null || diferenca >= 1 * 60 * 1000;

    if (!podeMexer) {
      Alert.alert(
        'Aguarde',
        'Espere 1 minuto antes de fazer qualquer alteração.',
        [{ text: 'Ok', style: 'default' }]
      );
      return;
    }

    if (!viagem.botaoStatus) {
      // Vai ativar — perguntar tipo
      setViagemAlvo(id);
      setMostrarEscolha(true);
    } else {
      // Vai desativar
      const novasViagens = viagens.map((v) =>
        v.id === id ? { ...v, botaoStatus: false, dataCold: new Date() } : v
      );
      setViagens(novasViagens);
      salvarCold(novasViagens);
    }
  }

  function onEscolhaRota(opcao) {
    const novasViagens = viagens.map((v) =>
      v.id === viagemAlvo
        ? { ...v, botaoStatus: true, idavol: opcao, dataCold: new Date() }
        : v
    );
    setViagens(novasViagens);
    salvarCold(novasViagens);
    setMostrarEscolha(false);
    setViagemAlvo(null);
  }

  function onFecharEscolha() {
    // Cancela — zera o cooldown desta viagem
    const novasViagens = viagens.map((v) =>
      v.id === viagemAlvo ? { ...v, dataCold: null } : v
    );
    setViagens(novasViagens);
    salvarCold(novasViagens);
    setMostrarEscolha(false);
    setViagemAlvo(null);
  }

  function abrirEditar(viagem) {
    setViagemEditando(viagem);
    setMostrarEditar(true);
  }

  function salvarEdicao(dados) {
    const novasViagens = viagens.map((v) =>
      v.id === viagemEditando.id ? { ...v, ...dados } : v
    );
    setViagens(novasViagens);
    setMostrarEditar(false);
    setViagemEditando(null);
  }

  function excluirViagem(id) {
    Alert.alert(
      'Excluir Viagem',
      'Tem certeza que deseja excluir esta viagem? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            const novasViagens = viagens.filter((v) => v.id !== id);
            setViagens(novasViagens);
            salvarCold(novasViagens);
          },
        },
      ]
    );
  }

  function adicionarViagem(dados) {
    const nova = {
      ...dados,
      id: Date.now().toString(),
      pessoasVolta: 0,
      botaoStatus: false,
      dataCold: null,
      idavol: '',
    };
    setViagens((prev) => [...prev, nova]);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f4ff" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitulo}>Viagens</Text>
          <Text style={styles.headerSub}>
            {viagens.length} {viagens.length === 1 ? 'viagem' : 'viagens'} hoje
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.cargoBadge, { backgroundColor: temAcesso() ? '#dce8ff' : '#f5f5f5' }]}>
            <MaterialCommunityIcons
              name={CARGO_USUARIO === 'Motorista' ? 'steering' : CARGO_USUARIO === 'Comissao' ? 'shield-check-outline' : 'account-outline'}
              size={14}
              color={temAcesso() ? '#1a56db' : '#8a95aa'}
            />
            <Text style={[styles.cargoTexto, { color: temAcesso() ? '#1a56db' : '#8a95aa' }]}>
              {CARGO_USUARIO}
            </Text>
          </View>
        </View>
      </View>

      {/* Lista */}
      <ScrollView
        style={styles.lista}
        contentContainerStyle={styles.listaContent}
        showsVerticalScrollIndicator={false}
      >
        {viagens.length === 0 ? (
          <View style={styles.vazio}>
            <MaterialCommunityIcons name="bus-clock" size={48} color="#c8d0e0" />
            <Text style={styles.vazioTexto}>Nenhuma viagem cadastrada</Text>
            <Text style={styles.vazioSub}>Toque no botão + para adicionar</Text>
          </View>
        ) : (
          viagens.map((v) => (
            <ViagemCard
              key={v.id}
              viagem={v}
              onClickStatus={clickStatus}
              onEditar={abrirEditar}
              onExcluir={excluirViagem}
            />
          ))
        )}
      </ScrollView>

      {/* Botão adicionar viagem */}
      {temAcesso() && (
        <TouchableOpacity
          style={styles.fabBtn}
          onPress={() => setMostrarNova(true)}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="plus" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Modais */}
      <EscolhaRotaModal
        visible={mostrarEscolha}
        onClose={onFecharEscolha}
        onSelect={onEscolhaRota}
      />

      <EditarViagemModal
        visible={mostrarEditar}
        onClose={() => {
          setMostrarEditar(false);
          setViagemEditando(null);
        }}
        onSave={salvarEdicao}
        dadosViagem={viagemEditando}
      />

      <NovaViagemModal
        visible={mostrarNova}
        onClose={() => setMostrarNova(false)}
        onSave={adicionarViagem}
      />
    </SafeAreaView>
  );
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f4ff',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: '#f0f4ff',
  },
  headerTitulo: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0e1a40',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: '#6b7a99',
    marginTop: 1,
  },
  headerRight: {},
  cargoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  cargoTexto: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Lista
  lista: { flex: 1 },
  listaContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    paddingTop: 4,
    gap: 14,
  },

  // Card
  cardWrapper: {
    shadowColor: '#1a56db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  cardStripe: {
    width: 5,
  },
  cardBody: {
    flex: 1,
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rotaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  rotaTexto: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0e1a40',
    letterSpacing: 0.2,
  },
  acoesBtns: {
    flexDirection: 'row',
    gap: 6,
  },
  acaoBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acaoBtnPerigo: {
    backgroundColor: '#fff1f1',
  },
  infosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f5f7fb',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  infoPillTexto: {
    fontSize: 12,
    color: '#5a6480',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#eef0f8',
    marginBottom: 12,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  contadoresArea: {
    flex: 1,
    flexDirection: 'row',
    gap: 0,
  },
  contador: {
    flex: 1,
  },
  contadorSep: {
    width: 1,
    backgroundColor: '#eef0f8',
    marginHorizontal: 12,
    alignSelf: 'stretch',
  },
  contadorLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9aa5be',
    letterSpacing: 1,
    marginBottom: 3,
  },
  contadorValorRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  contadorValor: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0e1a40',
  },
  contadorValorPerigo: {
    color: '#ef4444',
  },
  contadorSeparador: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9aa5be',
    marginLeft: 1,
  },
  barraContainer: {
    height: 4,
    backgroundColor: '#eef0f8',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  barra: {
    height: '100%',
    borderRadius: 2,
  },
  botaoArea: {
    alignItems: 'center',
    gap: 6,
  },
  idavolBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  idavolTexto: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },

  // FAB
  fabBtn: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#1a56db',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1a56db',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },

  // Vazio
  vazio: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 10,
  },
  vazioTexto: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8a95aa',
  },
  vazioSub: {
    fontSize: 13,
    color: '#b0b8cc',
  },
});