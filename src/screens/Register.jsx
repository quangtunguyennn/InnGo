import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
    TouchableWithoutFeedback, Keyboard, StatusBar, ScrollView
} from 'react-native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function Register({ navigation }) {
    const baseURL = 'http://localhost:28538/';

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
            Alert.alert("Thông báo", "Vui lòng nhập đầy đủ thông tin.");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Lỗi", "Mật khẩu xác nhận không trùng khớp.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                FullName: fullName,
                Email: email,
                Password: password
            };

            await axios.post(`${baseURL}api/auth/register`, payload);

            Alert.alert("Thành công", "Đăng ký tài khoản thành công!", [
                { text: "Đăng nhập ngay", onPress: () => navigation.navigate('Login') }
            ]);
        } catch (error) {
            console.error("Lỗi đăng ký:", error);
            const errorMsg = error.response?.data?.message || "Đăng ký thất bại. Email có thể đã tồn tại.";
            Alert.alert("Lỗi", errorMsg);
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
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        <View style={styles.header}>
                            <Text style={styles.logoText}>InnGo</Text>
                            <Text style={styles.welcomeText}>Tạo tài khoản mới</Text>
                            <Text style={styles.subText}>Tham gia cùng chúng tôi để đặt phòng nhanh chóng</Text>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Họ và tên</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nhập họ và tên của bạn"
                                    placeholderTextColor="#999"
                                    value={fullName}
                                    onChangeText={setFullName}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nhập email của bạn"
                                    placeholderTextColor="#999"
                                    value={email}
                                    onChangeText={setEmail}
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

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Xác nhận mật khẩu</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nhập lại mật khẩu"
                                    placeholderTextColor="#999"
                                    secureTextEntry={!showPassword}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                />
                            </View>

                            <TouchableOpacity 
                                style={[styles.loginBtn, loading && styles.disabledBtn]} 
                                onPress={handleRegister}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.loginBtnText}>Đăng Ký</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Đã có tài khoản? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.registerText}>Đăng nhập</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    innerContainer: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
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
    loginBtn: { backgroundColor: '#FF8C00', paddingVertical: 14, borderRadius: 12, alignItems: 'center', shadowColor: '#FF8C00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, marginTop: 10 },
    disabledBtn: { opacity: 0.7 },
    loginBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
    footerText: { fontSize: 14, color: '#666' },
    registerText: { fontSize: 14, color: '#FF8C00', fontWeight: 'bold' }
});