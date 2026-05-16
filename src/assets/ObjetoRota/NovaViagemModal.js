import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ─── PALETA AREIA-PB ─────────────────────────────────────────────────────────
const C = {
  bgCard: '#111a14',
  bgSutil: '#192b1e',
  bordaSutil: '#243d2a',
  verde: '#3d8b5c',
  verdeClaro: '#52b876',
  ocre: '#d4872f',
  textoClaro: '#dfe8da',
  textoMedio: '#7a9e82',
  textoSuave: '#3d5c43',
};

// ─── TEMPLATES PRÉ-PRONTOS ────────────────────────────────────────────────────
const MOTORISTAS_PADRAO = ['Josemir', 'Carlos', 'Antônio'];
const UNIVERSIDADES_PADRAO = [
  { id: 1, label: 'PUBLICAS', rota: 'PUBLICAS' },
  { id: 2, label: 'PARTICULARES', rota: 'PARTICULARES' },
  { id: 3, label: 'IFPB-ESPERANÇA', rota: 'IFPB-ESPERANÇA' },
];
const HORA_PADRAO = '5:30';
const LIMITE_PADRAO = 40;

function getProximaData() {
  const agora = new Date();
  const base = agora.getHours() === 0 ? agora : new Date(agora);
  if (agora.getHours() !== 0) base.setDate(base.getDate() + 1);
  const d = base.getDate().toString().padStart(2, '0');
  const m = (base.getMonth() + 1).toString().padStart(2, '0');
  return `${d}/${m}/${base.getFullYear()}`;
}

const ABAS = [
  { id: 'template', label: 'Pré-pronto', icon: 'lightning-bolt-outline' },
  { id: 'custom', label: 'Personalizado', icon: 'pencil-outline' },
];

// ─── CAMPO FORA DO COMPONENTE PRINCIPAL ──────────────────────────────────────
// Definido aqui fora para que o React não recrie o componente a cada re-render,
// o que desmontaria o TextInput e perderia o foco do teclado.
function Campo({ label, icon, value, onChangeText, placeholder, keyboardType }) {
  return (
    <View style={styles.campoWrapper}>
      <Text style={styles.campoLabel}>{label}</Text>
      <View style={styles.campoInputRow}>
        <View style={styles.campoIconBox}>
          <MaterialCommunityIcons name={icon} size={18} color={C.verde} />
        </View>
        <TextInput
          style={styles.campoInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.textoSuave}
          keyboardType={keyboardType || 'default'}
          autoCapitalize="none"
          autoCorrect={false}
          selectionColor={C.verde}
          blurOnSubmit={false}
        />
      </View>
    </View>
  );
}

