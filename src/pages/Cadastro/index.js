import react from "react";
import React, { useState,useEffect } from 'react';
import {View,Text,Switch,StyleSheet,Button,FlatList,TouchableOpacity,TextInput} from 'react-native';
import { Checkbox } from 'expo-checkbox';
import {Picker} from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebaseConnection";

export default function Cadastro () {


    const [instituicao,setInstituicao] = useState(0);
    const [motoristaswitch,setMotoristaSwitch] = useState(0);
    const [comissao,setComissao] = useState(0);
    const [pickDoc,setPickdDoc] = useState(null);
    const [cpf,setCpf] = useState(null);
    const pickDocument = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*', // aceita qualquer tipo de arquivo
      copyToCacheDirectory: true,
    });

    console.log(result);

    if (result.canceled === false) {
      setPickdDoc(result.assets[0].name);
    }

  } catch (error) {
    console.log('Erro ao selecionar arquivo: ', error);
  }
    };

    function verificaCPF() {
        if(cpf == null) return 0

        let resto= ((cpf[0]*10) + (cpf[1]*9) + (cpf[2]*8) + (cpf[3]*7) + (cpf[4]*6) + (cpf[5]*5) + (cpf [6] *4)+
        (cpf[7]*3) + (cpf[8]*2)) % 11


        let digitoV1= (resto < 2) ? 0 : 11 - resto;

        if(!(cpf[9]==digitoV1)){
            return 0;
        }

        resto= ((cpf[0]*11) + (cpf[1]*10) + (cpf[2]*9) + (cpf[3]*8) + (cpf[4]*7) + (cpf[5]*6) + (cpf [6] *5)+
        (cpf[7]*4) + (cpf[8]*3) + (digitoV1 * 2)) % 11
        

        let digitoV2 = (resto < 2) ? 0 : 11 - resto;

        if(!(cpf[10]==digitoV2)){
            
            return 0;
        }
        return 1;


    }

    function checkOut(){
        if(cpf == null ||cpf == 0)
            alert('CPF não informado')
        else if(!(verificaCPF()))
            alert('CPF invalido')
    }


    async function cadastro() {
        await setDoc(doc(db,"Users","3"),{
            nome: 'Luck'
        }).then(() => {
            null
        }).catch((erro) => {
            alert(erro);
        })
       

    }
    

    return(
    
        <View style={styles.container}>
            <Text>Nome</Text>
            <TextInput
                placeholder="Digite seu Nome"
                underlineColorAndroid="transparent" // linha abaixo (opcional)
            />

            <Text>CPF</Text>
            <TextInput
                placeholder="Apenas Números"
                underlineColorAndroid="transparent" // linha abaixo (opcional)
                keyboardType="decimal-pad"
                onChangeText={(cpf) => setCpf(cpf)}
                maxLength={11}
            />
            

            <View style={{flexDirection:'row'}}>

                <Switch
                    value={motoristaswitch}
                    onValueChange={()=> {
                        comissao ? setComissao(false) : null;
                        setMotoristaSwitch(!motoristaswitch);
                        
                    }}
                />
                <Text style={{marginTop:13}}>Motorista</Text>

                <Switch
                    value={comissao}
                    onValueChange={()=> {
                        motoristaswitch ? setMotoristaSwitch(false) : null;
                        setComissao(!comissao); 
                    }}
                />
                <Text style={{marginTop:13}}>Comissão</Text>
            </View>
            
           
            {motoristaswitch? null : (
            <>   
            <Picker
            style={styles.picker}
            onValueChange={(itemValue,itemIndex) => setInstituicao(itemValue)}
            >
                <Picker.Item key = {0} value= {0}  label="-----INSTITUIÇÃO-----"/>
                <Picker.Item key = {1} value= {1}  label="UEPB"/>
                <Picker.Item key = {2} value= {2}  label="UFCG"/>
                <Picker.Item key = {3} value= {3}  label="IFPB-CG"/>
                <Picker.Item key = {4} value= {4}  label="UNINASSAU"/>
                <Picker.Item key = {4} value= {4}  label="UNIFIP"/>
            </Picker>

            <Text>Curso</Text>
            <TextInput
                placeholder="Digite seu curso"
                underlineColorAndroid="transparent" // linha abaixo (opcional)
            />
            
            <Text>Matrícula</Text>
            <TextInput
                placeholder="Digite sua matrícula"
                underlineColorAndroid="transparent" // linha abaixo (opcional)
            />

           

            <Button title="Selecionar Arquivo" onPress={pickDocument} />
            {pickDoc === null ? null : (
                <>
                <Text>Arquivo Selecionado : {pickDoc}</Text>
                </>
            )}
                    


            </>
            )}

    
                <TouchableOpacity onPress={checkOut}>
                    <View style={styles.AreaBotao}>
                        <Text style={{color: '#FFF', textAlign: 'center', fontSize: 15}}>Enviar</Text>
                    </View>
                </TouchableOpacity>
    

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
  picker:{
     marginRight: 20 

  },
  AreaBotao: {
    backgroundColor: '#1a6ebc',
    marginTop:20,
    width:400,
    height:40,
    justifyContent:'center',
    alignItems:'center'
  }

 



});