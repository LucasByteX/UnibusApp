import {View,Text,StyleSheet,Button,FlatList,TouchableOpacity,TextInput} from 'react-native';
import { Checkbox } from 'expo-checkbox';
import Cadastro from "../Cadastro";
import {useNavigation} from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ObjetoRota from '../../assets/ObjetoRota';


export default function Rotas({cargo}) {

    

    return(
    <View style={styles.container}>
        <ObjetoRota/>
        <ObjetoRota/>
        
        
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