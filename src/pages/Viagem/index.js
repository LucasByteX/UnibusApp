import {View,Text,StyleSheet,Button,FlatList,TouchableOpacity,TextInput} from 'react-native';
import { Checkbox } from 'expo-checkbox';
import Cadastro from "../Cadastro";
import {useNavigation} from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';


export default function Viagem() {

    

    return(
    <View style={styles.container}>
        <Text>Aqui vão ser exibidas as viagens</Text>
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