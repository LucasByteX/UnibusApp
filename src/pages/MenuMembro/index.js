import react from "react";
import React, { useState,useEffect } from 'react';
import {View,Text,StyleSheet,Button,FlatList,TouchableOpacity,TextInput} from 'react-native';
import { Checkbox } from 'expo-checkbox';
import {useNavigation} from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Viagem from "../Viagem";
import Perfil from "../Perfil";

export default function MenuMembro() {

    const Tab = createBottomTabNavigator();

    return(
    
        <Tab.Navigator screenOptions={{
        headerShown: false,
        }}>
            <Tab.Screen name="Viagem" component={Viagem} />
            <Tab.Screen name="Perfil" component={Perfil} />
        </Tab.Navigator>
    
    );



}