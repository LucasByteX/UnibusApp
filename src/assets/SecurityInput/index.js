import { StyleSheet, TextInput, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useRef } from 'react';

const C = {
  bordaSutil: '#243d2a',
  verde:      '#3d8b5c',
  textoClaro: '#dfe8da',
  textoSuave: '#3d5c43',
};

export default function SecurityInput({ value, onChangeText, placeholder }) {
  const [visivel, setVisivel] = useState(false);
  const [focado, setFocado]   = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  function onFocus() {
    setFocado(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  }
  function onBlur() {
    setFocado(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  }

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [C.bordaSutil, C.verde],
  });

  return (
    <Animated.View style={[styles.wrapper, { borderBottomColor: borderColor }]}>
      <TextInput
        style={styles.input}
        secureTextEntry={!visivel}
        value={value}
        onChangeText={onChangeText}
        maxLength={20}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={placeholder}
        placeholderTextColor={C.textoSuave}
        contextMenuHidden={true}
        onFocus={onFocus}
        onBlur={onBlur}
        selectionColor={C.verde}
      />
      <TouchableOpacity onPress={() => setVisivel(!visivel)} style={styles.iconBtn} activeOpacity={0.7}>
        <MaterialCommunityIcons
          name={visivel ? 'eye-outline' : 'eye-off-outline'}
          size={22}
          color={focado ? C.verde : C.textoSuave}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    marginBottom: 24,
    paddingBottom: 6,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#dfe8da',
    paddingVertical: 4,
  },
  iconBtn: { padding: 4 },
});