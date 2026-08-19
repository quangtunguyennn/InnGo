import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BookingTrans({ route, navigation }) {
  const { room, searchCheckIn, searchCheckOut } = route.params;

  
  const baseURL = 'http://localhost:28538/';

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedServices, setSelectedServices] = useState([]);
  const [isBooking, setIsBooking] = useState(false);

  const [checkInDate, setCheckInDate] = useState(
    searchCheckIn ? new Date(searchCheckIn) : new Date(),
  );
  const [checkOutDate, setCheckOutDate] = useState(
    searchCheckOut
      ? new Date(searchCheckOut)
      : new Date(new Date().setDate(new Date().getDate() + 1)),
  );

  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${baseURL}api/service/getAll`);
      setServices(response.data);
    } catch (error) {
      console.error('Lỗi lấy danh sách dịch vụ:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateService = (serviceId, delta) => {
    setSelectedServices(prev => {
      const existingService = prev.find(s => s.ServiceID === serviceId);
      if (existingService) {
        const newQuantity = existingService.Quantity + delta;
        if (newQuantity <= 0)
          return prev.filter(s => s.ServiceID !== serviceId);
        return prev.map(s =>
          s.ServiceID === serviceId ? { ...s, Quantity: newQuantity } : s,
        );
      } else if (delta > 0) {
        return [...prev, { ServiceID: serviceId, Quantity: 1 }];
      }
      return prev;
    });
  };

  const getServiceQuantity = serviceId => {
    const service = selectedServices.find(s => s.ServiceID === serviceId);
    return service ? service.Quantity : 0;
  };

  const onChangeCheckIn = (event, selectedDate) => {
    setShowCheckInPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setCheckInDate(selectedDate);
      if (selectedDate >= checkOutDate) {
        const newCheckOut = new Date(selectedDate);
        newCheckOut.setDate(newCheckOut.getDate() + 1);
        setCheckOutDate(newCheckOut);
      }
    }
  };

  const onChangeCheckOut = (event, selectedDate) => {
    setShowCheckOutPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setCheckOutDate(selectedDate);
    }
  };

  const formatDate = date => date.toLocaleDateString('vi-VN');

  const handleBookNow = async () => {
    setIsBooking(true);

    const bookingPayload = {
      roomId: room.roomId,
      CheckInDate: checkInDate.toISOString(),
      CheckOutDate: checkOutDate.toISOString(),
      PaymentMethod: paymentMethod,
      SelectedServices: selectedServices.length > 0 ? selectedServices : null,
    };

    try {
    
      const token = await AsyncStorage.getItem('userToken');

      if (!token) {
        Alert.alert(
          'Cần đăng nhập',
          'Vui lòng đăng nhập trước khi thực hiện đặt phòng.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }],
        );
        return;
      }

      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      
      const response = await axios.post(
        `${baseURL}api/booking/createNewBooking`,
        bookingPayload,
        config,
      );

      if (response.data === 'Booked successfully.') {
        Alert.alert(
          'Thành công',
          `Đặt phòng thành công với phương thức ${
            paymentMethod === 'Cash' ? 'Tiền mặt' : 'Chuyển khoản'
          }!`,
          [
           
            {
              text: 'OK',
              onPress: () =>
                navigation.navigate('MainTabs', { screen: 'Bookings' }),
            },
          ],
        );
      } else {
        Alert.alert('Thông báo', response.data);
      }
    } catch (error) {
      console.error('Lỗi gọi API Đặt phòng:', error);
      if (error.response && error.response.status === 401) {
        Alert.alert(
          'Phiên làm việc hết hạn',
          'Vui lòng đăng nhập lại để tiếp tục.',
        );
      } else {
        Alert.alert(
          'Lỗi kết nối',
          'Không thể kết nối tới máy chủ. Vui lòng kiểm tra lại mạng hoặc backend.',
        );
      }
    } finally {
      setIsBooking(false);
    }
  };
  if (!room) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text>Đang tải dữ liệu phòng...</Text>
      </View>
    );
  }
  const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
  const nights = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
  const totalRoomPrice = (room?.price || 0) * nights;

  const totalServicePrice = selectedServices.reduce((sum, selected) => {
    const serviceDetails = services.find(
      s => s.serviceId === selected.ServiceID,
    );
    return (
      sum + (serviceDetails ? serviceDetails.price * selected.Quantity : 0)
    );
  }, 0);

  const totalPrice = totalRoomPrice + totalServicePrice;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image source={{ uri: room.imageUrl }} style={styles.coverImage} />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Trở về</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.roomHeaderInfo}>
            <Text style={styles.roomName}>{room.roomType}</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    room.status === 'Available' ? '#28a745' : '#dc3545',
                },
              ]}
            >
              <Text style={styles.statusText}>
                {room.status === 'Available' ? 'Trống' : 'Tạm đóng'}
              </Text>
            </View>
          </View>
          <Text style={styles.roomPrice}>
            {room.price ? room.price.toLocaleString('vi-VN') : '0'} đ / đêm
          </Text>

          <Text style={styles.sectionTitle}>Dịch vụ thêm</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#FF8C00" />
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={services}
              keyExtractor={item => item.serviceId.toString()}
              renderItem={({ item }) => (
                <View style={styles.serviceCard}>
                  <Text style={styles.serviceName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.servicePrice}>
                    {item.price ? item.price.toLocaleString('vi-VN') : '0'} đ
                  </Text>
                  <View style={styles.quantityController}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => handleUpdateService(item.serviceId, -1)}
                    >
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>
                      {getServiceQuantity(item.serviceId)}
                    </Text>
                    <TouchableOpacity
                      style={[styles.qtyBtn, styles.qtyBtnAdd]}
                      onPress={() => handleUpdateService(item.serviceId, 1)}
                    >
                      <Text style={styles.qtyBtnTextAdd}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}

          <Text style={styles.sectionTitle}>Thời gian lưu trú</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateInputWrapper}
              onPress={() => setShowCheckInPicker(true)}
            >
              <Text style={styles.filterLabel}>Ngày nhận</Text>
              <View style={styles.input}>
                <Text style={{ color: '#333' }}>{formatDate(checkInDate)}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateInputWrapper}
              onPress={() => setShowCheckOutPicker(true)}
            >
              <Text style={styles.filterLabel}>Ngày trả</Text>
              <View style={styles.input}>
                <Text style={{ color: '#333' }}>
                  {formatDate(checkOutDate)}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {showCheckInPicker && (
            <DateTimePicker
              value={checkInDate}
              mode="date"
              minimumDate={new Date()}
              onChange={onChangeCheckIn}
            />
          )}
          {showCheckOutPicker && (
            <DateTimePicker
              value={checkOutDate}
              mode="date"
              minimumDate={checkInDate}
              onChange={onChangeCheckOut}
            />
          )}

          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          <TouchableOpacity
            style={[
              styles.paymentCard,
              paymentMethod === 'Cash' && styles.paymentCardActive,
            ]}
            onPress={() => setPaymentMethod('Cash')}
            activeOpacity={0.8}
          >
            <Text style={styles.paymentIcon}>💵</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentTitle}>Thanh toán khi nhận phòng</Text>
              <Text style={styles.paymentDesc}>
                Tiền mặt hoặc Quẹt thẻ tại quầy
              </Text>
            </View>
            <View
              style={[
                styles.radioCircle,
                paymentMethod === 'Cash' && styles.radioCircleActive,
              ]}
            >
              {paymentMethod === 'Cash' && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentCard,
              paymentMethod === 'Bank' && styles.paymentCardActive,
            ]}
            onPress={() => setPaymentMethod('Bank')}
            activeOpacity={0.8}
          >
            <Text style={styles.paymentIcon}>🏦</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentTitle}>Thanh toán ngay</Text>
              <Text style={styles.paymentDesc}>
                Chuyển khoản ngân hàng / Ví điện tử
              </Text>
            </View>
            <View
              style={[
                styles.radioCircle,
                paymentMethod === 'Bank' && styles.radioCircleActive,
              ]}
            >
              {paymentMethod === 'Bank' && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.totalTextLabel}>Tổng ({nights} đêm):</Text>
          <Text style={styles.totalTextValue}>
            {totalPrice.toLocaleString('vi-VN')} đ
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.bookBtn,
            (room.status !== 'Available' || isBooking) &&
              styles.bookBtnDisabled,
          ]}
          disabled={room.status !== 'Available' || isBooking}
          onPress={handleBookNow}
        >
          {isBooking ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.bookBtnText}>Đặt phòng ngay</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  coverImage: { width: '100%', height: 280 },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  contentContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 20,
    paddingBottom: 120,
  },
  roomHeaderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomName: { fontSize: 26, fontWeight: '900', color: '#1a1a1a', flex: 1 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  roomPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF8C00',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    marginTop: 10,
  },

  serviceCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    width: 160,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 14,
    color: '#FF8C00',
    fontWeight: '600',
    marginBottom: 12,
  },
  quantityController: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnAdd: { backgroundColor: '#FF8C00' },
  qtyBtnText: { fontSize: 18, color: '#555', fontWeight: 'bold' },
  qtyBtnTextAdd: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
  qtyValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },

  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateInputWrapper: { width: '48%' },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },

  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  paymentCardActive: { borderColor: '#FF8C00', backgroundColor: '#FFF7E6' },
  paymentIcon: { fontSize: 28, marginRight: 12 },
  paymentTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  paymentDesc: { fontSize: 12, color: '#666' },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: { borderColor: '#FF8C00' },
  radioDot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#FF8C00',
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  totalTextLabel: { fontSize: 13, color: '#666' },
  totalTextValue: { fontSize: 16, fontWeight: 'bold', color: '#FF8C00' },
  bookBtn: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  bookBtnDisabled: { backgroundColor: '#ccc' },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
