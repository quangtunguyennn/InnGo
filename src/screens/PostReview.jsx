import React, { useState } from 'react';
import { 
  View, Text, StyleSheet,  TouchableOpacity, 
  TextInput, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PostReview({ route, navigation }) {
  // Lấy dữ liệu được truyền từ màn hình Bookings
  const { bookingId, roomId } = route.params || {};
  const baseURL = 'http://localhost:28538/';

  const [rating, setRating] = useState(0); // 0 là chưa chọn
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Mảng dùng để render 5 ngôi sao
  const stars = [1, 2, 3, 4, 5];

  const handleSubmit = async () => {
    if (!bookingId || !roomId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin chuyến đi. Vui lòng quay lại và thử lại.');
      return;
    }

    if (rating === 0) {
      Alert.alert('Chưa chấm điểm', 'Vui lòng chọn số sao đánh giá cho phòng này.');
      return;
    }

    if (comment.trim().length < 5) {
      Alert.alert('Nội dung quá ngắn', 'Vui lòng nhập ít nhất 5 ký tự chia sẻ trải nghiệm của bạn.');
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Đã bổ sung bookingId cho đúng với DTO ở Backend
      const payload = {
        bookingId: bookingId,
        roomId: roomId,
        rating: rating,
        comment: comment.trim()
      };

      await axios.post(`${baseURL}api/review/post`, payload, config);
      
      Alert.alert(
        'Cảm ơn bạn! 🎉', 
        'Đánh giá của bạn đã được đăng thành công, giúp ích rất nhiều cho cộng đồng.',
        [{ text: 'Về trang trước', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể đăng đánh giá lúc này. Vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingText = () => {
    switch(rating) {
      case 1: return 'Rất tệ 😞';
      case 2: return 'Tệ 😕';
      case 3: return 'Tạm được 😐';
      case 4: return 'Tốt 🙂';
      case 5: return 'Tuyệt vời! 😍';
      default: return 'Hãy chọn đánh giá của bạn';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.headerInfo}>
            <Text style={styles.title}>Đánh giá trải nghiệm</Text>
            <Text style={styles.subtitle}>
              Chuyến đi mã số <Text style={styles.boldText}>#{bookingId}</Text>
            </Text>
          </View>

          {/* KHU VỰC CHỌN SAO */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Mức độ hài lòng của bạn</Text>
            
            <View style={styles.starsContainer}>
              {stars.map((star) => (
                <TouchableOpacity 
                  key={star} 
                  activeOpacity={0.7}
                  onPress={() => setRating(star)}
                  style={styles.starButton}
                >
                  <Text style={[styles.starIcon, rating >= star ? styles.starSelected : styles.starUnselected]}>
                    {rating >= star ? '★' : '☆'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.ratingText, rating > 0 && styles.ratingTextActive]}>
              {getRatingText()}
            </Text>
          </View>

          {/* KHU VỰC NHẬP BÌNH LUẬN */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Chia sẻ chi tiết</Text>
            <Text style={styles.inputHint}>
              Hãy chia sẻ những điều bạn thích hoặc chưa thích về phòng, dịch vụ, tiện nghi...
            </Text>
            
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={6}
              placeholder="Ví dụ: Phòng rất sạch sẽ, view đẹp, nhân viên nhiệt tình..."
              placeholderTextColor="#98A2B3"
              value={comment}
              onChangeText={setComment}
              textAlignVertical="top"
            />
          </View>

        </ScrollView>

        {/* NÚT GỬI ĐÁNH GIÁ */}
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>Gửi đánh giá</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F7F9FC' 
  },
  scrollContent: { 
    padding: 20, 
    paddingBottom: 40 
  },
  headerInfo: {
    marginBottom: 24,
    alignItems: 'center',
    marginTop: 10
  },
  title: { 
    fontSize: 26, 
    fontWeight: '800', 
    color: '#101828', 
    marginBottom: 8 
  },
  subtitle: { 
    fontSize: 15, 
    color: '#475467' 
  },
  boldText: {
    fontWeight: '700',
    color: '#101828'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EAECF0',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
    marginBottom: 16,
    textAlign: 'center'
  },
  starsContainer: {
    flexDirection: 'row',
    justify: 'center',
    marginBottom: 12,
    gap: 8
  },
  starButton: {
    padding: 4,
  },
  starIcon: {
    fontSize: 48,
    lineHeight: 56,
  },
  starSelected: {
    color: '#FFB400',
  },
  starUnselected: {
    color: '#D0D5DD',
  },
  ratingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#667085',
    fontWeight: '500',
    fontStyle: 'italic'
  },
  ratingTextActive: {
    color: '#FF6B00',
    fontWeight: '700',
    fontStyle: 'normal'
  },
  inputHint: {
    fontSize: 14,
    color: '#667085',
    marginBottom: 12,
    lineHeight: 20
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#101828',
    minHeight: 140,
  },
  bottomBar: { 
    padding: 16, 
    backgroundColor: '#FFF', 
    borderTopWidth: 1, 
    borderTopColor: '#F2F4F7',
    paddingBottom: Platform.OS === 'ios' ? 30 : 16
  },
  submitBtn: { 
    backgroundColor: '#027A48', 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  submitBtnText: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: '700' 
  }
});