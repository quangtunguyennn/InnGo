import React, { useState } from 'react';
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, 
   Alert, ActivityIndicator 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';

const baseURL = 'http://localhost:28538/';

export default function ChangePassword({ navigation }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ các trường.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới và xác nhận không khớp.');
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const payload = {
        oldPassword: oldPassword,
        newPassword: newPassword,
        confirmNewPassword: confirmPassword
      };

      await axios.put(`${baseURL}api/auth/changePassword`, payload, config);
      Alert.alert('Thành công', 'Đổi mật khẩu thành công!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Mật khẩu cũ không chính xác hoặc có lỗi xảy ra.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Đổi mật khẩu</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Mật khẩu hiện tại</Text>
          <TextInput 
            style={styles.input} 
            value={oldPassword} 
            onChangeText={setOldPassword}
            placeholder="Nhập mật khẩu hiện tại"
            secureTextEntry
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Mật khẩu mới</Text>
          <TextInput 
            style={styles.input} 
            value={newPassword} 
            onChangeText={setNewPassword}
            placeholder="Nhập mật khẩu mới"
            secureTextEntry
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
          <TextInput 
            style={styles.input} 
            value={confirmPassword} 
            onChangeText={setConfirmPassword}
            placeholder="Nhập lại mật khẩu mới"
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Cập nhật mật khẩu</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 24 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#101828', marginBottom: 30 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#344054', marginBottom: 8 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#EAECF0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#101828' },
  saveBtn: { backgroundColor: '#FF8C00', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});