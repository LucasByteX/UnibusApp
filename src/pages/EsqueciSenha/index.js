import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Animated, KeyboardAvoidingView, Platform, StatusBar,
  ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebaseConnection';

// ─── PALETA AREIA-PB ─────────────────────────────────────────────────────────
const C = {
  bgProfundo: '#0b110d',
  bgCard:     '#111a14',
  bgSutil:    '#192b1e',
  bordaSutil: '#243d2a',
  verde:      '#3d8b5c',
  verdeClaro: '#52b876',
  terracota:  '#c2622a',
  ocre:       '#d4872f',
  textoClaro: '#dfe8da',
  textoMedio: '#7a9e82',
  textoSuave: '#3d5c43',
};

export default function EsqueciSenha() {
  const navigation  = useNavigation();
  const [email, setEmail]           = useState('');
  const [focado, setFocado]         = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [enviado, setEnviado]       = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(36)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 22, stiffness: 140, useNativeDriver: true }),
    ]).start();
  }, []);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [C.bordaSutil, C.verde],
  });

  async function enviarEmail() {
    if (!email.trim()) {
      Alert.alert('Atenção', 'Informe seu e-mail.');
      return;
    }

    setCarregando(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setEnviado(true);
    } catch (erro) {
      const msgs = {
        'auth/user-not-found':        'Nenhuma conta encontrada com este e-mail.',
        'auth/invalid-email':         'E-mail inválido.',
        'auth/network-request-failed':'Sem conexão com a internet.',
        'auth/too-many-requests':     'Muitas tentativas. Aguarde alguns minutos.',
      };
      Alert.alert('Erro', msgs[erro.code] || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={C.bgProfundo} />

      <View style={styles.bg}>
        <View style={styles.manchaVerde} />
        <View style={styles.manchaTerracota} />
      </View>

      <View style={styles.tela}>
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* Voltar */}
          <TouchableOpacity style={styles.voltarBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={18} color={C.textoMedio} />
          </TouchableOpacity>

          {/* Ícone */}
          <View style={styles.iconeArea}>
            <View style={styles.iconeBg}>
              <MaterialCommunityIcons name="lock-reset" size={28} color="#fff" />
            </View>
          </View>

          {!enviado ? (
            // ── Formulário ─────────────────────────────────────────────────
            <>
              <Text style={styles.titulo}>Redefinir Senha</Text>
              <Text style={styles.subtitulo}>
                Informe seu e-mail e enviaremos um link para você criar uma nova senha.
              </Text>

              <View style={styles.dividerFolha}>
                <View style={styles.divLinha} />
                <MaterialCommunityIcons name="leaf" size={13} color={C.verdeClaro} style={{ marginHorizontal: 8 }} />
                <View style={styles.divLinha} />
              </View>

              <Text style={styles.campoLabel}>E-mail</Text>
              <Animated.View style={[styles.campoLinha, { borderBottomColor: borderColor }]}>
                <TextInput
                  style={styles.campoInput}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor={C.textoSuave}
                  selectionColor={C.verde}
                  onFocus={() => {
                    setFocado(true);
                    Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
                  }}
                  onBlur={() => {
                    setFocado(false);
                    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
                  }}
                />
              </Animated.View>

              <TouchableOpacity
                style={[styles.botaoEnviar, carregando && { opacity: 0.6 }]}
                onPress={enviarEmail}
                disabled={carregando}
                activeOpacity={0.85}
              >
                {carregando ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.botaoEnviarTexto}>Enviar Link</Text>
                    <MaterialCommunityIcons name="send-outline" size={18} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            // ── Sucesso ────────────────────────────────────────────────────
            <>
              <View style={styles.sucessoArea}>
                <MaterialCommunityIcons name="email-check-outline" size={52} color={C.verdeClaro} />
              </View>
              <Text style={styles.titulo}>E-mail Enviado!</Text>
              <Text style={styles.subtitulo}>
                Enviamos um link de redefinição para{'\n'}
                <Text style={{ color: C.verde, fontWeight: '700' }}>{email}</Text>
                {'\n\n'}Verifique sua caixa de entrada e siga as instruções.
              </Text>

              <View style={styles.dividerFolha}>
                <View style={styles.divLinha} />
                <MaterialCommunityIcons name="leaf" size={13} color={C.verdeClaro} style={{ marginHorizontal: 8 }} />
                <View style={styles.divLinha} />
              </View>

              <TouchableOpacity
                style={styles.botaoEnviar}
                onPress={() => { setEnviado(false); setEmail(''); }}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
                <Text style={styles.botaoEnviarTexto}>Usar outro e-mail</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Voltar ao login */}
          <TouchableOpacity
            style={styles.voltarLoginBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.75}
          >
            <Text style={styles.voltarLoginTexto}>Voltar ao login</Text>
          </TouchableOpacity>

        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: C.bgProfundo,
  },
  manchaVerde: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: C.verde, opacity: 0.07, top: -80, right: -60,
  },
  manchaTerracota: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: C.terracota, opacity: 0.05, bottom: -40, left: -40,
  },
  tela: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24,
  },
  card: {
    width: '100%', backgroundColor: C.bgCard,
    borderRadius: 28, padding: 28,
    borderWidth: 1, borderColor: C.bordaSutil,
    shadowColor: C.verde, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, shadowRadius: 24, elevation: 12,
  },
  voltarBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.bgSutil, borderWidth: 1, borderColor: C.bordaSutil,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  iconeArea:  { alignItems: 'center', marginBottom: 16 },
  iconeBg: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: C.verde, justifyContent: 'center', alignItems: 'center',
    shadowColor: C.verde, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  sucessoArea: { alignItems: 'center', marginBottom: 16 },
  titulo:     { fontSize: 20, fontWeight: '800', color: C.textoClaro, marginBottom: 8 },
  subtitulo:  { fontSize: 13, color: C.textoMedio, lineHeight: 20, marginBottom: 20 },
  dividerFolha: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  divLinha:     { flex: 1, height: 1, backgroundColor: C.bordaSutil },
  campoLabel: {
    fontSize: 11, fontWeight: '700', color: C.textoSuave,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8,
  },
  campoLinha:  { borderBottomWidth: 1.5, marginBottom: 28 },
  campoInput:  { fontSize: 15, color: C.textoClaro, paddingVertical: 6 },
  botaoEnviar: {
    backgroundColor: C.verde, borderRadius: 14, paddingVertical: 15,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    shadowColor: C.verde, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  botaoEnviarTexto: { fontSize: 16, fontWeight: '700', color: '#fff' },
  voltarLoginBtn: {
    marginTop: 16, paddingVertical: 13, alignItems: 'center',
    borderWidth: 1.5, borderColor: C.bordaSutil, borderRadius: 14,
  },
  voltarLoginTexto: { fontSize: 15, fontWeight: '600', color: C.textoMedio },
});
