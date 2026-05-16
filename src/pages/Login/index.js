import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Animated, KeyboardAvoidingView, Platform, StatusBar,
  ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConnection';
import SecurityInput from '../../assets/SecurityInput';

// ─── PALETA AREIA-PB ─────────────────────────────────────────────────────────
// Terra úmida do brejo + verde-floresta + terracota colonial
const C = {
  bgProfundo:  '#0b110d', // terra úmida da serra
  bgCard:      '#111a14', // interior de engenho, folha escura
  bgSutil:     '#192b1e', // musgo sobre pedra colonial
  bordaSutil:  '#243d2a', // bambu seco
  verde:       '#3d8b5c', // mata viva do Pau-Ferro
  verdeClaro:  '#52b876', // brotos de cana
  verdeEscuro: '#2a6b42', // sombra da mata fechada
  terracota:   '#c2622a', // fachada colonial
  ocre:        '#d4872f', // rapadura, melaço
  textoClaro:  '#dfe8da', // neblina fina sobre folhagem
  textoMedio:  '#7a9e82', // musgo claro
  textoSuave:  '#3d5c43', // sombra de folha
};

function traduzirErroAuth(code) {
  const erros = {
    'auth/user-not-found':        'Nenhuma conta encontrada com este e-mail.',
    'auth/wrong-password':        'Senha incorreta. Tente novamente.',
    'auth/invalid-email':         'E-mail inválido.',
    'auth/invalid-credential':    'E-mail ou senha incorretos.',
    'auth/too-many-requests':     'Muitas tentativas. Aguarde alguns minutos.',
    'auth/user-disabled':         'Esta conta foi desativada.',
    'auth/network-request-failed':'Sem conexão com a internet.',
  };
  return erros[code] || 'Ocorreu um erro. Tente novamente.';
}

function CampoTexto({ label, value, onChangeText, keyboardType, autoCapitalize }) {
  const [focado, setFocado] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [C.bordaSutil, C.verde],
  });

  return (
    <View style={campo.wrapper}>
      <Text style={[campo.label, focado && { color: C.verde }]}>{label}</Text>
      <Animated.View style={[campo.linha, { borderBottomColor: borderColor }]}>
        <TextInput
          style={campo.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'none'}
          autoCorrect={false}
          placeholderTextColor={C.textoSuave}
          onFocus={() => {
            setFocado(true);
            Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
          }}
          onBlur={() => {
            setFocado(false);
            Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
          }}
          selectionColor={C.verde}
        />
      </Animated.View>
    </View>
  );
}

