import {View,Text,StyleSheet,Button,FlatList,TouchableOpacity,TextInput} from 'react-native';
import { Checkbox } from 'expo-checkbox';
import Cadastro from "../Cadastro";
import {useNavigation} from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';


export default function Rotas({cargo}) {

    

    return(
    <View style={styles.container}>
        <Text>Rotas Disponiveis</Text>
        {!(cargo === "Comissao" || cargo==="Motorista") ? null : (
          <>
          <TouchableOpacity style={styles.botton}>
          <Text>Adicionar Rota</Text>
          </TouchableOpacity>
          </>
        )}
        
        
    </View>
    );



}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botton:{
    backgroundColor: 'red'
  },
  botton2:{
    backgroundColor: 'blue'
  }
});