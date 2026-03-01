import react from "react";
import React, { useState,useEffect } from 'react';
import {View,Text,Switch,StyleSheet,Button,FlatList,TouchableOpacity,TextInput} from 'react-native';
import { Checkbox } from 'expo-checkbox';
import {Picker} from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';

export default function Cadastro () {


    const [instituicao,setInstituicao] = useState(0);
    const [motoristaswitch,setMotoristaSwitch] = useState(0);
    const [comissao,setComissao] = useState('0');
    const [pickDoc,setPickdDoc] = useState(null);

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
            />
            

            <View style={{flexDirection:'row'}}>

                <Switch
                    value={motoristaswitch}
                    onValueChange={()=> setMotoristaSwitch(!motoristaswitch)}
                />
                <Text style={{marginTop:13}}>Motorista</Text>
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

            <View style={{flexDirection:'row'}}>

                <Checkbox
                    value={comissao}
                    onValueChange={setComissao}
                />

                <TouchableOpacity onPress={() => setComissao(!comissao)}>    
                <Text style={{marginLeft:10}}>Membro da Comissão</Text>
                </TouchableOpacity>

        
               


            </View>

            <Button title="Selecionar Arquivo" onPress={pickDocument} />
            {pickDoc === null ? null : (
                <>
                <Text>Arquivo Selecionado : {pickDoc}</Text>
                </>
            )}
                    


            </>
            )}

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

  }

 



});