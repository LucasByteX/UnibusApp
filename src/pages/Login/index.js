import react from "react";
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Checkbox } from 'expo-checkbox';
import { useNavigation } from '@react-navigation/native'
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import SecurityInput from "../../assets/SecurityInput";

export default function Login() {

    const navigation = useNavigation();


    const [email, setEmail] = useState();
    const [password, setPassword] = useState('');

    const [passwordView, setPasswordView] = useState(false);



    function entrar() {
        if (email == "Membro" && password == 123)
            navigation.navigate('Menu', { cargo: 'Membro' })

        else if (email == "Comissao" && password == 123)
            navigation.navigate('Menu', { cargo: 'Comissao' })

        else if (email == "Motorista" && password == 123)
            navigation.navigate('Menu', { cargo: 'Motorista' })


        else
            alert('Usuario ou Senha inválido')
        setPassword('');


    }




    return (
        <View style={styles.container}>


   

            <Text>Login</Text>


            <Text>Email:</Text>
            <TextInput
                style={styles.textInput}
                placeholder="Digite seu email"
                underlineColorAndroid="transparent" // linha abaixo (opcional)
                onChangeText={(email) => setEmail(email)}
                autoCapitalize="none"
                autoCorrect={false}
            />

            <Text>Senha:</Text>
            
            <SecurityInput
            onChangeText={(senha) => setPassword(senha)}
            value={password}
            placeholder={"Digite sua Senha"}
            />
            <Text>
                {password}
            </Text>




            <View style={styles.buttonArea}>
                <TouchableOpacity
                    onPress={entrar}
                >

                    <Text>Entrar</Text>

                </TouchableOpacity>
            </View>

            <View style={styles.buttonArea}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Cadastro')}
                >

                    <Text>Cadastrar</Text>

                </TouchableOpacity>
            </View>






        </View>


    );


}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40
    },
    passwordArea: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10

    },
    viewPasswordText: {
        marginLeft: 10
    },
    textInput: {
        marginBottom: 20,
        minHeight: 40,
        width: 300,
        height: 50,
        borderRadius: 10,
        borderWidth: 1

    },
    textInputP: {
        marginRight: 10,
        minHeight: 40,
        width: 250,
        borderRadius: 10,

    }
    ,
    buttonArea: {
        marginTop: 20,
        borderRadius: 5,
        borderColor: 'black',
        borderWidth: 1
    },
    areaPassword: {
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
        marginRight: 10
    }






});