const campo = StyleSheet.create({
  wrapper: { marginBottom: 24 },
  label: { fontSize: 11, fontWeight: '700', color: C.textoSuave, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  linha: { borderBottomWidth: 1.5 },
  input: { fontSize: 15, color: C.textoClaro, paddingVertical: 6 },
});

export default function Login() {
  const navigation = useNavigation();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [carregando, setCarregando] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(36)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 520, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 22, stiffness: 140, useNativeDriver: true }),
    ]).start();
  }, []);

  async function entrar() {
  if (!email.trim()) { Alert.alert('Atenção', 'Informe seu e-mail.'); return; }
  if (!password)     { Alert.alert('Atenção', 'Informe sua senha.'); return; }

  setCarregando(true);
  console.log('1 - Tentando logar:', email.trim());
  
  try {
    const credencial = await signInWithEmailAndPassword(auth, email.trim(), password);
    console.log('2 - Auth OK, uid:', credencial.user.uid);
    
    const snap = await getDoc(doc(db, 'Users', credencial.user.uid));
    console.log('3 - Snap existe?', snap.exists());
    console.log('4 - Dados:', snap.data());

    if (!snap.exists()) {
      console.log('5 - Usuário não encontrado no Firestore');
      Alert.alert('Erro', 'Usuário não encontrado no sistema.');
      await auth.signOut();
      setCarregando(false);
      return;
    }

    const { status, cargo } = snap.data();
    console.log('6 - Status:', status, '| Cargo:', cargo);

    if (status === 'banido') {
      console.log('7 - Banido');
      Alert.alert('Acesso Bloqueado', 'Sua conta foi banida.');
      await auth.signOut();
      setCarregando(false);
      return;
    }

    if (status === 'analise') {
      console.log('8 - Em análise');
      Alert.alert('Em Análise', 'Cadastro ainda em análise.');
      await auth.signOut();
      setCarregando(false);
      return;
    }

    console.log('9 - Login OK, aguardando AuthContext redirecionar...');
    setPassword('');

  } catch (erro) {
    console.log('ERRO:', erro.code, erro.message);
    Alert.alert('Erro ao entrar', traduzirErroAuth(erro.code));
  } finally {
    setCarregando(false);
  }
}

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={C.bgProfundo} />

      {/* Fundo com textura de gradiente */}
      <View style={styles.bg}>
        {/* Mancha de luz verde-floresta */}
        <View style={styles.manchaVerde} />
        {/* Mancha terracota colonial sutil */}
        <View style={styles.manchaTerracota} />
      </View>

      <View style={styles.tela}>
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* Identidade */}
          <View style={styles.idArea}>
            <View style={styles.iconeBg}>
              <MaterialCommunityIcons name="bus-electric" size={28} color="#fff" />
            </View>
            <View>
              <Text style={styles.appNome}>Unibus</Text>
              <Text style={styles.appSub}>Areia · Brejo Paraibano</Text>
            </View>
          </View>

          {/* Divider decorativo */}
          <View style={styles.dividerOcre}>
            <View style={styles.dividerLinha} />
            <MaterialCommunityIcons name="leaf" size={14} color={C.verdeClaro} style={{ marginHorizontal: 8 }} />
            <View style={styles.dividerLinha} />
          </View>

          <Text style={styles.titulo}>Bem-vindo de volta</Text>
          <Text style={styles.subtitulo}>Faça login para continuar</Text>

          <View style={{ marginTop: 24 }}>
            <CampoTexto
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <Text style={styles.senhaLabel}>Senha</Text>
            <SecurityInput value={password} onChangeText={setPassword} placeholder="" />
          </View>

          <TouchableOpacity
            style={[styles.botaoEntrar, carregando && { opacity: 0.6 }]}
            onPress={entrar}
            activeOpacity={0.85}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.botaoEntrarTexto}>Entrar</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.separador}>
            <View style={styles.sepLinha} />
            <Text style={styles.sepTexto}>ou</Text>
            <View style={styles.sepLinha} />
          </View>

          <TouchableOpacity
            style={styles.botaoCadastro}
            onPress={() => navigation.navigate('Cadastro')}
            activeOpacity={0.75}
          >
            <Text style={styles.botaoCadastroTexto}>Criar nova conta</Text>
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
    position: 'absolute', width: 340, height: 340, borderRadius: 170,
    backgroundColor: C.verde, opacity: 0.07, top: -100, left: -80,
  },
  manchaTerracota: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: C.terracota, opacity: 0.05, bottom: -40, right: -40,
  },
  tela: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24,
  },
  card: {
    width: '100%', backgroundColor: C.bgCard,
    borderRadius: 28, padding: 28,
    borderWidth: 1, borderColor: C.bordaSutil,
    shadowColor: C.verde,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, shadowRadius: 24, elevation: 12,
  },
  idArea: {
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20,
  },
  iconeBg: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: C.verde,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: C.verde, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  appNome: { fontSize: 22, fontWeight: '900', color: C.textoClaro, letterSpacing: -0.4 },
  appSub:  { fontSize: 11, color: C.ocre, marginTop: 2, fontWeight: '600', letterSpacing: 0.5 },
  dividerOcre: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 20,
  },
  dividerLinha: { flex: 1, height: 1, backgroundColor: C.bordaSutil },
  titulo:    { fontSize: 20, fontWeight: '800', color: C.textoClaro, marginBottom: 6 },
  subtitulo: { fontSize: 13, color: C.textoMedio },
  senhaLabel: {
    fontSize: 11, fontWeight: '700', color: C.textoSuave,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8,
  },
  botaoEntrar: {
    backgroundColor: C.verde, borderRadius: 14, paddingVertical: 15,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 8,
    shadowColor: C.verde, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  botaoEntrarTexto: { fontSize: 16, fontWeight: '700', color: '#fff' },
  separador: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 12 },
  sepLinha:  { flex: 1, height: 1, backgroundColor: C.bordaSutil },
  sepTexto:  { fontSize: 13, color: C.textoSuave },
  botaoCadastro: {
    borderWidth: 1.5, borderColor: C.bordaSutil, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  botaoCadastroTexto: { fontSize: 15, fontWeight: '600', color: C.textoMedio },
});