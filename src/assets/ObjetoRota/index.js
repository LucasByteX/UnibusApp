import { StyleSheet, TextInput, Text, TouchableOpacity, View } from 'react-native';
import { Alert } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Entypo from '@expo/vector-icons/Entypo';
import { Component, useState, useEffect } from 'react';
import { Button } from '@react-navigation/elements';
import EscolhaRotaModal from './EscolhaRotaModal';



export default function () {

    const [rota, setRota] = useState('UEPB-UFCG-IFPB');
    const [pessoas, setPessoas] = useState(41);
    const [botaoStatus, setbotaoStatus] = useState(false);
    const [hora, setHora] = useState('5:30');
    const [data, setData] = useState('11/04/2026');
    const [limite, setLimite] = useState(40);
    const [motorista, setMotorista] = useState('Josemir');
    const [dataCold, setDataCold] = useState(null);
    const [mostrar, setMostrar] = useState(false);
    const [idavol, setIdaVol] = useState('');
    const [cargo, setCargo] = useState('Comissao');


    useEffect(() => {

        async function getStorage() {
            const dataStorage = await AsyncStorage.getItem('datas');
            if (dataStorage !== null) {
                setDataCold(new Date(dataStorage));
            }
        }
        //getStorage();


    }, []);


    useEffect(() => {

        async function saveStorage() {
            await AsyncStorage.setItem('datas', dataCold.toISOString());
        }
        saveStorage();

    }, [dataCold])

    function acesso() {
        if (cargo == 'Comissao' || cargo == 'Motorista') {
            return 1;
        }
        return 0;
    }


    function clickButton() {

        const atual = new Date();
        const diferenca = atual - dataCold;

        if (dataCold === null) {
            setDataCold(new Date());
            if (!botaoStatus) {
                setMostrar(true);
            }
            else {
                setbotaoStatus(!botaoStatus);
            }
        }

        else if (diferenca >= 1 * 60 * 1000) {
            if (!botaoStatus) {
                setMostrar(true);
            }
            else {
                setbotaoStatus(!botaoStatus);
            }
            setDataCold(new Date());
        }


        else
            Alert.alert(
                "Atenção",
                "Espere 2 minutos antes de fazer qualquer alteração",
                [

                    { text: "Esperar" }
                ]
            );


    }

    function alerta() {
        Alert.alert(
            "Atenção",
            "Deseja continuar?",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Confirmar", onPress: () => console.log("OK") }
            ]
        );
    }




    return (
        <View style={styles.container}>
            <EscolhaRotaModal
                visible={mostrar}
                onClose={() => {
                    setDataCold(null);
                    setMostrar(false)

                }}
                onSelect={(opcao) => {
                    setIdaVol(opcao);
                    setbotaoStatus(!botaoStatus);
                    setMostrar(false);
                }}
            />
            <View style={styles.areaObjeto}>

                <View style={styles.superior}>
                    <View style={styles.leftSuperior}>
                        <Text style={styles.textInfoPadrao}>Rota:{"\n" + rota}</Text>
                        <Text style={styles.textInfoPadrao}>Data:{data}</Text>
                        <Text style={styles.textInfoPadrao}>HORA: {hora}</Text>
                        <Text style={styles.textInfoPadrao}>Motorista: {motorista}</Text>
                    </View>
                    <View style={styles.rightSuperior}>
                        {acesso() ?
                            <>
                                <View style={styles.areaRB1}>
                                    <TouchableOpacity>
                                        <FontAwesome name="edit" size={45} color="black" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.areaRB2}>
                                    <TouchableOpacity>
                                        <MaterialCommunityIcons name="restart" size={34} color="black" />
                                    </TouchableOpacity>
                                </View>

                            </> : null}



                    </View>
                </View>

                <View style={styles.inferior}>

                    <View style={styles.leftInferior}>
                        <View style={styles.quantidade}>
                            <Text>IDA:</Text>
                            <View style={styles.quantidadeInfo}>
                                {pessoas > limite ? <>
                                    <Entypo name="warning" size={23} color="black" />
                                </> :
                                    null
                                }
                                <Text style={[styles.textoQuantidade, { marginRight: (pessoas > limite) ? 25 : 0 }]} >{pessoas}/{limite}</Text>
                            </View>

                        </View>
                        <View style={styles.quantidade}>
                            <Text>VOLTA:</Text>
                            <View style={styles.quantidadeInfo}>
                                {pessoas > limite ? <>
                                    <Entypo name="warning" size={23} color="black" />
                                </> :
                                    null
                                }
                                <Text style={[styles.textoQuantidade, { marginRight: (pessoas > limite) ? 25 : 0 }]} >{pessoas}/{limite}</Text>
                            </View>

                        </View>
                    </View>
                    <View style={styles.rightInferior}>
                        <TouchableOpacity onPress={() => clickButton()} style={[styles.areaBotao, { backgroundColor: botaoStatus ? 'green' : 'red' }]}>

                                {!botaoStatus ? <>
                                    <MaterialCommunityIcons name="bus-electric" size={30} color="black" />
                                </> :
                                    <>
                                        <MaterialCommunityIcons name="bus-stop" size={30} color="black" />
                                    </>
                                }
                        </TouchableOpacity>

                    </View>

                </View>


            </View>

        </View>

    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    areaObjeto: {
        borderWidth: 3,
        backgroundColor: '#5290e7',
        width: 350,
        height: 230,
        borderRadius: 10,
        flexDirection: 'column'
    },
    superior: {
        flex: 1,
        flexDirection: 'row',


    }
    ,
    inferior: {
        flex: 1,
        flexDirection: 'row',


    },
    areaBotao: {
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 3,
        width: 60,
        height: 60,
        marginRight: 20,
        backgroundColor: 'red'

    },
    quantidade: {
        justifyContent: 'center',
        alignItems: 'center',
        margin: 5

    },
    textoQuantidade: {
        fontSize: 20,
        marginLeft: 10
    },
    leftSuperior: {
        flex: 1,
        //backgroundColor:'red'


    },
    rightSuperior: {
        flex: 1,
        flexDirection: 'row',

        //backgroundColor:'green'
    },
    leftInferior: {
        flex: 1
        //backgroundColor:'blue'
    },
    rightInferior: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
        //backgroundColor:'red'
    },
    quantidadeInfo: {
        flexDirection: 'row'
    },

    textInfoPadrao: {
        margin: 2,
        textAlign: 'left'
    },
    areaRB1: {
        flex: 2,
        //backgroundColor:'blue',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 27,
        marginTop: 5


    },
    areaRB2: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        //backgroundColor:'red'

    }
});