// ─── MODAL PRINCIPAL ─────────────────────────────────────────────────────────
export default function NovaViagemModal({ visible, onClose, onSave }) {
  const slideAnim = useRef(new Animated.Value(80)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [aba, setAba] = useState('template');
  const [rotaSel, setRotaSel] = useState(null);
  const [motoristaSel, setMotoristaSel] = useState(null);
  const [rotaCustom, setRotaCustom] = useState('');
  const [horaCustom, setHoraCustom] = useState('');
  const [dataCustom, setDataCustom] = useState('');
  const [motoristaCustom, setMotoristaCustom] = useState('');
  const [limiteCustom, setLimiteCustom] = useState('');

  useEffect(() => {
    if (visible) {
      setRotaSel(null); setMotoristaSel(null);
      setRotaCustom(''); setHoraCustom(''); setDataCustom('');
      setMotoristaCustom(''); setLimiteCustom('');
      setAba('template');
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, damping: 18, stiffness: 200, useNativeDriver: true }),
      ]).start();
    } else {
      slideAnim.setValue(80);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  function handleSave() {
    if (aba === 'template') {
      if (!rotaSel || !motoristaSel) return;
      onSave({ rota: rotaSel.rota, hora: HORA_PADRAO, data: getProximaData(), motorista: motoristaSel, limite: LIMITE_PADRAO });
    } else {
      onSave({
        rota: rotaCustom,
        hora: horaCustom || HORA_PADRAO,
        data: dataCustom || getProximaData(),
        motorista: motoristaCustom,
        limite: parseInt(limiteCustom) || LIMITE_PADRAO,
      });
    }
    onClose();
  }

  const podeConfirmar = aba === 'template'
    ? rotaSel !== null && motoristaSel !== null
    : rotaCustom.trim() !== '' && motoristaCustom.trim() !== '';

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <Animated.View style={[styles.box, { transform: [{ translateY: slideAnim }] }]}>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIcon}>
                  <MaterialCommunityIcons name="bus-marker" size={20} color="#fff" />
                </View>
                <View>
                  <Text style={styles.titulo}>Nova Viagem</Text>
                  <Text style={styles.subtitulo}>Preencha os dados da viagem</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>

            {/* Abas */}
            <View style={styles.abasContainer}>
              {ABAS.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.abaBtn, aba === a.id && styles.abaBtnAtiva]}
                  onPress={() => setAba(a.id)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={a.icon}
                    size={15}
                    color={aba === a.id ? C.verde : C.textoSuave}
                  />
                  <Text style={[styles.abaTexto, aba === a.id && styles.abaTextoAtivo]}>
                    {a.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Conteúdo */}
            <ScrollView
              style={styles.formScroll}
              contentContainerStyle={styles.formContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {aba === 'template' ? (
                <>
                  {/* Banner info */}
                  <View style={styles.infoBanner}>
                    <MaterialCommunityIcons name="information-outline" size={15} color={C.verde} />
                    <Text style={styles.infoTexto}>
                      Data: {getProximaData()} · Hora: {HORA_PADRAO} · Limite: {LIMITE_PADRAO} passageiros
                    </Text>
                  </View>

                  {/* Rotas */}
                  <Text style={styles.secaoLabel}>Universidades / Rota</Text>
                  <View style={styles.opcoesGrid}>
                    {UNIVERSIDADES_PADRAO.map((u) => (
                      <TouchableOpacity
                        key={u.id}
                        style={[styles.opcaoCard, rotaSel?.id === u.id && styles.opcaoCardSel]}
                        onPress={() => setRotaSel(u)}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons
                          name="map-marker-path"
                          size={20}
                          color={rotaSel?.id === u.id ? C.verde : C.textoSuave}
                        />
                        <Text style={[styles.opcaoCardTexto, rotaSel?.id === u.id && styles.opcaoCardTextoSel]}>
                          {u.label}
                        </Text>
                        {rotaSel?.id === u.id && (
                          <MaterialCommunityIcons name="check-circle" size={16} color={C.verde} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Motoristas */}
                  <Text style={[styles.secaoLabel, { marginTop: 14 }]}>Motorista</Text>
                  <View style={styles.motoristasRow}>
                    {MOTORISTAS_PADRAO.map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.motoristaChip, motoristaSel === m && styles.motoristaChipSel]}
                        onPress={() => setMotoristaSel(m)}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons
                          name="account-tie-outline"
                          size={14}
                          color={motoristaSel === m ? '#fff' : C.textoSuave}
                        />
                        <Text style={[styles.motoristaChipTexto, motoristaSel === m && styles.motoristaChipTextoSel]}>
                          {m}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : (
                <>
                  <Campo
                    label="Rota"
                    icon="routes"
                    value={rotaCustom}
                    onChangeText={setRotaCustom}
                    placeholder="Ex: UEPB-UFCG-IFPB"
                  />
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Campo
                        label="Data"
                        icon="calendar-outline"
                        value={dataCustom}
                        onChangeText={setDataCustom}
                        placeholder={getProximaData()}
                      />
                    </View>
                    <View style={{ width: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Campo
                        label="Hora"
                        icon="clock-outline"
                        value={horaCustom}
                        onChangeText={setHoraCustom}
                        placeholder="5:30"
                      />
                    </View>
                  </View>
                  <Campo
                    label="Motorista"
                    icon="account-tie-outline"
                    value={motoristaCustom}
                    onChangeText={setMotoristaCustom}
                    placeholder="Nome do motorista"
                  />
                  <Campo
                    label="Limite de Passageiros"
                    icon="seat-passenger"
                    value={limiteCustom}
                    onChangeText={setLimiteCustom}
                    placeholder="40"
                    keyboardType="numeric"
                  />
                </>
              )}
            </ScrollView>

            {/* Ações */}
            <View style={styles.acoes}>
              <TouchableOpacity style={styles.cancelarBtn} onPress={onClose} activeOpacity={0.75}>
                <Text style={styles.cancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.salvarBtn, !podeConfirmar && styles.salvarBtnDesabilitado]}
                onPress={podeConfirmar ? handleSave : undefined}
                activeOpacity={podeConfirmar ? 0.8 : 1}
              >
                <MaterialCommunityIcons name="plus-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.salvarTexto}>Criar Viagem</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11,17,13,0.7)',
    justifyContent: 'flex-end',
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  box: {
    backgroundColor: C.bgCard,
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: C.bordaSutil,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 14,
  },

  // Header
  header: {
    backgroundColor: C.bgSutil,
    paddingTop: 18, paddingBottom: 18, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: C.bordaSutil,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: C.verde, justifyContent: 'center', alignItems: 'center' },
  titulo: { fontSize: 17, fontWeight: '800', color: C.textoClaro },
  subtitulo: { fontSize: 12, color: C.textoSuave, marginTop: 1 },
  closeBtn: { padding: 4 },

  // Abas
  abasContainer: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 14, marginBottom: 2,
    backgroundColor: C.bgSutil, borderRadius: 12, padding: 4, gap: 4,
    borderWidth: 1, borderColor: C.bordaSutil,
  },
  abaBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 9, borderRadius: 9, gap: 6,
  },
  abaBtnAtiva: { backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.bordaSutil },
  abaTexto: { fontSize: 13, fontWeight: '600', color: C.textoSuave },
  abaTextoAtivo: { color: C.verde },

  // Scroll
  formScroll: { maxHeight: 380 },
  formContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 14 },

  // Banner
  infoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#1a3d26', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: `${C.verde}44`,
  },
  infoTexto: { flex: 1, fontSize: 12, color: C.verdeClaro, fontWeight: '500' },

  // Seções template
  secaoLabel: { fontSize: 11, fontWeight: '700', color: C.textoSuave, letterSpacing: 0.8, textTransform: 'uppercase' },
  opcoesGrid: { gap: 8 },
  opcaoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.bgSutil, borderRadius: 12, padding: 13,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  opcaoCardSel: { backgroundColor: '#1a3d26', borderColor: C.verde },
  opcaoCardTexto: { flex: 1, fontSize: 14, fontWeight: '500', color: C.textoSuave },
  opcaoCardTextoSel: { color: C.textoClaro, fontWeight: '700' },
  motoristasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  motoristaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 9, paddingHorizontal: 14, borderRadius: 20,
    backgroundColor: C.bgSutil, borderWidth: 1.5, borderColor: C.bordaSutil,
  },
  motoristaChipSel: { backgroundColor: C.verde, borderColor: C.verde },
  motoristaChipTexto: { fontSize: 14, fontWeight: '600', color: C.textoSuave },
  motoristaChipTextoSel: { color: '#fff' },

  // Campo
  row: { flexDirection: 'row' },
  campoWrapper: { gap: 6 },
  campoLabel: { fontSize: 11, fontWeight: '700', color: C.textoSuave, letterSpacing: 0.8, textTransform: 'uppercase' },
  campoInputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bgSutil, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: C.bordaSutil,
  },
  campoIconBox: { width: 42, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a3d26' },
  campoInput: { flex: 1, height: 44, paddingHorizontal: 12, fontSize: 15, color: C.textoClaro, fontWeight: '500' },

  // Ações
  acoes: {
    flexDirection: 'row', padding: 16, gap: 10,
    borderTopWidth: 1, borderTopColor: C.bordaSutil,
  },
  cancelarBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 14,
    backgroundColor: C.bgSutil, alignItems: 'center',
    borderWidth: 1, borderColor: C.bordaSutil,
  },
  cancelarTexto: { fontSize: 15, fontWeight: '600', color: C.textoMedio },
  salvarBtn: {
    flex: 2, paddingVertical: 13, borderRadius: 14,
    backgroundColor: C.verde, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center',
    shadowColor: C.verde, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  salvarBtnDesabilitado: { backgroundColor: C.textoSuave, shadowOpacity: 0 },
  salvarTexto: { fontSize: 15, fontWeight: '700', color: '#fff' },
});