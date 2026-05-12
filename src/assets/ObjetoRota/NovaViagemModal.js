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

// ─── TEMPLATES PRÉ-PRONTOS ────────────────────────────────────────────────────
// Defina aqui os valores padrão. A data será calculada automaticamente.
const MOTORISTAS_PADRAO = ['Josemir', 'Carlos', 'Antônio'];
const UNIVERSIDADES_PADRAO = [
  { id: 1, label: 'UEPB → UFCG → IFPB', rota: 'UEPB-UFCG-IFPB' },
  { id: 2, label: 'UFCG → UEPB', rota: 'UFCG-UEPB' },
  { id: 3, label: 'IFPB → UEPB → UFCG', rota: 'IFPB-UEPB-UFCG' },
];
const HORA_PADRAO = '5:30';
const LIMITE_PADRAO = 40;

function getProximaData() {
  const agora = new Date();
  const meianoite = new Date(agora);
  meianoite.setHours(0, 0, 0, 0);
  const meianoiteProx = new Date(meianoite);
  meianoiteProx.setDate(meianoiteProx.getDate() + 1);

  // Se estiver entre meia-noite e antes das 23:59, usa o mesmo dia, senão próximo
  const alvo = agora.getHours() >= 0 && agora < meianoiteProx ? new Date(agora) : meianoiteProx;
  alvo.setDate(alvo.getDate() + (agora.getHours() === 0 ? 0 : 1));

  // Regra: se for meia-noite (hora === 0), considera mesmo dia, senão próximo dia
  const base = agora.getHours() === 0 ? agora : meianoiteProx;
  const d = base.getDate().toString().padStart(2, '0');
  const m = (base.getMonth() + 1).toString().padStart(2, '0');
  const a = base.getFullYear();
  return `${d}/${m}/${a}`;
}
// ─────────────────────────────────────────────────────────────────────────────

const ABAS = [
  { id: 'template', label: 'Pré-pronto', icon: 'lightning-bolt-outline' },
  { id: 'custom', label: 'Personalizado', icon: 'pencil-outline' },
];

