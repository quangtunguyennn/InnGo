import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Platform
} from 'react-native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

const baseURL = 'http://localhost:28538/'; 


const RoomCard = ({ item, checkInDate, checkOutDate, navigation }) => {
  const [rating, setRating] = useState(0);

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const response = await axios.get(`${baseURL}api/room/avgRating`, {
          params: { roomId: item.roomId }
        });
        setRating(response.data || 0);
      } catch (error) {
        console.error('Lỗi lấy rating phòng:', error);
      }
    };
    fetchRating();
  }, [item.roomId]);

  return (
    <TouchableOpacity 
      style={styles.roomCard}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('RoomDetail', { 
        room: item, 
        searchCheckIn: checkInDate.toISOString(), 
        searchCheckOut: checkOutDate.toISOString() 
      })}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.roomImage} />
      <View style={styles.roomInfo}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text style={styles.roomName}>{item.roomType}</Text>
            <Text style={styles.ratingText}>⭐ {rating > 0 ? rating.toFixed(1) : 'Chưa có'}</Text>
        </View>
        <Text style={styles.roomDetails}>👥 Sức chứa: {item.capacity} Người lớn</Text>
        <View style={styles.roomBottom}>
          <Text style={styles.roomPrice}>
            {item.price ? item.price.toLocaleString('vi-VN') : '0'} đ <Text style={styles.perNight}>/đêm</Text>
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function BranchDetail({ route, navigation }) {
  const { branch } = route.params;
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [capacity, setCapacity] = useState('1'); 
  const [checkInDate, setCheckInDate] = useState(new Date());
  
  const defaultCheckOut = new Date();
  defaultCheckOut.setDate(defaultCheckOut.getDate() + 1);
  const [checkOutDate, setCheckOutDate] = useState(defaultCheckOut);

  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);

  useEffect(() => {
    const fetchInitialRooms = async () => {
      try {
        const response = await axios.get(`${baseURL}api/room/getRoomsByBranchId`, {
          params: { branchId: branch.branchId },
        });
        setFilteredRooms(response.data);
      } catch (error) {
        console.error('Lỗi lấy danh sách phòng ban đầu:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialRooms();
  }, [branch.branchId]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}api/room/search`, {
        params: {
          branchId: branch.branchId,
          CheckInDate: checkInDate.toISOString(),
          CheckOutDate: checkOutDate.toISOString(),
          minPrice: minPrice ? parseInt(minPrice) : null,
          maxPrice: maxPrice ? parseInt(maxPrice) : null,
          Capacity: capacity ? parseInt(capacity) : 1
        },
      });
      setFilteredRooms(response.data);
    } catch (error) {
      console.error('Lỗi tìm kiếm phòng:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCapacity = (delta) => {
    setCapacity(prev => {
      const currentVal = parseInt(prev) || 1;
      const newVal = currentVal + delta;
      return newVal < 1 ? '1' : newVal.toString();
    });
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

  const formatDate = (date) => date.toLocaleDateString('vi-VN');

  const renderListHeader = () => (
    <View>
      <Image source={{ uri: branch.imageUrl }} style={styles.coverImage} />
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Trở về</Text>
      </TouchableOpacity>

      <View style={styles.branchInfoContainer}>
        <View style={styles.cityBadge}>
          <Text style={styles.cityBadgeText}>{branch.city}</Text>
        </View>
        <Text style={styles.branchName}>{branch.name}</Text>
        <Text style={styles.branchAddress}>📍 {branch.address}</Text>
        <Text style={styles.branchDesc}>{branch.description}</Text>
      </View>

      <View style={styles.filterContainer}>
        <Text style={styles.sectionTitle}>Tìm phòng phù hợp</Text>

        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.dateInputWrapper} onPress={() => setShowCheckInPicker(true)}>
            <Text style={styles.filterLabel}>Ngày nhận</Text>
            <View style={styles.inputBox}><Text>{formatDate(checkInDate)}</Text></View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dateInputWrapper} onPress={() => setShowCheckOutPicker(true)}>
            <Text style={styles.filterLabel}>Ngày trả</Text>
            <View style={styles.inputBox}><Text>{formatDate(checkOutDate)}</Text></View>
          </TouchableOpacity>
        </View>

        <View style={styles.dateRow}>
          <View style={styles.dateInputWrapper}>
            <Text style={styles.filterLabel}>Giá tối thiểu</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: 500000"
              keyboardType="numeric"
              value={minPrice}
              onChangeText={setMinPrice}
            />
          </View>
          <View style={styles.dateInputWrapper}>
            <Text style={styles.filterLabel}>Giá tối đa</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: 2000000"
              keyboardType="numeric"
              value={maxPrice}
              onChangeText={setMaxPrice}
            />
          </View>
        </View>

        <View style={styles.capacityRow}>
          <Text style={styles.filterLabel}>Số người (Capacity):</Text>
          <View style={styles.quantityController}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => handleUpdateCapacity(-1)}>
              <Text style={styles.qtyBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{capacity}</Text>
            <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={() => handleUpdateCapacity(1)}>
              <Text style={styles.qtyBtnTextAdd}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Tìm kiếm phòng</Text>
        </TouchableOpacity>
      </View>

      {showCheckInPicker && (
        <DateTimePicker value={checkInDate} mode="date" minimumDate={new Date()} onChange={onChangeCheckIn} />
      )}
      {showCheckOutPicker && (
        <DateTimePicker value={checkOutDate} mode="date" minimumDate={checkInDate} onChange={onChangeCheckOut} />
      )}

      <Text style={[styles.sectionTitle, { paddingHorizontal: 20, marginBottom: 10 }]}>
        Danh sách phòng ({filteredRooms.length})
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading && filteredRooms.length === 0 ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#FF8C00" /></View>
      ) : (
        <FlatList
          data={filteredRooms}
          keyExtractor={(item, index) => item.roomId ? item.roomId.toString() : index.toString()}
          ListHeaderComponent={renderListHeader}
          renderItem={({ item }) => (
            <RoomCard 
              item={item} 
              checkInDate={checkInDate} 
              checkOutDate={checkOutDate} 
              navigation={navigation} 
            />
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>Không có phòng nào phù hợp.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  coverImage: { width: '100%', height: 250 },
  backButton: { position: 'absolute', top: 20, left: 20, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  backButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  branchInfoContainer: { backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24, elevation: 5 },
  cityBadge: { alignSelf: 'flex-start', backgroundColor: '#FF8C00', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 10 },
  cityBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  branchName: { fontSize: 24, fontWeight: '900', color: '#1a1a1a', marginBottom: 8 },
  branchAddress: { fontSize: 14, color: '#555', marginBottom: 4 },
  branchDesc: { fontSize: 14, color: '#666', lineHeight: 22 },
  filterContainer: { backgroundColor: '#fff', marginTop: 10, padding: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 12 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  dateInputWrapper: { width: '48%' },
  filterLabel: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
  input: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e9ecef', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#333' },
  inputBox: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e9ecef', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 14 },
  capacityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 4 },
  quantityController: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  qtyBtnAdd: { backgroundColor: '#FF8C00' },
  qtyBtnText: { fontSize: 18, color: '#555', fontWeight: 'bold' },
  qtyBtnTextAdd: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
  qtyValue: { fontSize: 16, fontWeight: 'bold', color: '#333', marginHorizontal: 16 },
  searchButton: { backgroundColor: '#FF8C00', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  searchButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  roomCard: { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 16, borderRadius: 16, overflow: 'hidden', elevation: 3 },
  roomImage: { width: '100%', height: 160 },
  roomInfo: { padding: 16 },
  roomName: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 6 },
  ratingText: { fontSize: 14, fontWeight: 'bold', color: '#FF8C00' },
  roomDetails: { fontSize: 14, color: '#666', marginBottom: 12 },
  roomBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roomPrice: { fontSize: 18, fontWeight: 'bold', color: '#FF8C00' },
  perNight: { fontSize: 12, color: '#999', fontWeight: 'normal' },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#999', fontStyle: 'italic' },
});