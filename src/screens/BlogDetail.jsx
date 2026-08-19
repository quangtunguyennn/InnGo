import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
 
} from 'react-native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function BlogDetail({ route, navigation }) {
  const { blogId } = route.params || {};
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  const baseURL = 'http://localhost:28538';

  useEffect(() => {
    if (blogId) fetchBlogDetail();
    else setLoading(false);
  }, [blogId]);

  const fetchBlogDetail = async () => {
    try {
      const response = await axios.get(`${baseURL}/api/blog/getById/${blogId}`);
      setBlog(response.data);
    } catch (error) {
      console.error('Lỗi khi tải chi tiết blog:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#027A48" />
      </View>
    );
  }

  if (!blog) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>← Quay lại</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>Không tìm thấy bài viết.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
    
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        
        <Image
          source={{
            uri: blog.thumbnailUrl || 'https://via.placeholder.com/600x400',
          }}
          style={styles.heroImage}
        />

        <View style={styles.contentWrapper}>
          <Text style={styles.title}>{blog.title}</Text>
          <View style={styles.divider} />
          {blog.summary && <Text style={styles.summary}>{blog.summary}</Text>}
          <Text style={styles.bodyText}>{blog.content}</Text>
        </View>

       
        <View style={styles.ctaContainer}>
          <View style={styles.ctaBadge}>
            <Text style={styles.ctaBadgeText}>Ưu đãi độc quyền</Text>
          </View>
          <Text style={styles.ctaTitle}>
            Bạn đã sẵn sàng xách balo lên và đi?
          </Text>
          <Text style={styles.ctaDesc}>
            Đặt khách sạn lưu trú với InnGo cho địa điểm bạn yêu thích ngay bây
            giờ để nhận mức giá tốt nhất!
          </Text>

          <TouchableOpacity
            style={styles.ctaButton}
            activeOpacity={0.8}
            onPress={() => {
           
              navigation.navigate('MainTabs', {
                screen: 'Home',
                params: { destination: blog.slug },
              });
            }}
          >
            <Text style={styles.ctaButtonText}>Đặt phòng ngay</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  
  topBar: {
    height: 50,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
    backgroundColor: '#FFF',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingRight: 12,
  },
  backIcon: {
    fontSize: 20,
    fontWeight: '600',
    color: '#101828',
    marginRight: 6,
  },
  backText: { fontSize: 16, fontWeight: '600', color: '#101828' },

  scrollContent: { paddingBottom: 40 },
  heroImage: { width: '100%', height: 250, backgroundColor: '#E4E7EC' },
  contentWrapper: { padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#101828',
    lineHeight: 32,
    marginBottom: 16,
  },
  divider: {
    height: 2,
    backgroundColor: '#EAECF0',
    width: 50,
    marginBottom: 16,
  },
  summary: {
    fontSize: 15,
    fontWeight: '600',
    color: '#344054',
    fontStyle: 'italic',
    marginBottom: 20,
    lineHeight: 22,
  },
  bodyText: {
    fontSize: 16,
    color: '#475467',
    lineHeight: 26,
    marginBottom: 20,
  },
  errorText: { fontSize: 16, color: '#D92D20', fontWeight: 'bold' },

  ctaContainer: {
    backgroundColor: '#F0F9FF',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#B9E6FE',
    alignItems: 'center',
  },
  ctaBadge: {
    backgroundColor: '#027A48',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  ctaBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#101828',
    textAlign: 'center',
    marginBottom: 10,
  },
  ctaDesc: {
    fontSize: 14,
    color: '#475467',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  ctaButton: {
    backgroundColor: '#101828',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  ctaButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
