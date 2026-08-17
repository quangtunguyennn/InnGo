import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, 
  TouchableOpacity, ActivityIndicator,  Alert 
} from 'react-native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native'; // Thêm dòng này

export default function Blogs() { // Bỏ { navigation } ở đây
  const navigation = useNavigation(); // Khai báo useNavigation ở đây
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const baseURL = 'http://localhost:28538'; 

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await axios.get(`${baseURL}/api/blog/all`);
      setBlogs(response.data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách blog:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePressBlog = (item) => {
    // Tự động bắt đúng ID
    const id = item.blogId || item.BlogId || item.id;

    if (!id) {
      // Hiển thị Alert thẳng lên điện thoại để bạn dễ nhận biết
      Alert.alert(
        "Lỗi dữ liệu", 
        "Không lấy được ID của bài viết này. Hãy kiểm tra lại Backend xem đã trả về blogId chưa."
      );
      console.log('Dữ liệu bị lỗi:', item);
      return; // Dừng lại, không chuyển trang
    }

    // Nếu có ID, thực hiện chuyển trang
    navigation.navigate('BlogDetail', { blogId: id });
  };

  const renderBlogItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8}
      onPress={() => handlePressBlog(item)}
    >
      <Image 
        source={{ uri: item.thumbnailUrl || 'https://via.placeholder.com/400x200' }} 
        style={styles.thumbnail} 
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.summary} numberOfLines={3}>{item.summary}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cẩm nang du lịch</Text>
        <Text style={styles.headerSubtitle}>Khám phá những điểm đến tuyệt vời cùng InnGo</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#027A48" />
        </View>
      ) : (
        <FlatList
          data={blogs}
          keyExtractor={(item, index) => {
            const id = item.blogId || item.BlogId || item.id;
            return id ? id.toString() : index.toString();
          }}
          renderItem={renderBlogItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: '#FFF', paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#101828', marginBottom: 4 },
  headerSubtitle: { fontSize: 15, color: '#667085' },
  listContainer: { padding: 16, paddingBottom: 30 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden'
  },
  thumbnail: { width: '100%', height: 180 },
  cardContent: { padding: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#101828', marginBottom: 8, lineHeight: 24 },
  summary: { fontSize: 14, color: '#475467', lineHeight: 20 }
});