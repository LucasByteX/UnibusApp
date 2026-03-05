import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState } from 'react';


export default function SecurityInput({value,onChangeText}) {
    const [seguranca, setSeguranca] = useState(false);



    return (
        

            <View style={styles.areaTexto}>
                <View style={styles.areaTextoCima}>
                    <TextInput
                        style={styles.input}
                        secureTextEntry={seguranca ? false : true}
                        value={value}
                        onChangeText={onChangeText}
                        maxLength={20}

                    />
                </View>

                <View style={styles.areaTextoBaixo}>
                    <TouchableOpacity style={{ marginRight: 10 }} onPress={() => setSeguranca(!seguranca)}>

                        {seguranca ?
                            <>
                                <FontAwesome name="unlock-alt" size={29} color="black" paddingLeft={5} />
                            </> :

                            <>
                                <FontAwesome name="lock" size={29} color="black" paddingLeft={5} />
                            </>


                        }

                    </TouchableOpacity>
                </View>

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
    areaTexto: {
        borderWidth: 1,
        width: 300,
        height: 50,
        borderRadius:10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    inputx: {
        marginBottom: 20,
        minHeight: 40,
        width: 300,
        height: 50,
        borderRadius: 10,
        borderWidth: 1

    },
    areaTextoCima: {
        flex: 1,
        justifyContent: 'flex-start',

    },
    areaTextoBaixo: {

        justifyContent: 'flex-end',
    }
});

