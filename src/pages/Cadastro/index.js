import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConnection';
import SecurityInput from '../../assets/SecurityInput';

// ─── COOLDOWN ─────────────────────────────────────────────────────────────────
// Evita spam ao Firebase: 30s entre tentativas de cadastro que chegam ao servidor
const COOLDOWN_MS = 30_000;

// ─── UNIVERSIDADES ────────────────────────────────────────────────────────────
const UNIVERSIDADES = [
  { key: 0, nome: '── Selecione a Instituição ──' },
  { key: 1, nome: 'UEPB' },
  { key: 2, nome: 'IFPB-CG' },
  { key: 3, nome: 'UNIFIP' },
  { key: 4, nome: 'Outra' },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function formatarCPF(valor) {
  valor = valor.replace(/\D/g, '').slice(0, 11);
  if (valor.length > 9) return valor.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
  if (valor.length > 6) return valor.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
  if (valor.length > 3) return valor.replace(/(\d{3})(\d{0,3})/, '$1.$2');
  return valor;
}

function validarCPF(cpf) {
  const c = cpf.replace(/\D/g, '');
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(c[i]) * (10 - i);
  let r = (soma * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(c[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(c[i]) * (11 - i);
  r = (soma * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(c[10]);
}

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── COMPONENTES INTERNOS ─────────────────────────────────────────────────────
function CampoTexto({ label, value, onChangeText, keyboardType, autoCapitalize, maxLength, placeholder }) {
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
          autoCapitalize={autoCapitalize || 'words'}
          autoCorrect={false}
          maxLength={maxLength}
          placeholder={placeholder || ''}
          placeholderTextColor="#2a3a5c"
          onFocus={onFocus}
          onBlur={onBlur}
          selectionColor="#1a56db"
        />
      </Animated.View>
    </View>
  );
}

const campo = StyleSheet.create({
  wrapper: { marginBottom: 22 },
  label: { fontSize: 11, fontWeight: '700', color: '#4a5878', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  labelFocado: { color: '#1a56db' },
  linha: { borderBottomWidth: 1.5 },
  input: { fontSize: 15, color: '#e8edf8', paddingVertical: 6 },
});

function SenhaRotulo({ label }) {
  return (
    <Text style={{ fontSize: 11, fontWeight: '700', color: '#4a5878', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
      {label}
    </Text>
  );
}

function OpcaoToggle({ label, icon, ativo, onPress }) {
  return (
    <TouchableOpacity
      style={[toggle.btn, ativo && toggle.btnAtivo]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons name={icon} size={18} color={ativo ? '#fff' : '#4a5878'} />
      <Text style={[toggle.texto, ativo && toggle.textoAtivo]}>{label}</Text>
    </TouchableOpacity>
  );
}

const toggle = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#1a2548', flex: 1, justifyContent: 'center',
  },
  btnAtivo: { backgroundColor: '#1a56db', borderColor: '#1a56db' },
  texto: { fontSize: 14, fontWeight: '600', color: '#4a5878' },
  textoAtivo: { color: '#fff' },
});

// ─── MODAL DE SUCESSO ─────────────────────────────────────────────────────────
function ModalSucesso({ visible, onClose }) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, damping: 16, stiffness: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.7);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <Animated.View style={[suc.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[suc.box, { transform: [{ scale: scaleAnim }] }]}>
          <View style={suc.iconeArea}>
            <MaterialCommunityIcons name="clock-check-outline" size={48} color="#1a56db" />
          </View>
          <Text style={suc.titulo}>Cadastro Enviado!</Text>
          <Text style={suc.descricao}>
            Seu pedido foi recebido e está em análise pela comissão.{'\n\n'}
            Você receberá uma resposta em breve. Enquanto isso, você já pode fazer login, mas o acesso completo ficará disponível após a aprovação.
          </Text>
          <TouchableOpacity style={suc.botao} onPress={onClose} activeOpacity={0.85}>
            <Text style={suc.botaoTexto}>Entendido</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const suc = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(8,13,30,0.85)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32,
  },
  box: {
    backgroundColor: '#0e1530', borderRadius: 24, padding: 28,
    borderWidth: 1, borderColor: '#1a2548', width: '100%', alignItems: 'center',
  },
  iconeArea: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: '#0d1f42', justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  titulo: { fontSize: 20, fontWeight: '800', color: '#e8edf8', marginBottom: 12, textAlign: 'center' },
  descricao: { fontSize: 14, color: '#6a7a99', lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  botao: {
    backgroundColor: '#1a56db', borderRadius: 14, paddingVertical: 14,
    paddingHorizontal: 40, alignItems: 'center',
  },
  botaoTexto: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

// ─── TELA PRINCIPAL ───────────────────────────────────────────────────────────
export default function Cadastro() {
  const navigation = useNavigation();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [instituicao, setInstituicao] = useState(0);
  const [curso, setCurso] = useState('');
  const [matricula, setMatricula] = useState('');
  const [ehMotorista, setEhMotorista] = useState(false);
  const [ehComissao, setEhComissao] = useState(false);

  const [carregando, setCarregando] = useState(false);
  const [modalSucesso, setModalSucesso] = useState(false);
  const ultimoEnvio = useRef(null);

  // ── Validação local (sem Firebase) ──────────────────────────────────────────
  function validarLocal() {
    if (!nome.trim() || nome.trim().length < 8) {
      Alert.alert('Nome inválido', 'Informe seu nome completo (mínimo 8 caracteres).'); return false;
    }
    if (!emailValido(email)) {
      Alert.alert('E-mail inválido', 'Informe um endereço de e-mail válido.'); return false;
    }
    if (!validarCPF(cpf)) {
      Alert.alert('CPF inválido', 'O CPF informado não é válido. Verifique e tente novamente.'); return false;
    }
    if (!password || password.length < 6) {
      Alert.alert('Senha fraca', 'A senha deve ter no mínimo 6 caracteres.'); return false;
    }
    if (password !== passwordConfirm) {
      Alert.alert('Senhas diferentes', 'As senhas informadas não coincidem.'); return false;
    }
    if (!ehMotorista) {
      if (instituicao === 0) { Alert.alert('Instituição', 'Selecione sua instituição de ensino.'); return false; }
      if (!curso.trim()) { Alert.alert('Curso', 'Informe seu curso.'); return false; }
      if (!matricula.trim() || matricula.trim().length < 4) {
        Alert.alert('Matrícula', 'Informe sua matrícula (mínimo 4 dígitos).'); return false;
      }
    }
    return true;
  }

  // ── Cadastro no Firebase ────────────────────────────────────────────────────
  async function cadastrar() {
    if (!validarLocal()) return;

    // Cooldown: só ativa quando vai ao Firebase
    if (ultimoEnvio.current) {
      const diff = Date.now() - ultimoEnvio.current;
      if (diff < COOLDOWN_MS) {
        const restante = Math.ceil((COOLDOWN_MS - diff) / 1000);
        Alert.alert('Aguarde', `Espere ${restante}s antes de tentar novamente.`);
        return;
      }
    }

    setCarregando(true);
    const cpfLimpo = cpf.replace(/\D/g, '');

    try {
      // 1. Verifica se CPF já está cadastrado (índice rápido)
      const snapCPF = await getDoc(doc(db, 'CPFs', cpfLimpo));
      if (snapCPF.exists()) {
        const dados = snapCPF.data();
        const snapUser = await getDoc(doc(db, 'Users', dados.uid));
        const status = snapUser.exists() ? snapUser.data().status : 'desconhecido';

        if (status === 'banido') {
          Alert.alert('Acesso Negado', 'Este CPF está banido do sistema.');
        } else if (status === 'analise') {
          Alert.alert('Já em Análise', 'Este CPF já possui um cadastro aguardando análise.');
        } else {
          Alert.alert('Já Cadastrado', 'Este CPF já possui uma conta ativa no sistema.');
        }
        setCarregando(false);
        return;
      }

      // 2. Cria o usuário no Authentication
      ultimoEnvio.current = Date.now();
      const credencial = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = credencial.user.uid;

      // 3. Determina cargo
      const cargo = ehMotorista ? 'Motorista' : ehComissao ? 'Comissao' : 'Membro';

      // 4. Salva dados em Users/{uid}
      const dadosUsuario = {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        cpf: cpfLimpo,
        cargo,
        status: 'analise', // inicia em análise
        criadoEm: new Date().toISOString(),
        ...(ehMotorista
          ? {}
          : {
              instituicao: UNIVERSIDADES.find((u) => u.key === instituicao)?.nome || '',
              curso: curso.trim(),
              matricula: matricula.trim(),
            }),
      };

      await setDoc(doc(db, 'Users', uid), dadosUsuario);

      // 5. Índice CPF → UID para checagem rápida
      await setDoc(doc(db, 'CPFs', cpfLimpo), { uid });

      // 6. Desloga imediatamente (precisa de aprovação pra acessar)
      await auth.signOut();

      setModalSucesso(true);

    } catch (erro) {
      const msgs = {
        'auth/email-already-in-use': 'Este e-mail já está em uso por outra conta.',
        'auth/invalid-email': 'E-mail inválido.',
        'auth/weak-password': 'Senha muito fraca. Use no mínimo 6 caracteres.',
        'auth/network-request-failed': 'Sem conexão com a internet.',
      };
      Alert.alert('Erro no cadastro', msgs[erro.code] || `Ocorreu um erro: ${erro.message}`);
    } finally {
      setCarregando(false);
    }
  }

  function toggleMotorista() {
    if (ehComissao) setEhComissao(false);
    setEhMotorista(!ehMotorista);
  }

  function toggleComissao() {
    if (ehMotorista) setEhMotorista(false);
    setEhComissao(!ehComissao);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#080d1e" />

      {/* Fundo */}
      <View style={styles.bg}>
        <View style={styles.circulo1} />
        <View style={styles.circulo2} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerArea}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.voltarBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#4a6ab0" />
          </TouchableOpacity>
          <View style={styles.iconeBg}>
            <MaterialCommunityIcons name="account-plus-outline" size={24} color="#fff" />
          </View>
          <Text style={styles.titulo}>Criar Conta</Text>
          <Text style={styles.subtitulo}>
            Preencha os dados abaixo. Seu cadastro passará por análise da comissão antes de ser aprovado.
          </Text>
        </View>

        {/* Card */}
        <View style={styles.card}>

          {/* Seção: Dados Pessoais */}
          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>
              <MaterialCommunityIcons name="account-outline" size={14} color="#1a56db" />
              {'  '}Dados Pessoais
            </Text>

            <CampoTexto label="Nome Completo" value={nome} onChangeText={setNome} />
            <CampoTexto
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <CampoTexto
              label="CPF"
              value={cpf}
              onChangeText={(v) => setCpf(formatarCPF(v))}
              keyboardType="numeric"
              maxLength={14}
              placeholder="000.000.000-00"
            />
          </View>

          <View style={styles.divisor} />

          {/* Seção: Segurança */}
          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>
              <MaterialCommunityIcons name="lock-outline" size={14} color="#1a56db" />
              {'  '}Segurança
            </Text>

            <SenhaRotulo label="Senha" />
            <SecurityInput
              value={password}
              onChangeText={setPassword}
              placeholder=""
            />

            <SenhaRotulo label="Confirmar Senha" />
            <SecurityInput
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              placeholder=""
            />
          </View>

          <View style={styles.divisor} />

          {/* Seção: Tipo de Usuário */}
          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>
              <MaterialCommunityIcons name="shield-account-outline" size={14} color="#1a56db" />
              {'  '}Tipo de Usuário
            </Text>
            <Text style={styles.secaoHint}>
              Deixe ambos desmarcados se for passageiro comum.
            </Text>
            <View style={styles.toggleRow}>
              <OpcaoToggle
                label="Motorista"
                icon="steering"
                ativo={ehMotorista}
                onPress={toggleMotorista}
              />
              <View style={{ width: 10 }} />
              <OpcaoToggle
                label="Comissão"
                icon="shield-check-outline"
                ativo={ehComissao}
                onPress={toggleComissao}
              />
            </View>
          </View>

          {/* Seção: Dados Acadêmicos (esconde se motorista) */}
          {!ehMotorista && (
            <>
              <View style={styles.divisor} />
              <View style={styles.secao}>
                <Text style={styles.secaoTitulo}>
                  <MaterialCommunityIcons name="school-outline" size={14} color="#1a56db" />
                  {'  '}Dados Acadêmicos
                </Text>

                <Text style={styles.pickerLabel}>Instituição</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={instituicao}
                    onValueChange={(v) => setInstituicao(v)}
                    style={styles.picker}
                    dropdownIconColor="#4a5878"
                  >
                    {UNIVERSIDADES.map((u) => (
                      <Picker.Item
                        key={u.key}
                        value={u.key}
                        label={u.nome}
                        color={u.key === 0 ? '#4a5878' : '#e8edf8'}
                        style={{ backgroundColor: '#0e1530' }}
                      />
                    ))}
                  </Picker>
                </View>

                <CampoTexto label="Curso" value={curso} onChangeText={setCurso} />
                <CampoTexto
                  label="Matrícula"
                  value={matricula}
                  onChangeText={setMatricula}
                  keyboardType="numeric"
                  maxLength={14}
                  autoCapitalize="none"
                />
              </View>
            </>
          )}

          {/* Botão Cadastrar */}
          <TouchableOpacity
            style={[styles.botao, carregando && styles.botaoDesabilitado]}
            onPress={cadastrar}
            disabled={carregando}
            activeOpacity={0.85}
          >
            {carregando ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.botaoTexto}>Enviar Cadastro</Text>
                <MaterialCommunityIcons name="send-outline" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <ModalSucesso
        visible={modalSucesso}
        onClose={() => {
          setModalSucesso(false);
          navigation.navigate('Login');
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#080d1e' },
  bg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  },
  circulo1: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: '#1a56db', opacity: 0.06, top: -80, right: -60,
  },
  circulo2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#1a56db', opacity: 0.04, bottom: 60, left: -60,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 20,
  },
  headerArea: { marginBottom: 24 },
  voltarBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#0e1530', justifyContent: 'center', alignItems: 'center',
    marginBottom: 20, borderWidth: 1, borderColor: '#1a2548',
  },
  iconeBg: {
    width: 50, height: 50, borderRadius: 15, backgroundColor: '#1a56db',
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  titulo: { fontSize: 24, fontWeight: '900', color: '#e8edf8', marginBottom: 8, letterSpacing: -0.5 },
  subtitulo: { fontSize: 13, color: '#4a5878', lineHeight: 20 },
  card: {
    backgroundColor: '#0e1530', borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: '#1a2548',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 10,
  },
  secao: { paddingVertical: 4 },
  secaoTitulo: {
    fontSize: 12, fontWeight: '800', color: '#4a6ab0',
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 18,
  },
  secaoHint: { fontSize: 12, color: '#2a3a5c', marginTop: -12, marginBottom: 16 },
  divisor: { height: 1, backgroundColor: '#1a2548', marginVertical: 20 },
  toggleRow: { flexDirection: 'row' },
  pickerLabel: {
    fontSize: 11, fontWeight: '700', color: '#4a5878',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6,
  },
  pickerWrapper: {
    borderBottomWidth: 1.5, borderBottomColor: '#2a3a5c', marginBottom: 22,
  },
  picker: { color: '#e8edf8', marginLeft: -8, height: 44 },
  botao: {
    backgroundColor: '#1a56db', borderRadius: 14, paddingVertical: 15,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 10, marginTop: 28,
  },
  botaoDesabilitado: { opacity: 0.6 },
  botaoTexto: { fontSize: 16, fontWeight: '700', color: '#fff' },
});