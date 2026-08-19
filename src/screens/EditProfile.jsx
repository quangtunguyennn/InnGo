import React, { useState } from 'react';
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, 
   Alert, ActivityIndicator 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
const baseURL = 'http://localhost:28538/';

export default function EditProfile({ route, navigation }) {
 
  const { profile } = route.params || {};

  const [fullName, setFullName] = useState(profile?.fullname || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!fullName || !email || !phone) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin.');
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const payload = {
        newFullName: fullName,
        newEmail: email,
        newPhone: phone
      };

      await axios.put(`${baseURL}api/auth/Profile`, payload, config);
      Alert.alert('Thành công', 'Cập nhật thông tin thành công!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin lúc này.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Chỉnh sửa thông tin</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Họ và tên</Text>
          <TextInput 
            style={styles.input} 
            value={fullName} 
            onChangeText={setFullName}
            placeholder="Nhập họ và tên"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput 
            style={styles.input} 
            value={email} 
            onChangeText={setEmail}
            placeholder="Nhập email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput 
            style={styles.input} 
            value={phone} 
            onChangeText={setPhone}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
          />
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Lưu thay đổi</Text>}
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