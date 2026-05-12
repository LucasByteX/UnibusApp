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
import { MaterialCommunityIcons, Entypo } from '@expo/vector-icons';

export default function EditarViagemModal({ visible, onClose, onSave, dadosViagem }) {
  const slideAnim = useRef(new Animated.Value(80)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [rota, setRota] = useState('');
  const [hora, setHora] = useState('');
  const [data, setData] = useState('');
  const [motorista, setMotorista] = useState('');
  const [limite, setLimite] = useState('');

  useEffect(() => {
    if (visible && dadosViagem) {
      setRota(dadosViagem.rota || '');
      setHora(dadosViagem.hora || '');
      setData(dadosViagem.data || '');
      setMotorista(dadosViagem.motorista || '');
      setLimite(String(dadosViagem.limite || ''));
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
    onSave({ rota, hora, data, motorista, limite: parseInt(limite) || 40 });
  }

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
                  <MaterialCommunityIcons name="pencil-outline" size={20} color="#fff" />
                </View>
                <View>
                  <Text style={styles.titulo}>Editar Viagem</Text>
                  <Text style={styles.subtitulo}>Altere as informações abaixo</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={20} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView
              style={styles.formScroll}
              contentContainerStyle={styles.formContent}
              showsVerticalScrollIndicator={false}
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

            {/* Actions */}
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
    backgroundColor: 'rgba(10,15,35,0.55)',
    justifyContent: 'flex-end',
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: '90%',
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
  titulo: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  subtitulo: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  formScroll: {
    maxHeight: 340,
  },
  formContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
  },
  campoWrapper: {
    gap: 6,
  },
  campoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5a6480',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  campoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  campoIconBox: {
    width: 42,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#dce8ff',
  },
  campoInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#1a2340',
    fontWeight: '500',
  },
  acoes: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#eef0f6',
  },
  cancelarBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#f5f6f9',
    alignItems: 'center',
  },
  cancelarTexto: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7a8499',
  },
  salvarBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#1a56db',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  salvarTexto: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
