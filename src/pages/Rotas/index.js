import {View,Text,StyleSheet,Button,FlatList,TouchableOpacity,TextInput} from 'react-native';
import { Checkbox } from 'expo-checkbox';
import Cadastro from "../Cadastro";
import {useNavigation} from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';


export default function Rotas({cargo}) {

    

    return(
    <View style={styles.container}>
        {!(cargo === "Comissao" || cargo==="Motorista") ? null : (
          <>
          <Text>Adicionar Rota</Text>
          </>
        )}
        <Text>Rotas Disponiveis</Text>
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
});