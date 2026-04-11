import { StyleSheet, TextInput, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Entypo from '@expo/vector-icons/Entypo';
import { useState } from 'react';


export default function () {

    const [rota, setRota] = useState('UEPB-UFCG-IFPB');
    const [pessoas, setPessoas] = useState(40);
    const [botaoStatus, setbotaoStatus] = useState(true);
    const [hora,setHora]=useState('5:30');
    const [limite,setLimite]= useState(40);

    



    return (
        <View style={styles.container}>
            <View style={styles.areaObjeto}>
                <View style={styles.superior}>
                    <Text> Rota:{rota}</Text>
                    <Text>HORA: {hora}</Text>
                </View>

                <View style={styles.inferior}>


                    <View style={styles.quantidade}>
                        <Text style={styles.textoQuantidade}>{pessoas}/{limite}</Text>
                        {pessoas>=40 ?
                            <>
                            <View style={{ flexDirection: 'row' ,marginLeft:33}}>
                                <Entypo name="warning" size={18} color="black" />
                                <Text>LOTADO!</Text>
                            </View>
                            </>
                            :
                            null
                        }
                    </View>
                    <TouchableOpacity onPress={() => setPessoas(pessoas+1)}>
                        <View style={[styles.areaBotao, { backgroundColor: botaoStatus ? 'green' : 'red' }]}>

                            <MaterialCommunityIcons name="bus-electric" size={27} color="black" />

                        </View>
                    </TouchableOpacity>

                </View>


            </View>

        </View>

    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    areaObjeto: {

        backgroundColor: '#32b7c3',
        width: 300,
        height: 170,
        borderRadius: 10
    },
    superior: {
        flex: 1,

    }
    ,
    inferior: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: "center"


    },
    areaBotao: {
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 3,
        width: 40,
        height: 40,
        marginRight: 20,
        backgroundColor: 'red'

    },
    quantidade: {
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10

    },
    textoQuantidade: {
        fontSize: 20,
        marginLeft:10
    }
});
