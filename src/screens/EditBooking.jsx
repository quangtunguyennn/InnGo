import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,

  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker'; // Thêm import DateTimePicker

// Hàm hỗ trợ tính số đêm
const calculateNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const diffTime = outDate.getTime() - inDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

// Hàm hỗ trợ format ngày (YYYY-MM-DD) sang (DD/MM/YYYY) để hiển thị đẹp hơn
const formatDateToVN = dateString => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

export default function EditBooking({ route, navigation }) {
  const { bookingId } = route.params || {};
  const baseURL = 'http://localhost:28538/';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // States form cơ bản
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // States quản lý DatePicker
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('checkIn'); // 'checkIn' hoặc 'checkOut'
  const [currentPickerDate, setCurrentPickerDate] = useState(new Date());

  // States dịch vụ
  const [allServices, setAllServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  // States dùng cho tính toán giá Tạm tính trên UI
  const [roomPrice, setRoomPrice] = useState(0);
  const [estimatedTotal, setEstimatedTotal] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 1. Gọi API lấy toàn bộ Services
        const servicesResponse = await axios.get(
          `${baseURL}api/service/getAll`,
          config,
        );
        const servicesData = servicesResponse.data || [];
        setAllServices(servicesData);

        // 2. Gọi API lấy chi tiết Booking
        const bookingResponse = await axios.get(
          `${baseURL}api/booking/get/${bookingId}`,
          config,
        );
        const data = bookingResponse.data;

        const inStr = data.checkInDate.split('T')[0];
        const outStr = data.checkOutDate.split('T')[0];
        setCheckInDate(inStr);
        setCheckOutDate(outStr);
        setPaymentMethod(data.paymentMethod || 'Cash');

        // 3. Xử lý dịch vụ cũ đã chọn & mapping giá tiền
        let oldServicesTotal = 0;
        const mappedSelectedServices = [];

        if (data.selectedServices && data.selectedServices.length > 0) {
          data.selectedServices.forEach(ds => {
            const sId = ds.serviceID || ds.serviceId;
            const matchedSrv = servicesData.find(s => s.serviceId === sId);

            if (matchedSrv) {
              oldServicesTotal += matchedSrv.price * ds.quantity;
              mappedSelectedServices.push({
                serviceID: matchedSrv.serviceId,
                price: matchedSrv.price,
                quantity: ds.quantity,
              });
            }
          });
        }
        setSelectedServices(mappedSelectedServices);

        // 4. Nội suy giá phòng / 1 đêm
        const oldNights = calculateNights(inStr, outStr);
        const derivedRoomPrice =
          oldNights > 0 ? (data.totalAmount - oldServicesTotal) / oldNights : 0;
        setRoomPrice(derivedRoomPrice);
      } catch (error) {
        console.error(error);
        Alert.alert('Lỗi', 'Không thể lấy dữ liệu để chỉnh sửa.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) fetchData();
  }, [bookingId]);

  useEffect(() => {
    const nights = calculateNights(checkInDate, checkOutDate);
    const servicesTotal = selectedServices.reduce(
      (sum, s) => sum + s.price * s.quantity,
      0,
    );
    const newTotal = nights * roomPrice + servicesTotal;
    setEstimatedTotal(newTotal > 0 ? newTotal : 0);
  }, [checkInDate, checkOutDate, selectedServices, roomPrice]);

  // Hàm mở DatePicker
  const openDatePicker = mode => {
    setPickerMode(mode);
    const activeDateStr = mode === 'checkIn' ? checkInDate : checkOutDate;
    if (activeDateStr) {
      setCurrentPickerDate(new Date(activeDateStr));
    } else {
      setCurrentPickerDate(new Date());
    }
    setShowPicker(true);
  };

  // Hàm xử lý khi chọn ngày trên DatePicker
  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false); // Android ẩn picker ngay sau khi chọn
    }

    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0]; // Format YYYY-MM-DD

      if (pickerMode === 'checkIn') {
        setCheckInDate(dateStr);
        // Tự động đẩy ngày trả phòng lên nếu ngày nhận phòng sau ngày trả phòng
        if (checkOutDate && new Date(dateStr) >= new Date(checkOutDate)) {
          const nextDay = new Date(selectedDate);
          nextDay.setDate(nextDay.getDate() + 1);
          setCheckOutDate(nextDay.toISOString().split('T')[0]);
        }
      } else {
        if (checkInDate && new Date(selectedDate) <= new Date(checkInDate)) {
          Alert.alert('Lỗi', 'Ngày trả phòng phải sau ngày nhận phòng.');
          return;
        }
        setCheckOutDate(dateStr);
      }
      setCurrentPickerDate(selectedDate);
    }
  };

  const handleServiceChange = (serviceId, price, delta) => {
    setSelectedServices(prev => {
      const existing = prev.find(s => s.serviceID === serviceId);
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) return prev.filter(s => s.serviceID !== serviceId);
        return prev.map(s =>
          s.serviceID === serviceId ? { ...s, quantity: newQty } : s,
        );
      } else {
        if (delta > 0)
          return [...prev, { serviceID: serviceId, price: price, quantity: 1 }];
        return prev;
      }
    });
  };

  const getServiceQuantity = serviceId => {
    const found = selectedServices.find(s => s.serviceID === serviceId);
    return found ? found.quantity : 0;
  };

  const handleUpdate = async () => {
    if (!checkInDate || !checkOutDate) {
      Alert.alert('Lỗi', 'Vui lòng chọn đầy đủ ngày nhận và trả phòng.');
      return;
    }

    if (calculateNights(checkInDate, checkOutDate) <= 0) {
      Alert.alert('Lỗi', 'Ngày trả phòng phải sau ngày nhận phòng.');
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const payload = {
        checkInDate: `${checkInDate}T14:00:00`,
        checkOutDate: `${checkOutDate}T12:00:00`,
        paymentMethod: paymentMethod,
        selectedServices: selectedServices.map(s => ({
          serviceID: s.serviceID,
          quantity: s.quantity,
        })),
      };

      await axios.put(
        `${baseURL}api/booking/edit?bookingId=${bookingId}`,
        payload,
        config,
      );

      Alert.alert('Thành công', 'Đơn đặt phòng đã được cập nhật!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data ||
        'Không thể cập nhật đơn đặt phòng do trùng lịch hoặc vi phạm chính sách.';
      Alert.alert('Thất bại', typeof msg === 'string' ? msg : 'Lỗi hệ thống');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Chỉnh sửa đơn #{bookingId}</Text>
        <Text style={styles.subtitle}>
          Sửa ngày lưu trú, dịch vụ đi kèm hoặc phương thức thanh toán.
        </Text>

        {/* THÔNG TIN LƯU TRÚ VÀ GIÁ PHÒNG */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>1. Thời gian lưu trú</Text>
            {/* HIỂN THỊ GIÁ PHÒNG 1 ĐÊM Ở ĐÂY */}
            <Text style={styles.roomPriceLabel}>
              Giá phòng:{' '}
              <Text style={styles.roomPriceValue}>
                {roomPrice.toLocaleString('vi-VN')} ₫/đêm
              </Text>
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Ngày nhận phòng</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => openDatePicker('checkIn')}
            >
              <Text style={styles.datePickerText}>
                {checkInDate
                  ? formatDateToVN(checkInDate)
                  : 'Chọn ngày nhận phòng'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Ngày trả phòng</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => openDatePicker('checkOut')}
            >
              <Text style={styles.datePickerText}>
                {checkOutDate
                  ? formatDateToVN(checkOutDate)
                  : 'Chọn ngày trả phòng'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* HIỂN THỊ COMPONENT DATE PICKER */}
        {showPicker && (
          <DateTimePicker
            value={currentPickerDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            minimumDate={new Date()} // Không cho phép chọn ngày trong quá khứ
          />
        )}

        {/* DỊCH VỤ ĐI KÈM */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Dịch vụ đi kèm</Text>
          {allServices.length === 0 ? (
            <Text style={styles.emptyText}>Không có dịch vụ nào.</Text>
          ) : (
            allServices.map(item => {
              const qty = getServiceQuantity(item.serviceId);
              return (
                <View key={item.serviceId} style={styles.serviceRow}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{item.name}</Text>
                    <Text style={styles.servicePrice}>
                      {item.price?.toLocaleString('vi-VN')} ₫
                    </Text>
                  </View>
                  <View style={styles.qtyControl}>
                    <TouchableOpacity
                      style={[
                        styles.qtyBtn,
                        qty === 0 && styles.qtyBtnDisabled,
                      ]}
                      onPress={() =>
                        handleServiceChange(item.serviceId, item.price, -1)
                      }
                      disabled={qty === 0}
                    >
                      <Text
                        style={[
                          styles.qtyBtnText,
                          qty === 0 && styles.qtyBtnTextDisabled,
                        ]}
                      >
                        -
                      </Text>
                    </TouchableOpacity>

                    <Text style={styles.qtyText}>{qty}</Text>

                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() =>
                        handleServiceChange(item.serviceId, item.price, 1)
                      }
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* PHƯƠNG THỨC THANH TOÁN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Phương thức thanh toán</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[
                styles.radioBtn,
                paymentMethod === 'Cash' && styles.radioActive,
              ]}
              onPress={() => setPaymentMethod('Cash')}
            >
              <Text
                style={[
                  styles.radioText,
                  paymentMethod === 'Cash' && styles.radioTextActive,
                ]}
              >
                Tiền mặt
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radioBtn,
                paymentMethod === 'Bank' && styles.radioActive,
              ]}
              onPress={() => setPaymentMethod('Bank')}
            >
              <Text
                style={[
                  styles.radioText,
                  paymentMethod === 'Bank' && styles.radioTextActive,
                ]}
              >
                Chuyển khoản
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            * Bạn chỉ có thể sửa đơn trước 48h so với giờ Check-in cũ. Việc sửa
            đổi ngày hoặc thêm dịch vụ sẽ thay đổi tổng tiền phải trả.
          </Text>
        </View>
      </ScrollView>

      {/* FOOTER THANH TOÁN & LƯU */}
      <View style={styles.bottomBar}>
        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>Tổng tiền (Tạm tính):</Text>
            <Text style={styles.nightsLabel}>
              ({calculateNights(checkInDate, checkOutDate)} đêm)
            </Text>
          </View>
          <Text style={styles.totalPrice}>
            {estimatedTotal.toLocaleString('vi-VN')} ₫
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
          onPress={handleUpdate}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>Xác nhận & Lưu</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#101828',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#475467',
    marginBottom: 24,
    lineHeight: 22,
  },
  section: { marginBottom: 24 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101828',
    marginBottom: 0,
  },
  roomPriceLabel: { fontSize: 14, color: '#667085', fontWeight: '500' },
  roomPriceValue: { color: '#039855', fontWeight: 'bold' },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#344054', marginBottom: 8 },

  /* Style mới cho DatePicker Button (thay thế TextInput) */
  datePickerButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  datePickerText: { fontSize: 16, color: '#101828' },

  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EAECF0',
  },
  serviceInfo: { flex: 1 },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#101828',
    marginBottom: 4,
  },
  servicePrice: { fontSize: 14, color: '#FF6B00', fontWeight: '500' },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EAECF0',
  },
  qtyBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnDisabled: { opacity: 0.3 },
  qtyBtnText: { fontSize: 18, fontWeight: '600', color: '#101828' },
  qtyBtnTextDisabled: { color: '#98A2B3' },
  qtyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#101828',
    width: 28,
    textAlign: 'center',
  },
  emptyText: { fontSize: 14, color: '#667085', fontStyle: 'italic' },
  radioGroup: { flexDirection: 'row', gap: 12 },
  radioBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  radioActive: { borderColor: '#FF6B00', backgroundColor: '#FFF4EB' },
  radioText: { fontSize: 15, fontWeight: '600', color: '#344054' },
  radioTextActive: { color: '#FF6B00' },
  noteBox: {
    backgroundColor: '#FEF3F2',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  noteText: {
    color: '#B42318',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  bottomBar: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F2F4F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: { fontSize: 15, color: '#475467', fontWeight: '500' },
  nightsLabel: { fontSize: 13, color: '#667085', marginTop: 2 },
  totalPrice: { fontSize: 20, fontWeight: '800', color: '#FF6B00' },
  submitBtn: {
    backgroundColor: '#FF6B00',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
