import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const OPCOES = [
  { label: 'Somente Ida', value: 'ida', icon: 'arrow-right-circle-outline' },
  { label: 'Somente Volta', value: 'volta', icon: 'arrow-left-circle-outline' },
  { label: 'Ida e Volta', value: 'ida_volta', icon: 'swap-horizontal-circle-outline' },
];

export default function EscolhaRotaModal({ visible, onClose, onSelect }) {
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 18,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(60);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[styles.box, { transform: [{ translateY: slideAnim }] }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons name="routes" size={22} color="#fff" />
            </View>
            <Text style={styles.titulo}>Tipo de Viagem</Text>
            <Text style={styles.subtitulo}>Selecione o trajeto desejado</Text>
          </View>

          {/* Options */}
          <View style={styles.opcoesContainer}>
            {OPCOES.map((opcao) => (
              <TouchableOpacity
                key={opcao.value}
                style={styles.opcaoBotao}
                onPress={() => onSelect(opcao.value)}
                activeOpacity={0.75}
              >
                <View style={styles.opcaoIconBox}>
                  <MaterialCommunityIcons name={opcao.icon} size={22} color="#1a56db" />
                </View>
                <Text style={styles.opcaoTexto}>{opcao.label}</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color="#aab4c8" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel */}
          <TouchableOpacity style={styles.cancelarBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.cancelarTexto}>Cancelar</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,15,35,0.55)',
    justifyContent: 'flex-end',
    paddingBottom: 28,
    paddingHorizontal: 16,
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
  header: {
    backgroundColor: '#1a56db',
    paddingTop: 24,
    paddingBottom: 22,
    paddingHorizontal: 24,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  subtitulo: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 3,
  },
  opcoesContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    gap: 8,
  },
  opcaoBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  opcaoIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#dce8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  opcaoTexto: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1a2340',
  },
  cancelarBtn: {
    marginHorizontal: 16,
    marginVertical: 14,
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
});
