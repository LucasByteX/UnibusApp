import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConnection';
import SecurityInput from '../../assets/SecurityInput';

// Mensagens de erro do Firebase Auth traduzidas
function traduzirErroAuth(code) {
  const erros = {
    'auth/user-not-found': 'Nenhuma conta encontrada com este e-mail.',
    'auth/wrong-password': 'Senha incorreta. Tente novamente.',
    'auth/invalid-email': 'E-mail inválido.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos.',
    'auth/user-disabled': 'Esta conta foi desativada.',
    'auth/network-request-failed': 'Sem conexão com a internet.',
  };
  return erros[code] || 'Ocorreu um erro. Tente novamente.';
}

// Campo de texto com animação de foco
function CampoTexto({ label, value, onChangeText, keyboardType, autoCapitalize }) {
  const [focado, setFocado] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  function onFocus() {
    setFocado(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  }
  function onBlur() {
    setFocado(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  }

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#2a3a5c', '#1a56db'],
  });

  return (
    <View style={campo.wrapper}>
      <Text style={[campo.label, focado && campo.labelFocado]}>{label}</Text>
      <Animated.View style={[campo.linha, { borderBottomColor: borderColor }]}>
        <TextInput
          style={campo.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'none'}
          autoCorrect={false}
          placeholderTextColor="#4a5878"
          onFocus={onFocus}
          onBlur={onBlur}
          selectionColor="#1a56db"
        />
      </Animated.View>
    </View>
  );
}

const campo = StyleSheet.create({
  wrapper: { marginBottom: 24 },
  label: { fontSize: 11, fontWeight: '700', color: '#4a5878', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  labelFocado: { color: '#1a56db' },
  linha: { borderBottomWidth: 1.5 },
  input: { fontSize: 15, color: '#e8edf8', paddingVertical: 6 },
});

export default function Login() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [carregando, setCarregando] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 20, stiffness: 150, useNativeDriver: true }),
    ]).start();
  }, []);

  async function entrar() {
    if (!email.trim()) { Alert.alert('Atenção', 'Informe seu e-mail.'); return; }
    if (!password) { Alert.alert('Atenção', 'Informe sua senha.'); return; }

    setCarregando(true);
    try {
      const credencial = await signInWithEmailAndPassword(auth, email.trim(), password);
      const uid = credencial.user.uid;

      // Busca dados do usuário no Firestore
      const snap = await getDoc(doc(db, 'Users', uid));

      if (!snap.exists()) {
        Alert.alert('Erro', 'Usuário não encontrado no sistema.');
        await auth.signOut();
        setCarregando(false);
        return;
      }

      const dados = snap.data();

      if (dados.status === 'banido') {
        Alert.alert(
          'Acesso Bloqueado',
          'Sua conta foi banida. Entre em contato com a comissão.',
          [{ text: 'Entendido' }]
        );
        await auth.signOut();
        setCarregando(false);
        return;
      }

      if (dados.status === 'analise') {
        Alert.alert(
          'Em Análise',
          'Seu cadastro ainda está sendo analisado pela comissão. Por favor aguarde.',
          [{ text: 'Entendido' }]
        );
        await auth.signOut();
        setCarregando(false);
        return;
      }

      // Status 'ativo' — vai pro menu
      setPassword('');
      navigation.navigate('Menu', { cargo: dados.cargo || 'Membro' });

    } catch (erro) {
      Alert.alert('Erro ao entrar', traduzirErroAuth(erro.code));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0a0f23" />
      <View style={styles.bg}>
        {/* Círculos decorativos */}
        <View style={styles.circulo1} />
        <View style={styles.circulo2} />

        <Animated.View
          style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          {/* Logo / Ícone */}
          <View style={styles.iconeArea}>
            <View style={styles.iconeBg}>
              <MaterialCommunityIcons name="bus-electric" size={32} color="#fff" />
            </View>
            <Text style={styles.appNome}>BusPass</Text>
          </View>

          <Text style={styles.titulo}>Bem-vindo de volta</Text>
          <Text style={styles.subtitulo}>Faça login para continuar</Text>

          <View style={styles.form}>
            <CampoTexto
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />

            <View>
              <Text style={styles.senhaLabel}>Senha</Text>
              <SecurityInput
                value={password}
                onChangeText={setPassword}
                placeholder=""
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.botaoEntrar, carregando && styles.botaoDesabilitado]}
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
            <View style={styles.separadorLinha} />
            <Text style={styles.separadorTexto}>ou</Text>
            <View style={styles.separadorLinha} />
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
  flex: { flex: 1 },
  bg: {
    flex: 1,
    backgroundColor: '#080d1e',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  circulo1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#1a56db',
    opacity: 0.07,
    top: -80,
    right: -80,
  },
  circulo2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#1a56db',
    opacity: 0.05,
    bottom: -60,
    left: -60,
  },
  card: {
    width: '100%',
    backgroundColor: '#0e1530',
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: '#1a2548',
    shadowColor: '#1a56db',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  iconeArea: {
    alignItems: 'center',
    marginBottom: 24,
    flexDirection: 'row',
    gap: 12,
  },
  iconeBg: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#1a56db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appNome: {
    fontSize: 24,
    fontWeight: '900',
    color: '#e8edf8',
    letterSpacing: -0.5,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '800',
    color: '#e8edf8',
    marginBottom: 6,
  },
  subtitulo: {
    fontSize: 14,
    color: '#4a5878',
    marginBottom: 28,
  },
  form: { marginBottom: 4 },
  senhaLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4a5878',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  botaoEntrar: {
    backgroundColor: '#1a56db',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  botaoDesabilitado: { opacity: 0.6 },
  botaoEntrarTexto: { fontSize: 16, fontWeight: '700', color: '#fff' },
  separador: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  separadorLinha: { flex: 1, height: 1, backgroundColor: '#1a2548' },
  separadorTexto: { fontSize: 13, color: '#2a3a5c' },
  botaoCadastro: {
    borderWidth: 1.5,
    borderColor: '#1a2548',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botaoCadastroTexto: { fontSize: 15, fontWeight: '600', color: '#4a6ab0' },
});