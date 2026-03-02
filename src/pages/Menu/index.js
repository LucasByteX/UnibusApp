import react from "react";
import React, { useState,useEffect } from 'react';
import {View,Text,StyleSheet,Button,FlatList,TouchableOpacity,TextInput} from 'react-native';
import { Checkbox } from 'expo-checkbox';
import {useNavigation} from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Feather from '@expo/vector-icons/Feather';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import Rotas from "../Rotas";
import Perfil from "../Perfil";
import Usuarios from "../Usuarios";


export default function Menu({route, navigation}) {
    const {cargo} = route.params;
    const Tab = createBottomTabNavigator();

    return(
    
        <Tab.Navigator screenOptions={{
        headerShown: false,
        }}>
            <Tab.Screen name="Rotas" options={{tabBarIcon: ({color,size}) => {
                return <MaterialCommunityIcons name="bus-multiple" color = {color} size = {size}/>
            }}}> 
                {() => <Rotas cargo= {cargo} />}
            </Tab.Screen>
            {(cargo == "Membro") ? null : (
            <>
                <Tab.Screen name="Usuarios" component={Usuarios} options ={{tabBarIcon: ({color,size}) => {
                    return <Feather name="users" size={size} color={color} />
                }}}/>
            </>
            )}
            <Tab.Screen name="Perfil" component={Perfil} options={{tabBarIcon: ({color,size}) => {
                return <EvilIcons name="user" size={size} color={color} />
            }}}/>
        </Tab.Navigator>
    
    );



}