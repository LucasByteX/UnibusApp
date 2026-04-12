import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function EscolhaRotaModal({ visible, onClose, onSelect }) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.titulo}>Vai voltar?</Text>

          <TouchableOpacity
            style={styles.botao}
            onPress={() => onSelect("ida")}
          >
            <Text style={styles.texto}>Ida</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botao}
            onPress={() => onSelect("volta")}
          >
            <Text style={styles.texto}>Volta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botao}
            onPress={() => onSelect("ida_volta")}
          >
            <Text style={styles.texto}>Ida e Volta</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelar}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  box: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 5
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center'
  },
  botao: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginBottom: 10,
    alignItems: 'center'
  },
  texto: {
    fontSize: 16
  },
  cancelar: {
    marginTop: 10,
    textAlign: 'center',
    color: 'red'
  }
});