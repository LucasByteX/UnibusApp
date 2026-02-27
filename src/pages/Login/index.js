import react from "react";
import React, { useState,useEffect } from 'react';
import {View,Text,StyleSheet,Button,FlatList,TouchableOpacity,TextInput} from 'react-native';
import { Checkbox } from 'expo-checkbox';
import Cadastro from "../Cadastro";
import {useNavigation} from '@react-navigation/native'

export default function Login () {

    const  navigation = useNavigation();


    const [email,setEmail]= useState();
    const [password,setPassword] = useState();

    const [passwordView,setPasswordView]= useState(false);



    function entrar (){
        if(email== "Membro" && password==123)
            navigation.navigate('MenuMembro')

        else if(email== "Comissao" && password==123)
            navigation.navigate('MenuComissao')

        else if(email== "Motorista" && password==123)
            navigation.navigate('MenuMotorista')

        else
            alert('Usuario Invalido')

    }

    return(
        <View style={styles.container}>

            <Text>Login</Text>


            <Text>Email:</Text>
            <TextInput
                  style={styles.textInput}
                  placeholder="Digite seu email"
                  underlineColorAndroid="transparent" // linha abaixo (opcional)
                  onChangeText={(email) => setEmail(email)}
                  />

            <Text>Senha:</Text>
            <TextInput
                  style={styles.textInput}
                  placeholder="Digite sua senha"
                  underlineColorAndroid="transparent" // linha abaixo (opcional)
                  onChangeText={(password) => setPassword(password)}
                  secureTextEntry={passwordView ? false : true}
                  />


            <View style={styles.passwordArea}>
                <Checkbox
                value={passwordView}
                onValueChange={setPasswordView}
                />
                <Text style={styles.viewPasswordText}>Mostrar Senha</Text>
            </View>

            

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
    justifyContent:'center',
    marginTop:10

  },
  viewPasswordText: {
    marginLeft:10
  },
  textInput: {
    marginBottom:20,
        minHeight:40,
        width:250,
        borderRadius:10,
        borderWidth:1
    
  },
  buttonArea:{
    marginTop:20,
    borderRadius:5,
    borderColor: 'black',
    borderWidth:1
  }


 



});