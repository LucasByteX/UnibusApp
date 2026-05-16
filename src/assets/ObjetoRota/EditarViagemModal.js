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
  bgCard:     '#111a14',
  bgSutil:    '#192b1e',
  bordaSutil: '#243d2a',
  verde:      '#3d8b5c',
  ocre:       '#d4872f',
  textoClaro: '#dfe8da',
  textoMedio: '#7a9e82',
  textoSuave: '#3d5c43',
};

// ─── CAMPO FORA DO COMPONENTE PRINCIPAL ──────────────────────────────────────
// IMPORTANTE: definir aqui fora evita que o componente seja recriado a cada
// re-render do modal (o que desmontava o TextInput e perdia o foco do teclado)
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
          // Impede que o scroll do modal roube o foco
          blurOnSubmit={false}
        />
      </View>
    </View>
  );
}

// ─── MODAL PRINCIPAL ─────────────────────────────────────────────────────────
export default function EditarViagemModal({ visible, onClose, onSave, dadosViagem }) {
  const slideAnim = useRef(new Animated.Value(80)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  const [rota,      setRota]      = useState('');
  const [hora,      setHora]      = useState('');
  const [data,      setData]      = useState('');
  const [motorista, setMotorista] = useState('');
  const [limite,    setLimite]    = useState('');

  useEffect(() => {
    if (visible && dadosViagem) {
      setRota(dadosViagem.rota           || '');
      setHora(dadosViagem.hora           || '');
      setData(dadosViagem.data           || '');
      setMotorista(dadosViagem.motorista || '');
      setLimite(String(dadosViagem.limite || ''));

      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, damping: 18, stiffness: 200, useNativeDriver: true }),
      ]).start();
    } else {
      slideAnim.setValue(80);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  function handleSave() {
    onSave({ rota, hora, data, motorista, limite: parseInt(limite) || 40 });
  }

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={onClose}
      // Garante que o modal não feche ao tocar fora enquanto digita
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
                  <MaterialCommunityIcons name="pencil-outline" size={20} color="#fff" />
                </View>
                <View>
                  <Text style={styles.titulo}>Editar Viagem</Text>
                  <Text style={styles.subtitulo}>Altere as informações abaixo</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>

            {/* Form — keyboardShouldPersistTaps evita que tap no scroll tire o foco */}
            <ScrollView
              style={styles.formScroll}
              contentContainerStyle={styles.formContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Campo
                label="Rota"
                icon="routes"
                value={rota}
                onChangeText={setRota}
                placeholder="Ex: UEPB-UFCG-IFPB"
              />
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Campo
                    label="Data"
                    icon="calendar-outline"
                    value={data}
                    onChangeText={setData}
                    placeholder="DD/MM/AAAA"
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Campo
                    label="Hora"
                    icon="clock-outline"
                    value={hora}
                    onChangeText={setHora}
                    placeholder="HH:MM"
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <Campo
                label="Motorista"
                icon="account-tie-outline"
                value={motorista}
                onChangeText={setMotorista}
                placeholder="Nome do motorista"
              />
              <Campo
                label="Limite de Passageiros"
                icon="seat-passenger"
                value={limite}
                onChangeText={setLimite}
                placeholder="Ex: 40"
                keyboardType="numeric"
              />
            </ScrollView>

            {/* Ações */}
            <View style={styles.acoes}>
              <TouchableOpacity style={styles.cancelarBtn} onPress={onClose} activeOpacity={0.75}>
                <Text style={styles.cancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.salvarBtn} onPress={handleSave} activeOpacity={0.8}>
                <MaterialCommunityIcons name="check" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.salvarTexto}>Salvar</Text>
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
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: C.bordaSutil,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 14,
  },
  header: {
    backgroundColor: C.bgSutil,
    paddingTop: 18,
    paddingBottom: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: C.bordaSutil,
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
    backgroundColor: C.verde,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titulo:    { fontSize: 17, fontWeight: '800', color: C.textoClaro },
  subtitulo: { fontSize: 12, color: C.textoSuave, marginTop: 1 },
  closeBtn:  { padding: 4 },
  formScroll: { maxHeight: 340 },
  formContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    gap: 14,
  },
  row: { flexDirection: 'row' },

  // Campo
  campoWrapper:  { gap: 6 },
  campoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textoSuave,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  campoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bgSutil,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.bordaSutil,
  },
  campoIconBox: {
    width: 42,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a3d26',
  },
  campoInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 15,
    color: C.textoClaro,
    fontWeight: '500',
  },

  // Ações
  acoes: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: C.bordaSutil,
  },
  cancelarBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: C.bgSutil,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.bordaSutil,
  },
  cancelarTexto: { fontSize: 15, fontWeight: '600', color: C.textoMedio },
  salvarBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: C.verde,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: C.verde,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  salvarTexto: { fontSize: 15, fontWeight: '700', color: '#fff' },
});