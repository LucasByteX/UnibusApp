import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
  Animated, KeyboardAvoidingView, Platform, StatusBar,
  ActivityIndicator, Alert, Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConnection';
import SecurityInput from '../../assets/SecurityInput';

// ─── PALETA AREIA-PB ─────────────────────────────────────────────────────────
const C = {
  bgProfundo:  '#0b110d',
  bgCard:      '#111a14',
  bgSutil:     '#192b1e',
  bordaSutil:  '#243d2a',
  verde:       '#3d8b5c',
  verdeClaro:  '#52b876',
  verdeEscuro: '#2a6b42',
  terracota:   '#c2622a',
  ocre:        '#d4872f',
  textoClaro:  '#dfe8da',
  textoMedio:  '#7a9e82',
  textoSuave:  '#3d5c43',
};

const COOLDOWN_MS = 30_000;

const UNIVERSIDADES = [
  { key: 0, nome: '── Selecione a Instituição ──' },
  { key: 1, nome: 'UEPB' },
  { key: 2, nome: 'IFPB-CG' },
  { key: 3, nome: 'UNIFIP' },
  { key: 4, nome: 'Outra' },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function formatarCPF(v) {
  v = v.replace(/\D/g, '').slice(0, 11);
  if (v.length > 9) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
  if (v.length > 6) return v.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
  if (v.length > 3) return v.replace(/(\d{3})(\d{0,3})/, '$1.$2');
  return v;
}

function validarCPF(cpf) {
  const c = cpf.replace(/\D/g, '');
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += parseInt(c[i]) * (10 - i);
  let r = (s * 10) % 11; if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(c[9])) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += parseInt(c[i]) * (11 - i);
  r = (s * 10) % 11; if (r === 10 || r === 11) r = 0;
  return r === parseInt(c[10]);
}

function emailValido(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

// ─── CAMPO TEXTO ANIMADO ──────────────────────────────────────────────────────
function CampoTexto({ label, value, onChangeText, keyboardType, autoCapitalize, maxLength, placeholder }) {
  const [focado, setFocado] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const borderColor = anim.interpolate({ inputRange: [0, 1], outputRange: [C.bordaSutil, C.verde] });

  return (
    <View style={campo.wrapper}>
      <Text style={[campo.label, focado && { color: C.verde }]}>{label}</Text>
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
          placeholderTextColor={C.textoSuave}
          onFocus={() => { setFocado(true);  Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: false }).start(); }}
          onBlur={()  => { setFocado(false); Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: false }).start(); }}
          selectionColor={C.verde}
        />
      </Animated.View>
    </View>
  );
}

