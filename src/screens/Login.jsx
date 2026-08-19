import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, 
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
    TouchableWithoutFeedback, Keyboard, StatusBar
} from 'react-native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function Login({ onLoginSuccess }) {
    const baseURL = 'http://localhost:28538/';
    
    const navigation = useNavigation();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            Alert.alert("Thông báo", "Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${baseURL}api/auth/login`, {
                email: username, 
                password: password
            });

            const token = response.data.token || response.data;

            if (token && typeof token === 'string') {
                await AsyncStorage.setItem('userToken', token);
                
                if (onLoginSuccess) {
                    onLoginSuccess(token);
                }

                navigation.reset({
                    index: 0,
                    routes: [{ 
                        name: 'MainTabs', 
                        params: { screen: 'Home' } 
                    }],
                });
                
            } else {
                Alert.alert("Lỗi", "Dữ liệu Token trả về không hợp lệ.");
            }
        } catch (error) {
            console.error("Lỗi đăng nhập:", error);
            const errorMsg = error.response?.data?.message || "Tài khoản hoặc mật khẩu không chính xác!";
            Alert.alert("Đăng nhập thất bại", errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.innerContainer}
                >
                    <View style={styles.header}>
                        <Text style={styles.logoText}>InnGo</Text>
                        <Text style={styles.welcomeText}>Chào mừng bạn quay trở lại!</Text>
                        <Text style={styles.subText}>Đăng nhập để trải nghiệm dịch vụ lưu trú tuyệt vời</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email đăng nhập</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập email của bạn"
                                placeholderTextColor="#999"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Mật khẩu</Text>
                            <View style={styles.passwordWrapper}>
                                <TextInput
                                    style={[styles.input, styles.passwordInput]}
                                    placeholder="Nhập mật khẩu"
                                    placeholderTextColor="#999"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity 
                                    style={styles.eyeBtn} 
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    <Text style={styles.eyeIcon}>{showPassword ? "👁️" : "🙈"}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.forgotBtn}>
                            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.loginBtn, loading && styles.disabledBtn]} 
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.loginBtnText}>Đăng Nhập</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Chưa có tài khoản? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.registerText}>Đăng ký ngay</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    innerContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
    header: { alignItems: 'center', marginBottom: 32 },
    logoText: { fontSize: 42, fontWeight: '900', color: '#FF8C00', letterSpacing: 1.5, marginBottom: 8 },
    welcomeText: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
    subText: { fontSize: 13, color: '#666', textAlign: 'center' },
    form: { backgroundColor: '#fff', padding: 20, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
    input: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e9ecef', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#1a1a1a' },
    passwordWrapper: { position: 'relative', justifyContent: 'center' },
    passwordInput: { paddingRight: 50 },
    eyeBtn: { position: 'absolute', right: 12, padding: 8 },
    eyeIcon: { fontSize: 18 },
    forgotBtn: { alignSelf: 'flex-end', marginBottom: 20 },
    forgotText: { fontSize: 13, color: '#FF8C00', fontWeight: '600' },
    loginBtn: { backgroundColor: '#FF8C00', paddingVertical: 14, borderRadius: 12, alignItems: 'center', shadowColor: '#FF8C00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    disabledBtn: { opacity: 0.7 },
    loginBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
    footerText: { fontSize: 14, color: '#666' },
    registerText: { fontSize: 14, color: '#FF8C00', fontWeight: 'bold' }
});