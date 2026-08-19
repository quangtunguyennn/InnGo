import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
const baseURL = 'http://localhost:28538';

export default function CompletePaymentBank({ route, navigation }) {
  const { 
    bookingId = 0, 
    amount = 500000, 
    bankName = 'MBBank', 
    accountNumber = '0987654321', 
    accountName = 'INNGO SYSTEM' 
  } = route.params || {};

  const [loading, setLoading] = useState(false);


  const qrCodeUrl = `https://img.vietqr.io/image/${bankName}-${accountNumber}-compact2.png?amount=${amount}&addInfo=InnGo%20Booking%20${bookingId}&accountName=${encodeURIComponent(accountName)}`;

 
  const handleSaveQR = () => {
    Alert.alert("Thành công", "Đã tải mã QR về thư viện ảnh thiết bị.");
  };


  const handleCompletePayment = async () => {
    if (!bookingId) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin đơn đặt phòng.");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert("Thông báo", "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        navigation.navigate('Login');
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

    
      const response = await axios.patch(
        `${baseURL}/api/payment/complete?bookingId=${bookingId}`,
        {},
        config
      );

      if (response.data) {
        Alert.alert(
          "Thành công", 
          "Xác nhận thanh toán thành công! Cảm ơn bạn đã lựa chọn InnGo.",
          [
            { 
              text: "Trở về trang chủ", 
              onPress: () => navigation.navigate('MainTabs', { screen: 'Home' }) 
            }
          ]
        );
      }
    } catch (error) {
      console.error('Lỗi khi hoàn tất thanh toán:', error);
      const errorMsg = error.response?.data?.message || "Hoàn tất thanh toán thất bại. Vui lòng thử lại!";
      Alert.alert("Lỗi thanh toán", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
       
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Quay lại</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Thanh toán chuyển khoản</Text>
        <Text style={styles.subtitle}>Sử dụng ứng dụng ngân hàng để quét mã QR bên dưới</Text>

      
        <View style={styles.qrCard}>
          <Image 
            source={{ uri: qrCodeUrl }} 
            style={styles.qrImage}
            resizeMode="contain"
          />
          <TouchableOpacity style={styles.saveQrBtn} onPress={handleSaveQR}>
            <Text style={styles.saveQrText}>💾 Lưu mã QR về máy</Text>
          </TouchableOpacity>
        </View>

     
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngân hàng:</Text>
            <Text style={styles.infoValue}>{bankName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Số tài khoản:</Text>
            <Text style={styles.infoValueHighlight}>{accountNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Chủ tài khoản:</Text>
            <Text style={styles.infoValue}>{accountName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Số tiền:</Text>
            <Text style={styles.amountText}>{amount.toLocaleString('vi-VN')} VNĐ</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Nội dung CK:</Text>
            <Text style={styles.infoValueHighlight}>InnGo Booking {bookingId}</Text>
          </View>
        </View>

       
        <TouchableOpacity 
          style={[styles.completeBtn, loading && styles.disabledBtn]} 
          onPress={handleCompletePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.completeBtnText}>Tôi đã hoàn tất chuyển khoản</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { padding: 20 },
  backBtn: { marginBottom: 16 },
  backBtnText: { fontSize: 16, color: '#FF8C00', fontWeight: '600' },
  
  title: { fontSize: 24, fontWeight: 'bold', color: '#101828', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#667085', marginBottom: 20 },

  qrCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20
  },
  qrImage: { width: 230, height: 230, marginBottom: 16 },
  saveQrBtn: {
    backgroundColor: '#FFF3E0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE0B2'
  },
  saveQrText: { color: '#FF8C00', fontSize: 14, fontWeight: '600' },

  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7'
  },
  infoLabel: { fontSize: 14, color: '#667085' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#101828' },
  infoValueHighlight: { fontSize: 14, fontWeight: 'bold', color: '#FF8C00' },
  amountText: { fontSize: 16, fontWeight: 'bold', color: '#027A48' },

  completeBtn: {
    backgroundColor: '#FF8C00',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  disabledBtn: { opacity: 0.7 },
  completeBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});