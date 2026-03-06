import react from "react";
import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, Button, FlatList, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Checkbox } from 'expo-checkbox';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from 'firebase/auth'

import { db } from "../../firebaseConnection";
import { auth } from "../../firebaseConnection";
import SecurityInput from "../../assets/SecurityInput";



export default function Cadastro() {


    const [instituicao, setInstituicao] = useState(0);
    const [motoristaswitch, setMotoristaSwitch] = useState(0);
    const [comissao, setComissao] = useState(0);
    const [cpf, setCpf] = useState('');
    const [nome, setNome] = useState(null);
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [matricula, setMatricula] = useState('');
    const [email, setEmail] = useState('');
    const [curso, setCurso] = useState('');
    const universidades = [
        { key: 0, nome: '----INSTITUIÇÃO----' },
        { key: 1, nome: 'UEPB' },
        { key: 2, nome: 'IFPB-CG' },
        { key: 3, nome: 'UNIFIP' }

    ]

    const instituicaoItem = universidades.map((v) =>(
        <Picker.Item key={v.key} value={v.key} label={v.nome} />
    ))



    async function cadastrar() {
        //await createUserWithEmailAndPassword(auth, )
    }





    function verificaCPF() {

        const cpfVerif= cpf.replace(/\D/g, "");
        

        if (cpfVerif == null) return 0

        let resto = ((cpfVerif[0] * 10) + (cpfVerif[1] * 9) + (cpfVerif[2] * 8) + (cpfVerif[3] * 7) + (cpfVerif[4] * 6) + (cpfVerif[5] * 5) + (cpfVerif[6] * 4) +
            (cpfVerif[7] * 3) + (cpfVerif[8] * 2)) % 11


        let digitoV1 = (resto < 2) ? 0 : 11 - resto;

        if (!(cpfVerif[9] == digitoV1)) {
            return 0;
        }

        resto = ((cpfVerif[0] * 11) + (cpfVerif[1] * 10) + (cpfVerif[2] * 9) + (cpfVerif[3] * 8) + (cpfVerif[4] * 7) + (cpfVerif[5] * 6) + (cpfVerif[6] * 5) +
            (cpfVerif[7] * 4) + (cpfVerif[8] * 3) + (digitoV1 * 2)) % 11


        let digitoV2 = (resto < 2) ? 0 : 11 - resto;

        if (!(cpfVerif[10] == digitoV2)) {

            return 0;
        }
        return 1;


    }

    function formatarCPF(valor) {

        // remove tudo que não for número
        valor = valor.replace(/\D/g, "");

        if (valor.length > 3) {
            valor = valor.slice(0, 3) + "." + valor.slice(3);
        }

        if (valor.length > 7) {
            valor = valor.slice(0, 7) + "." + valor.slice(7);
        }

        if (valor.length > 11) {
            valor = valor.slice(0, 11) + "-" + valor.slice(11);
        }

        return valor;
    }

    function emailValido(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    function checkOut() {
        if (cpf == '') {
            alert('CPF não informado');
            return 0;
        }
        else if (!(verificaCPF())) {
            alert('CPF invalido');
            return 0;
        }

        else if (password == '' || password.length < 6) {
            alert('Senha invalida');
            return 0;
        }
        else if (password != passwordConfirm) {
            alert('Senha não confere');
            return 0;
        }
        else if (nome == '' || nome.length < 8) {
            alert('Informe seu nome completo');
            return 0;
        }
        else if (!emailValido(email)) {
            alert('Informe um email valido');
            return 0;
        }

        if (motoristaswitch) {
            return 1;
        }

        if (instituicao == 0) {
            alert('Informe sua instituição');
            return 0;
        }
        else if (curso == "") {
            alert('Informe seu Curso');
            return 0;
        }
        else if (matricula == "" || matricula.length < 4) {
            alert('Informe sua matricula');
            return 0;
        }
        return 1;


    }


    function cadastro() {

        if (checkOut())
            alert('Cadastrado');





        /*
        await setDoc(doc(db, "Users", "3"), {
            nome: 'Luck'
        }).then(() => {
            null
        }).catch((erro) => {
            alert(erro);
        }) */


    }


    return (

        <View style={styles.container}>
            <ScrollView>
                <Text style={styles.texto}>Nome</Text>
                <TextInput
                    placeholder="Digite seu Nome"
                    underlineColorAndroid="transparent" // linha abaixo (opcional)
                    style={styles.textInput}
                    onChangeText={(name) => setNome(name)}
                    value={nome}
                />

                <Text style={styles.texto}>E-mail</Text>
                <TextInput
                    placeholder="Digite seu Email"
                    underlineColorAndroid="transparent" // linha abaixo (opcional)
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.textInput}
                    onChangeText={(email) => setEmail(email)}
                    value={email}
                />

                <Text style={styles.texto}>Senha</Text>
                <SecurityInput
                    onChangeText={(senha) => setPassword(senha)}
                    value={password}
                    placeholder={"Digite sua Senha"}
                />



                <Text style={styles.texto}>Confirme sua senha</Text>
                <SecurityInput
                    onChangeText={(senha) => setPasswordConfirm(senha)}
                    value={passwordConfirm}
                    placeholder={"Confirme sua senha"}
                />


                <Text style={styles.texto}>CPF</Text>
                <TextInput
                    placeholder="Apenas Números"
                    underlineColorAndroid="transparent" // linha abaixo (opcional)
                    keyboardType="numeric"
                    onChangeText={(cpf) => setCpf(formatarCPF(cpf))}
                    maxLength={14}
                    style={styles.textInput}
                    value={cpf}
                    contextMenuHidden={true}

                />


                <View style={{ flexDirection: 'row' }}>

                    <Switch
                        value={motoristaswitch}
                        onValueChange={() => {
                            if (comissao) setComissao(false);
                            setMotoristaSwitch(!motoristaswitch);

                        }}
                    />
                    <TouchableOpacity onPress={() => {
                        if (comissao) setComissao(false);
                        setMotoristaSwitch(!motoristaswitch);

                    }}>
                        <Text style={{ marginTop: 13 }}>Motorista</Text>
                    </TouchableOpacity>
                    <Switch
                        value={comissao}
                        onValueChange={() => {
                            if (motoristaswitch) setMotoristaSwitch(false);
                            setComissao(!comissao);
                        }}
                    />
                    <TouchableOpacity onPress={() => {
                        if (motoristaswitch) setMotoristaSwitch(false);
                        setComissao(!comissao);
                    }}>
                        <Text style={{ marginTop: 13 }}>Comissão</Text>
                    </TouchableOpacity>
                </View>


                {motoristaswitch ? null : (
                    <>
                        <Picker
                            style={styles.picker}
                            onValueChange={(itemValue, itemIndex) => setInstituicao(itemValue)}
                        >
                            {instituicaoItem}
                        </Picker>

                        <Text style={styles.texto}>Curso</Text>
                        <TextInput
                            placeholder="Digite seu curso"
                            underlineColorAndroid="transparent" // linha abaixo (opcional)
                            style={styles.textInput}
                            value={curso}
                            onChangeText={(curso) => setCurso(curso)}
                        />

                        <Text style={styles.texto}>Matrícula</Text>
                        <TextInput
                            placeholder="Digite sua matrícula"
                            underlineColorAndroid="transparent" // linha abaixo (opcional)
                            keyboardType="numeric"
                            onChangeText={(matricula) => setMatricula(matricula)}
                            maxLength={11}
                            style={styles.textInput}
                            value={matricula}
                        />

                        {/*
            <Button title="Selecionar Arquivo" onPress={pickDocument} />
            {pickDoc === null ? null : (
                <>
                <Text>Arquivo Selecionado : {pickDoc}</Text>
                </>
            )}
                */}



                    </>
                )}

                {/* 
                <Text>{nome}</Text>
                <Text>{email}</Text>
                <Text>{password}</Text>
                <Text>{passwordConfirm}</Text>
                <Text>{cpf}</Text>
                <Text>{instituicao}</Text>
                <Text>{curso}</Text>
                <Text>{matricula}</Text>
                <Text>{motoristaswitch ? '1' : '0'}</Text>
                <Text>{comissao ? '1' : '0'}</Text>
                */}


                <TouchableOpacity onPress={cadastro}>
                    <View style={styles.AreaBotao}>
                        <Text style={{ color: '#FFF', textAlign: 'center', fontSize: 15 }}>Enviar</Text>
                    </View>
                </TouchableOpacity>



            </ScrollView>
        </View>




    )




}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        //alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40
    },
    picker: {
        marginRight: 20

    },
    AreaBotao: {
        backgroundColor: '#1a6ebc',
        marginTop: 20,
        marginBottom: 40,
        width: 400,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center'
    },
    AreaPassword: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        marginBottom: 20,
        minHeight: 40,
        width: 300,
        height: 50,
        borderRadius: 10,
    },
    botaoPassword: {

    },
    textInput: {
        marginBottom: 20,
        minHeight: 40,
        width: 300,
        height: 50,
        borderRadius: 10,
        borderWidth: 1
    },
    texto: {
        marginLeft: 20,
        marginBottom: 10

    }





});