export default function NovaViagemModal({ visible, onClose, onSave }) {
  const slideAnim = useRef(new Animated.Value(80)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [aba, setAba] = useState('template');

  // Template state
  const [rotaSel, setRotaSel] = useState(null);
  const [motoristaSel, setMotoristaSel] = useState(null);

  // Custom state
  const [rotaCustom, setRotaCustom] = useState('');
  const [horaCustom, setHoraCustom] = useState('');
  const [dataCustom, setDataCustom] = useState('');
  const [motoristaCustom, setMotoristaCustom] = useState('');
  const [limiteCustom, setLimiteCustom] = useState('');

  useEffect(() => {
    if (visible) {
      setRotaSel(null);
      setMotoristaSel(null);
      setRotaCustom('');
      setHoraCustom('');
      setDataCustom('');
      setMotoristaCustom('');
      setLimiteCustom('');
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
      onSave({
        rota: rotaSel.rota,
        hora: HORA_PADRAO,
        data: getProximaData(),
        motorista: motoristaSel,
        limite: LIMITE_PADRAO,
        pessoas: 0,
      });
    } else {
      onSave({
        rota: rotaCustom,
        hora: horaCustom || HORA_PADRAO,
        data: dataCustom || getProximaData(),
        motorista: motoristaCustom,
        limite: parseInt(limiteCustom) || LIMITE_PADRAO,
        pessoas: 0,
      });
    }
    onClose();
  }

  const podeConfirmar =
    aba === 'template'
      ? rotaSel !== null && motoristaSel !== null
      : rotaCustom.trim() !== '' && motoristaCustom.trim() !== '';

  const Campo = ({ label, icon, value, onChangeText, placeholder, keyboardType }) => (
    <View style={styles.campoWrapper}>
      <Text style={styles.campoLabel}>{label}</Text>
      <View style={styles.campoInputRow}>
        <View style={styles.campoIconBox}>
          <MaterialCommunityIcons name={icon} size={18} color="#1a56db" />
        </View>
        <TextInput
          style={styles.campoInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#b0b8cc"
          keyboardType={keyboardType || 'default'}
        />
      </View>
    </View>
  );

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <Animated.View style={[styles.box, { transform: [{ translateY: slideAnim }] }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIcon}>
                  <MaterialCommunityIcons name="bus-plus" size={20} color="#fff" />
                </View>
                <View>
                  <Text style={styles.titulo}>Nova Viagem</Text>
                  <Text style={styles.subtitulo}>Preencha os dados da viagem</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={20} color="rgba(255,255,255,0.7)" />
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
                    color={aba === a.id ? '#1a56db' : '#8a95aa'}
                  />
                  <Text style={[styles.abaTexto, aba === a.id && styles.abaTextoAtivo]}>
                    {a.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView
              style={styles.formScroll}
              contentContainerStyle={styles.formContent}
              showsVerticalScrollIndicator={false}
            >
              {aba === 'template' ? (
                <>
                  {/* Info banner */}
                  <View style={styles.infoBanner}>
                    <MaterialCommunityIcons name="information-outline" size={16} color="#1a56db" />
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
                          color={rotaSel?.id === u.id ? '#1a56db' : '#8a95aa'}
                        />
                        <Text
                          style={[
                            styles.opcaoCardTexto,
                            rotaSel?.id === u.id && styles.opcaoCardTextoSel,
                          ]}
                        >
                          {u.label}
                        </Text>
                        {rotaSel?.id === u.id && (
                          <MaterialCommunityIcons name="check-circle" size={16} color="#1a56db" />
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
                        style={[
                          styles.motoristaChip,
                          motoristaSel === m && styles.motoristaChipSel,
                        ]}
                        onPress={() => setMotoristaSel(m)}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons
                          name="account-tie-outline"
                          size={14}
                          color={motoristaSel === m ? '#fff' : '#5a6480'}
                        />
                        <Text
                          style={[
                            styles.motoristaChipTexto,
                            motoristaSel === m && styles.motoristaChipTextoSel,
                          ]}
                        >
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
                        keyboardType="numeric"
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
                        keyboardType="numeric"
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

            {/* Actions */}
            <View style={styles.acoes}>
              <TouchableOpacity style={styles.cancelarBtn} onPress={onClose} activeOpacity={0.75}>
                <Text style={styles.cancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.salvarBtn, !podeConfirmar && styles.salvarBtnDesabilitado]}
                onPress={podeConfirmar ? handleSave : undefined}
                activeOpacity={podeConfirmar ? 0.8 : 1}
              >
                <MaterialCommunityIcons
                  name="plus-circle-outline"
                  size={18}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
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
    backgroundColor: 'rgba(10,15,35,0.55)',
    justifyContent: 'flex-end',
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 14,
  },
  header: {
    backgroundColor: '#1a56db',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titulo: { fontSize: 18, fontWeight: '800', color: '#fff' },
  subtitulo: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  closeBtn: { padding: 4 },
  abasContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  abaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
    gap: 6,
  },
  abaBtnAtiva: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  abaTexto: { fontSize: 13, fontWeight: '600', color: '#8a95aa' },
  abaTextoAtivo: { color: '#1a56db' },
  formScroll: { maxHeight: 380 },
  formContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, gap: 14 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0f4ff',
    borderRadius: 10,
    padding: 12,
  },
  infoTexto: { flex: 1, fontSize: 12, color: '#1a56db', fontWeight: '500' },
  secaoLabel: { fontSize: 12, fontWeight: '700', color: '#5a6480', letterSpacing: 0.5, textTransform: 'uppercase' },
  opcoesGrid: { gap: 8 },
  opcaoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f5f7fb',
    borderRadius: 12,
    padding: 13,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  opcaoCardSel: { backgroundColor: '#eef3ff', borderColor: '#1a56db' },
  opcaoCardTexto: { flex: 1, fontSize: 14, fontWeight: '500', color: '#5a6480' },
  opcaoCardTextoSel: { color: '#1a2340', fontWeight: '700' },
  motoristasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  motoristaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#f5f7fb',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  motoristaChipSel: { backgroundColor: '#1a56db', borderColor: '#1a56db' },
  motoristaChipTexto: { fontSize: 14, fontWeight: '600', color: '#5a6480' },
  motoristaChipTextoSel: { color: '#fff' },
  row: { flexDirection: 'row' },
  campoWrapper: { gap: 6 },
  campoLabel: { fontSize: 12, fontWeight: '700', color: '#5a6480', letterSpacing: 0.5, textTransform: 'uppercase' },
  campoInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f4ff', borderRadius: 12, overflow: 'hidden' },
  campoIconBox: { width: 42, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: '#dce8ff' },
  campoInput: { flex: 1, height: 44, paddingHorizontal: 12, fontSize: 15, color: '#1a2340', fontWeight: '500' },
  acoes: { flexDirection: 'row', padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: '#eef0f6' },
  cancelarBtn: { flex: 1, paddingVertical: 13, borderRadius: 14, backgroundColor: '#f5f6f9', alignItems: 'center' },
  cancelarTexto: { fontSize: 15, fontWeight: '600', color: '#7a8499' },
  salvarBtn: { flex: 2, paddingVertical: 13, borderRadius: 14, backgroundColor: '#1a56db', alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  salvarBtnDesabilitado: { backgroundColor: '#aab8e0' },
  salvarTexto: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
