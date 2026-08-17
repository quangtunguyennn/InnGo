import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Platform,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Tạo Component Animated cho Ionicons để đổi màu và scale icon mượt mà
const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);

const TabItem = ({ tab, isActive, onTabPress }) => {
  const activeAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  const [measuredTextWidth, setMeasuredTextWidth] = useState(
    Math.max(28, tab.name.length * 7),
  );
  
  const handleTextLayout = e => {
    const w = Math.ceil(e.nativeEvent.layout.width);
    if (w > 0 && Math.abs(w - measuredTextWidth) > 0.5) {
      setMeasuredTextWidth(w);
    }
  };

  useEffect(() => {
    Animated.spring(activeAnim, {
      toValue: isActive ? 1 : 0,
      damping: 18,
      stiffness: 160,
      mass: 0.6,
      useNativeDriver: false,
    }).start();
  }, [isActive]);

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.92,
      useNativeDriver: false,
      damping: 15,
      stiffness: 200,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: false,
      damping: 15,
      stiffness: 200,
    }).start();
  };

  const backgroundColor = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', '#FF8C00'],
    extrapolate: 'clamp',
  });

  const textWidth = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, measuredTextWidth],
    extrapolate: 'clamp',
  });

  const textMarginLeft = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 8],
    extrapolate: 'clamp',
  });

  const textOpacity = activeAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const iconColor = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#888888', '#FFFFFF'],
    extrapolate: 'clamp',
  });

  const iconScale = activeAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.18, 1],
    extrapolate: 'clamp',
  });

  const badgeScale = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0], // Lưu ý logic cũ của bạn: 0 là active, 1 là inactive
    extrapolate: 'clamp',
  });

  const tabFlex = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.2],
    extrapolate: 'clamp',
  });

  const tabSpacing = 3;
  const iconName = isActive ? tab.activeIcon || tab.icon : tab.icon;
  const badgeCount = Number(tab.badgeCount) || 0;

  return (
    <Animated.View style={{ flex: tabFlex, marginHorizontal: tabSpacing }}>
      <TouchableOpacity
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        onPress={onTabPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Animated.View
          style={[
            styles.tabItem,
            {
              backgroundColor,
              transform: [{ scale: pressAnim }],
            },
          ]}
        >
          {/* VÙNG ICON & BADGE */}
          <View style={styles.iconContainer}>
            <AnimatedIcon
              name={iconName}
              size={22}
              style={{
                color: iconColor,
                transform: [{ scale: iconScale }],
              }}
            />

            {badgeCount > 0 && (
              <Animated.View
                style={[
                  styles.badge,
                  {
                    transform: [{ scale: badgeScale }],
                    opacity: badgeScale,
                  },
                ]}
              >
                <Text style={styles.badgeText}>
                  {badgeCount > 99 ? '99+' : badgeCount}
                </Text>
              </Animated.View>
            )}
          </View>

          {/* VÙNG CHỮ */}
          <Animated.View
            style={{
              width: textWidth,
              opacity: textOpacity,
              marginLeft: textMarginLeft,
              overflow: 'hidden',
            }}
          >
            <Text numberOfLines={1} style={styles.tabText}>
              {tab.name}
            </Text>
          </Animated.View>

          <Text
            style={[styles.tabText, styles.hiddenMeasureText]}
            onLayout={handleTextLayout}
          >
            {tab.name}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ------------------------------------------------------------------
// BẢN SỬA ĐỂ KẾT NỐI VỚI REACT NAVIGATION
// Nhận state, descriptors, navigation thay vì tabs, activeIndex
// ------------------------------------------------------------------
const CustomBottomNavigation = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          
          // Lấy tên tab
          const label = options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

          const isFocused = state.index === index;

          // Xử lý sự kiện chuyển trang của React Navigation
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Gán Icon của Ionicons tương ứng với các màn hình của bạn
          let icon = 'home-outline';
          let activeIcon = 'home';
          
          if (route.name === 'Home') {
            icon = 'home-outline'; activeIcon = 'home';
          } else if (route.name === 'Bookings') {
            icon = 'calendar-outline'; activeIcon = 'calendar';
          } else if (route.name === 'Favorites') {
            icon = 'heart-outline'; activeIcon = 'heart';
          } else if (route.name === 'Profile') {
            icon = 'person-outline'; activeIcon = 'person';
          }else if (route.name === 'Blogs') {
            icon = 'book-outline'; activeIcon = 'book';
          }

          // Format lại data để truyền vào TabItem giống với code cũ của bạn
          const tabData = {
            id: route.key,
            name: label,
            icon: icon,
            activeIcon: activeIcon,
            badgeCount: options.tabBarBadge || 0 // Tích hợp huy hiệu từ React Navigation nếu có
          };

          return (
            <TabItem
              key={route.key}
              tab={tabData}
              isActive={isFocused}
              onTabPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 20,
    right: 20,
    zIndex: 1000,
    backgroundColor: '#1E1E1E',
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  navBar: {
    flexDirection: 'row',
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
  },
  iconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
  },
  tabText: {
    color: '#FFFFFF',
    fontSize: 14,
    letterSpacing: 0.2,
    // Nếu máy ảo chưa cài font Syne thì tạm thời bỏ dòng này hoặc đổi thành font mặc định
    // fontFamily: 'Syne', 
    fontWeight: '800'
  },
  hiddenMeasureText: {
    position: 'absolute',
    opacity: 0,
    left: 0,
    top: 0,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    backgroundColor: '#FF3B30',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#1E1E1E',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: 'bold',
  },
});

export default CustomBottomNavigation;