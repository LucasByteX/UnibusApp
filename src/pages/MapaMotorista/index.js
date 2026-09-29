/**
 * MapaMotorista.js
 * Exibe a localização em tempo real do ônibus no mapa.
 * Disponível para todos quando o motorista ativa o rastreamento.
 *
 * Firestore:
 *   Rastreamento/{viagemId} → {
 *     lat, lng, ativo, motoristaUid, motoristaNome,
 *     atualizadoEm, expiraEm (3h após ativação)
 *   }
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, StatusBar, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConnection';

const C = {
  bgProfundo: '#0b110d', bgCard: '#111a14', bgSutil: '#192b1e',
  bordaSutil: '#243d2a', verde: '#3d8b5c', verdeClaro: '#52b876',
  ocre: '#d4872f', textoClaro: '#dfe8da', textoMedio: '#7a9e82',
  textoSuave: '#3d5c43', erro: '#c0392b',
};

const AREIA_PB = { latitude: -6.9661, longitude: -35.7003 };

export default function MapaMotorista({ route, navigation }) {
  const { viagemId, rotaNome, motoristaNome } = route.params;

  const [rastreamento, setRastreamento] = useState(null);
  const [semSinal, setSemSinal]         = useState(false);
  const [carregando, setCarregando]     = useState(true);
  const mapRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animação de pulso no marcador
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Listener em tempo real do rastreamento
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'Rastreamento', viagemId),
      (snap) => {
        setSemSinal(false);
        setCarregando(false);
        if (!snap.exists()) { setRastreamento(null); return; }
        const dados = snap.data();
        // Verifica se expirou (3h)
        if (dados.expiraEm && Date.now() > dados.expiraEm) {
          setRastreamento(null); return;
        }
        setRastreamento(dados);
        // Centraliza o mapa na nova posição
        if (dados.lat && dados.lng && mapRef.current) {
          mapRef.current.animateToRegion({
            latitude:      dados.lat,
            longitude:     dados.lng,
            latitudeDelta:  0.01,
            longitudeDelta: 0.01,
          }, 800);
        }
      },
      (err) => {
        // Erro de rede — marca sem sinal mas não quebra
        setSemSinal(true);
        setCarregando(false);
      }
    );
    return unsub;
  }, [viagemId]);

  const ativo = rastreamento?.ativo && rastreamento?.lat && rastreamento?.lng;

  // Tempo desde última atualização
  function tempoAtras() {
    if (!rastreamento?.atualizadoEm) return '';
    const diff = Math.floor((Date.now() - rastreamento.atualizadoEm) / 1000);
    if (diff < 60)  return `${diff}s atrás`;
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
    return `${Math.floor(diff / 3600)}h atrás`;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.bgProfundo} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.voltarBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={C.textoMedio} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitulo} numberOfLines={1}>{rotaNome}</Text>
          <Text style={styles.headerSub}>Motorista: {motoristaNome}</Text>
        </View>
        {/* Indicador de status */}
        <View style={[styles.statusBadge, {
          backgroundColor: ativo ? '#1a3d26' : '#2a1a00',
          borderColor: ativo ? `${C.verde}55` : `${C.ocre}55`,
        }]}>
          <View style={[styles.statusDot, { backgroundColor: ativo ? C.verde : C.ocre }]} />
          <Text style={[styles.statusTexto, { color: ativo ? C.verde : C.ocre }]}>
            {ativo ? 'Ao vivo' : 'Offline'}
          </Text>
        </View>
      </View>

      {/* Mapa */}
      <View style={styles.mapaContainer}>
        {carregando ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator size="large" color={C.verde} />
            <Text style={styles.loadingTexto}>Conectando ao rastreamento…</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.mapa}
            mapType="none"
            initialRegion={{
              latitude:      ativo ? rastreamento.lat : AREIA_PB.latitude,
              longitude:     ativo ? rastreamento.lng : AREIA_PB.longitude,
              latitudeDelta:  0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {/* Tiles gratuitos do OpenStreetMap — sem API Key */}
            <UrlTile
              urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
              tileSize={256}
            />
            {ativo && (
              <Marker
                coordinate={{ latitude: rastreamento.lat, longitude: rastreamento.lng }}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.marcadorWrapper}>
                  <Animated.View style={[styles.marcadorPulse, { transform: [{ scale: pulseAnim }] }]} />
                  <View style={styles.marcadorIcone}>
                    <MaterialCommunityIcons name="bus" size={22} color="#fff" />
                  </View>
                </View>
              </Marker>
            )}
          </MapView>
        )}

        {/* Overlay quando offline ou sem sinal */}
        {!carregando && !ativo && (
          <View style={styles.offlineOverlay}>
            <View style={styles.offlineCard}>
              <MaterialCommunityIcons
                name={semSinal ? 'wifi-off' : 'bus-clock'}
                size={40}
                color={C.ocre}
              />
              <Text style={styles.offlineTitulo}>
                {semSinal ? 'Sem conexão' : 'Rastreamento inativo'}
              </Text>
              <Text style={styles.offlineDesc}>
                {semSinal
                  ? 'Aguardando rede para receber localização do ônibus…'
                  : 'O motorista não ativou o rastreamento ainda ou ele foi encerrado.'}
              </Text>
            </View>
          </View>
        )}

        {/* Badge de atualização */}
        {ativo && (
          <View style={styles.atualizadoBadge}>
            <MaterialCommunityIcons name="clock-outline" size={12} color={C.textoMedio} />
            <Text style={styles.atualizadoTexto}>Atualizado {tempoAtras()}</Text>
          </View>
        )}

        {/* Sem sinal mas com última posição conhecida */}
        {semSinal && ativo && (
          <View style={styles.semSinalBadge}>
            <MaterialCommunityIcons name="wifi-off" size={12} color={C.ocre} />
            <Text style={styles.semSinalTexto}>Sem sinal — última posição conhecida</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.bgProfundo },
  header:  {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.bordaSutil,
    backgroundColor: C.bgCard,
  },
  voltarBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.bgSutil, borderWidth: 1, borderColor: C.bordaSutil,
    justifyContent: 'center', alignItems: 'center',
  },
  headerInfo:   { flex: 1 },
  headerTitulo: { fontSize: 15, fontWeight: '800', color: C.textoClaro },
  headerSub:    { fontSize: 12, color: C.textoSuave, marginTop: 1 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1,
  },
  statusDot:   { width: 7, height: 7, borderRadius: 4 },
  statusTexto: { fontSize: 12, fontWeight: '700' },

  mapaContainer: { flex: 1, position: 'relative' },
  mapa:          { flex: 1 },

  loadingArea: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: C.bgProfundo, gap: 12,
  },
  loadingTexto: { fontSize: 14, color: C.textoMedio },

  // Marcador
  marcadorWrapper: { alignItems: 'center', justifyContent: 'center' },
  marcadorPulse: {
    position: 'absolute', width: 52, height: 52, borderRadius: 26,
    backgroundColor: `${C.verde}33`,
  },
  marcadorIcone: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.verde, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 6,
  },

  // Overlay offline
  offlineOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(11,17,13,0.82)',
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  offlineCard: {
    backgroundColor: C.bgCard, borderRadius: 20, padding: 28,
    alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.bordaSutil, width: '100%',
  },
  offlineTitulo: { fontSize: 18, fontWeight: '800', color: C.textoClaro },
  offlineDesc:   { fontSize: 13, color: C.textoMedio, textAlign: 'center', lineHeight: 20 },

  // Badges
  atualizadoBadge: {
    position: 'absolute', bottom: 16, left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(17,26,20,0.9)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: C.bordaSutil,
  },
  atualizadoTexto: { fontSize: 11, color: C.textoMedio, fontWeight: '500' },
  semSinalBadge: {
    position: 'absolute', top: 12, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#2a1a00', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: `${C.ocre}55`,
    justifyContent: 'center',
  },
  semSinalTexto: { fontSize: 12, color: C.ocre, fontWeight: '600' },
});