const campo = StyleSheet.create({
  wrapper: { marginBottom: 22 },
  label:   { fontSize: 11, fontWeight: '700', color: C.textoSuave, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  linha:   { borderBottomWidth: 1.5 },
  input:   { fontSize: 15, color: C.textoClaro, paddingVertical: 6 },
});

// ─── TOGGLE TIPO USUÁRIO ──────────────────────────────────────────────────────
function OpcaoToggle({ label, icon, ativo, onPress }) {
  return (
    <TouchableOpacity
      style={[tog.btn, ativo && tog.btnAtivo]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons name={icon} size={17} color={ativo ? '#fff' : C.textoSuave} />
      <Text style={[tog.texto, ativo && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const tog = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.bordaSutil, flex: 1, justifyContent: 'center',
  },
  btnAtivo: { backgroundColor: C.verde, borderColor: C.verde },
  texto: { fontSize: 14, fontWeight: '600', color: C.textoSuave },
});

// ─── MODAL DE SUCESSO ─────────────────────────────────────────────────────────
function ModalSucesso({ visible, onClose }) {
  const scale = useRef(new Animated.Value(0.75)).current;
  const fade  = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fade,  { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, damping: 16, stiffness: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.75); fade.setValue(0);
    }
  }, [visible]);

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <Animated.View style={[suc.overlay, { opacity: fade }]}>
        <Animated.View style={[suc.box, { transform: [{ scale }] }]}>
          <View style={suc.iconeArea}>
            <MaterialCommunityIcons name="leaf-circle-outline" size={52} color={C.verdeClaro} />
          </View>
          <Text style={suc.titulo}>Cadastro Enviado!</Text>
          <Text style={suc.descricao}>
            Seu pedido foi recebido e está em análise pela comissão do transporte de Areia-PB.{'\n\n'}
            Você receberá uma resposta em breve. Pode fazer login, mas o acesso completo ficará disponível após a aprovação.
          </Text>
          <View style={suc.divider}>
            <View style={suc.divLinha} />
            <MaterialCommunityIcons name="leaf" size={12} color={C.verdeClaro} style={{ marginHorizontal: 8 }} />
            <View style={suc.divLinha} />
          </View>
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
    flex: 1, backgroundColor: 'rgba(11,17,13,0.88)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28,
  },
  box: {
    backgroundColor: C.bgCard, borderRadius: 24, padding: 28,
    borderWidth: 1, borderColor: C.bordaSutil, width: '100%', alignItems: 'center',
  },
  iconeArea: {
    width: 84, height: 84, borderRadius: 24,
    backgroundColor: C.bgSutil, justifyContent: 'center', alignItems: 'center', marginBottom: 18,
    borderWidth: 1, borderColor: C.verde,
  },
  titulo:    { fontSize: 20, fontWeight: '800', color: C.textoClaro, marginBottom: 12, textAlign: 'center' },
  descricao: { fontSize: 13, color: C.textoMedio, lineHeight: 21, textAlign: 'center', marginBottom: 20 },
  divider:   { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 20 },
  divLinha:  { flex: 1, height: 1, backgroundColor: C.bordaSutil },
  botao: {
    backgroundColor: C.verde, borderRadius: 14, paddingVertical: 13,
    paddingHorizontal: 44, alignItems: 'center',
    shadowColor: C.verde, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  botaoTexto: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

// ─── TELA PRINCIPAL ───────────────────────────────────────────────────────────
export default function Cadastro() {
  const navigation = useNavigation();

  const [nome, setNome]                       = useState('');
  const [email, setEmail]                     = useState('');
  const [cpf, setCpf]                         = useState('');
  const [password, setPassword]               = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [instituicao, setInstituicao]         = useState(0);
  const [curso, setCurso]                     = useState('');
  const [matricula, setMatricula]             = useState('');
  const [ehMotorista, setEhMotorista]         = useState(false);
  const [ehComissao, setEhComissao]           = useState(false);
  const [carregando, setCarregando]           = useState(false);
  const [modalSucesso, setModalSucesso]       = useState(false);
  const ultimoEnvio = useRef(null);

  function validarLocal() {
    if (!nome.trim() || nome.trim().length < 8)
      { Alert.alert('Nome inválido', 'Informe seu nome completo (mínimo 8 caracteres).'); return false; }
    if (!emailValido(email))
      { Alert.alert('E-mail inválido', 'Informe um endereço de e-mail válido.'); return false; }
    if (!validarCPF(cpf))
      { Alert.alert('CPF inválido', 'O CPF informado não é válido.'); return false; }
    if (!password || password.length < 6)
      { Alert.alert('Senha fraca', 'A senha deve ter no mínimo 6 caracteres.'); return false; }
    if (password !== passwordConfirm)
      { Alert.alert('Senhas diferentes', 'As senhas informadas não coincidem.'); return false; }
    if (!ehMotorista) {
      if (instituicao === 0) { Alert.alert('Instituição', 'Selecione sua instituição de ensino.'); return false; }
      if (!curso.trim())     { Alert.alert('Curso', 'Informe seu curso.'); return false; }
      if (!matricula.trim() || matricula.trim().length < 4)
        { Alert.alert('Matrícula', 'Informe sua matrícula (mínimo 4 dígitos).'); return false; }
    }
    return true;
  }

  async function cadastrar() {
    if (!validarLocal()) return;

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
    const cargo    = ehMotorista ? 'Motorista' : ehComissao ? 'Comissao' : 'Membro';
    const dadosNovos = {
      nome:      nome.trim(),
      email:     email.trim().toLowerCase(),
      cpf:       cpfLimpo,
      cargo,
      status:    'analise',
      criadoEm:  new Date().toISOString(),
      ...(ehMotorista ? {} : {
        instituicao: UNIVERSIDADES.find(u => u.key === instituicao)?.nome || '',
        curso:       curso.trim(),
        matricula:   matricula.trim(),
      }),
    };

    ultimoEnvio.current = Date.now();

    try {
      // ── 1. Verifica se CPF já existe ────────────────────────────────────────
      const snapCPF = await getDoc(doc(db, 'CPFs', cpfLimpo));

      if (snapCPF.exists()) {
        const uidAntigo   = snapCPF.data().uid;
        const statusAtual = (snapCPF.data().status || 'desconhecido').toLowerCase();

        if (statusAtual === 'rejeitado') {
          // ── CPF rejeitado: recadastra ────────────────────────────────────────
          let uid = uidAntigo;
          const emailAntigo = snapCPF.data().email || '';

          if (emailAntigo === email.trim().toLowerCase()) {
            // Mesmo email → conta já existe no Auth, confirma a senha
            try {
              const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
              uid = cred.user.uid;
              // NÃO faz signOut aqui
            } catch (e) {
              if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
                Alert.alert('Senha incorreta', 'Este e-mail já possui uma conta. Verifique sua senha.');
                setCarregando(false);
                return;
              }
              throw e;
            }
          } else {
            // Email diferente → cria nova conta no Auth
            await deleteDoc(doc(db, 'CPFs', cpfLimpo));
            try {
              const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
              uid = cred.user.uid;
              // NÃO faz signOut aqui
            } catch (e) {
              if (e.code === 'auth/email-already-in-use') {
                Alert.alert('E-mail em uso', 'Este e-mail já está vinculado a outra conta.');
                setCarregando(false);
                return;
              }
              throw e;
            }
            // Remove documento antigo
            try { await deleteDoc(doc(db, 'Users', uidAntigo)); } catch {}
          }

          // Salva dados atualizados enquanto ainda está logado
          await setDoc(doc(db, 'Users', uid), dadosNovos);
          await setDoc(doc(db, 'CPFs', cpfLimpo), {
            uid,
            status: 'analise',
            email:  email.trim().toLowerCase(),
          });
          // Só desloga depois de salvar tudo
          await auth.signOut();
          setModalSucesso(true);
          setCarregando(false);
          return;
        }

        // CPF com outros status — bloqueia
        const msgs = {
          banido:       'Este CPF está banido do sistema.',
          analise:      'Este CPF já possui um cadastro aguardando análise.',
          ativo:        'Este CPF já possui uma conta ativa no sistema.',
          desconhecido: 'Este CPF já foi utilizado em um cadastro.',
        };
        Alert.alert('CPF já cadastrado', msgs[statusAtual] || msgs.desconhecido);
        setCarregando(false);
        return;
      }

      // ── 2. CPF novo: fluxo normal de cadastro ───────────────────────────────
      let uid;
      try {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        uid = cred.user.uid;
        // NÃO faz signOut aqui — precisa estar logado para o setDoc funcionar
      } catch (e) {
        if (e.code === 'auth/email-already-in-use') {
          const snapCPFEmail = await getDoc(doc(db, 'CPFs', cpfLimpo));
          if (!snapCPFEmail.exists()) {
            Alert.alert('E-mail em uso', 'Este e-mail já está em uso por outra conta.');
            setCarregando(false);
            return;
          }
          const statusEmail = (snapCPFEmail.data().status || 'desconhecido').toLowerCase();
          if (statusEmail !== 'rejeitado') {
            const msgs = {
              analise:      'Este e-mail já possui um cadastro aguardando análise.',
              ativo:        'Este e-mail já está em uso por uma conta ativa.',
              banido:       'Este e-mail está banido do sistema.',
              desconhecido: 'Este e-mail já está em uso por outra conta.',
            };
            Alert.alert('E-mail em uso', msgs[statusEmail] || msgs.desconhecido);
            setCarregando(false);
            return;
          }
          try {
            const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
            uid = cred.user.uid;
            // NÃO faz signOut aqui também
          } catch (loginErr) {
            if (loginErr.code === 'auth/wrong-password' || loginErr.code === 'auth/invalid-credential') {
              Alert.alert('E-mail em uso', 'Este e-mail já está em uso. Verifique sua senha ou use outro e-mail.');
            } else {
              Alert.alert('Erro', loginErr.message);
            }
            setCarregando(false);
            return;
          }
        } else {
          throw e;
        }
      }

      // Salva no Firestore enquanto ainda está logado
      await setDoc(doc(db, 'Users', uid), dadosNovos);
      await setDoc(doc(db, 'CPFs', cpfLimpo), {
        uid,
        status: 'analise',
        email:  email.trim().toLowerCase(),
      });
      // Só desloga depois de salvar tudo
      await auth.signOut();
      setModalSucesso(true);

    } catch (erro) {
      const msgs = {
        'auth/email-already-in-use':   'Este e-mail já está em uso por outra conta.',
        'auth/invalid-email':          'E-mail inválido.',
        'auth/weak-password':          'Senha muito fraca. Use no mínimo 6 caracteres.',
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
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bgProfundo }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={C.bgProfundo} />

      <View style={styles.manchaVerde} />
      <View style={styles.manchaOcre} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.voltarBtn}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={C.textoMedio} />
        </TouchableOpacity>

        <View style={styles.iconeBg}>
          <MaterialCommunityIcons name="account-plus-outline" size={26} color="#fff" />
        </View>
        <Text style={styles.titulo}>Criar Conta</Text>
        <Text style={styles.subtitulo}>
          Preencha os dados abaixo. Seu cadastro passará por{'\n'}análise da comissão antes de ser aprovado.
        </Text>

        <View style={styles.dividerFolha}>
          <View style={styles.divLinha} />
          <MaterialCommunityIcons name="leaf" size={13} color={C.verdeClaro} style={{ marginHorizontal: 8 }} />
          <View style={styles.divLinha} />
        </View>

        <View style={styles.card}>
          <Text style={styles.secaoTitulo}>
            <MaterialCommunityIcons name="account-outline" size={13} color={C.ocre} />
            {'  '}Dados Pessoais
          </Text>
          <CampoTexto label="Nome Completo" value={nome} onChangeText={setNome} />
          <CampoTexto label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <CampoTexto label="CPF" value={cpf} onChangeText={v => setCpf(formatarCPF(v))} keyboardType="numeric" maxLength={14} placeholder="000.000.000-00" />

          <View style={styles.divisor} />

          <Text style={styles.secaoTitulo}>
            <MaterialCommunityIcons name="lock-outline" size={13} color={C.ocre} />
            {'  '}Segurança
          </Text>
          <Text style={styles.miniLabel}>Senha</Text>
          <SecurityInput value={password} onChangeText={setPassword} placeholder="" />
          <Text style={styles.miniLabel}>Confirmar Senha</Text>
          <SecurityInput value={passwordConfirm} onChangeText={setPasswordConfirm} placeholder="" />

          <View style={styles.divisor} />

          <Text style={styles.secaoTitulo}>
            <MaterialCommunityIcons name="shield-account-outline" size={13} color={C.ocre} />
            {'  '}Tipo de Usuário
          </Text>
          <Text style={styles.hint}>Deixe ambos desmarcados se for passageiro comum.</Text>
          <View style={styles.toggleRow}>
            <OpcaoToggle label="Motorista" icon="steering"             ativo={ehMotorista} onPress={toggleMotorista} />
            <View style={{ width: 10 }} />
            <OpcaoToggle label="Comissão"  icon="shield-check-outline" ativo={ehComissao}  onPress={toggleComissao}  />
          </View>

          {!ehMotorista && (
            <>
              <View style={styles.divisor} />
              <Text style={styles.secaoTitulo}>
                <MaterialCommunityIcons name="school-outline" size={13} color={C.ocre} />
                {'  '}Dados Acadêmicos
              </Text>
              <Text style={styles.miniLabel}>Instituição</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={instituicao}
                  onValueChange={v => setInstituicao(v)}
                  style={styles.picker}
                  dropdownIconColor={C.textoSuave}
                >
                  {UNIVERSIDADES.map(u => (
                    <Picker.Item
                      key={u.key} value={u.key} label={u.nome}
                      color={u.key === 0 ? C.textoSuave : C.textoClaro}
                      style={{ backgroundColor: C.bgCard }}
                    />
                  ))}
                </Picker>
              </View>
              <CampoTexto label="Curso" value={curso} onChangeText={setCurso} />
              <CampoTexto label="Matrícula" value={matricula} onChangeText={setMatricula} keyboardType="numeric" maxLength={15} autoCapitalize="none" />
            </>
          )}

          <TouchableOpacity
            style={[styles.botao, carregando && { opacity: 0.6 }]}
            onPress={cadastrar}
            disabled={carregando}
            activeOpacity={0.85}
          >
            {carregando ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.botaoTexto}>Enviar Cadastro</Text>
                <MaterialCommunityIcons name="send-outline" size={17} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>

      <ModalSucesso
        visible={modalSucesso}
        onClose={() => { setModalSucesso(false); navigation.navigate('Login'); }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  manchaVerde: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: C.verde, opacity: 0.06, top: -80, right: -80,
  },
  manchaOcre: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: C.terracota, opacity: 0.04, bottom: 120, left: -60,
  },
  scroll: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20 },
  voltarBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.bgCard, justifyContent: 'center', alignItems: 'center',
    marginBottom: 24, borderWidth: 1, borderColor: C.bordaSutil,
  },
  iconeBg: {
    width: 54, height: 54, borderRadius: 16, backgroundColor: C.verde,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    shadowColor: C.verde, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  titulo:    { fontSize: 24, fontWeight: '900', color: C.textoClaro, marginBottom: 8, letterSpacing: -0.4 },
  subtitulo: { fontSize: 13, color: C.textoMedio, lineHeight: 20, marginBottom: 20 },
  dividerFolha: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  divLinha:     { flex: 1, height: 1, backgroundColor: C.bordaSutil },
  card: {
    backgroundColor: C.bgCard, borderRadius: 24, padding: 22,
    borderWidth: 1, borderColor: C.bordaSutil,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 10,
  },
  secaoTitulo: {
    fontSize: 11, fontWeight: '800', color: C.ocre,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 16,
  },
  miniLabel: {
    fontSize: 11, fontWeight: '700', color: C.textoSuave,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8,
  },
  hint:      { fontSize: 12, color: C.textoSuave, marginTop: -10, marginBottom: 14 },
  divisor:   { height: 1, backgroundColor: C.bordaSutil, marginVertical: 20 },
  toggleRow: { flexDirection: 'row' },
  pickerWrapper: { borderBottomWidth: 1.5, borderBottomColor: C.bordaSutil, marginBottom: 22 },
  picker:        { color: C.textoClaro, marginLeft: -8, height: 44 },
  botao: {
    backgroundColor: C.verde, borderRadius: 14, paddingVertical: 15, marginTop: 28,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    shadowColor: C.verde, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  botaoTexto: { fontSize: 16, fontWeight: '700', color: '#fff' },
});