import React, { useState, useLayoutEffect, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, StatusBar, ScrollView } from 'react-native';
import { STUDENTS } from '../data/students';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons'; // For the Lock Icon

// ====================================================
// ✅ YOUR GOOGLE SCRIPT URL
// ====================================================
const API_URL = "https://script.google.com/macros/s/AKfycbyWSWwBHqwR_Mjck8rSh3l36XnLzsOzrbZo4dPAPSXjyXQfKOzqI9nhI_3CgT6xFQ_1Uw/exec";

export default function AttendanceScreen({ route, navigation }) {
  const { teacherName, className, section } = route.params;
  const classKey = `${className}-${section}`;
  const studentList = STUDENTS[classKey] || [];

  // Hide Default Header
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // STATE
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false); // ✅ NEW: Track Lock Status

  // GENERATE TODAY'S UNIQUE KEY (e.g., "attendance-Grade10-A-06/01/2026")
  // This ensures the lock resets automatically tomorrow
  const getDailyKey = () => {
    const now = new Date();
    const dateStr = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
    return `attendance-${className}-${section}-${dateStr}`;
  };

  // ✅ 1. LOAD SAVED STATE ON STARTUP
  useEffect(() => {
    loadDailyState();
  }, []);

  const loadDailyState = async () => {
    try {
      const key = getDailyKey();
      const savedData = await AsyncStorage.getItem(key);
      
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setAttendance(parsed.attendance || {});
        setIsLocked(parsed.locked || false); // Restore lock status
      }
      
      // Also try to sync any offline queue
      syncOfflineData();
    } catch (error) {
      console.log("Error loading state:", error);
    }
  };

  const syncOfflineData = async () => {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) return;

    try {
      const storedQueue = await AsyncStorage.getItem('attendanceQueue');
      if (storedQueue) {
        const queue = JSON.parse(storedQueue);
        if (queue.length === 0) return;

        for (const item of queue) {
          await fetch(API_URL, { method: 'POST', body: JSON.stringify(item) });
        }
        await AsyncStorage.removeItem('attendanceQueue');
        Alert.alert("Sync Complete", "Offline records uploaded.");
      }
    } catch (error) { console.log("Sync failed", error); }
  };

  // ✅ MARK FUNCTION (Disabled if Locked)
  const markAttendance = (studentId, status) => {
    if (isLocked) {
      Alert.alert("Locked", "Attendance for today is locked and cannot be changed.");
      return;
    }
    
    const currentHour = new Date().getHours();
    if (currentHour >= 12) {
      Alert.alert("Time Limit", "Attendance marking is closed after 12:00 PM.");
      return;
    }

    setAttendance(prev => {
      const newState = { ...prev, [studentId]: status };
      // Optional: Auto-save state as they tap (so data isn't lost on crash)
      saveToLocal(newState, false); 
      return newState;
    });
  };

  // ✅ SAVE LOCAL HELPER
  const saveToLocal = async (currentAttendance, lockedStatus) => {
    try {
      const key = getDailyKey();
      const dataToSave = {
        attendance: currentAttendance,
        locked: lockedStatus
      };
      await AsyncStorage.setItem(key, JSON.stringify(dataToSave));
    } catch (e) { console.log("Save failed", e); }
  };

  // ✅ SUBMIT / LOCK HANDLER
  const handleSubmission = async (shouldLock) => {
    const markedCount = Object.keys(attendance).length;
    if (markedCount < studentList.length) {
      Alert.alert("Incomplete", "Please mark P, A, or L for all students.");
      return;
    }

    if (shouldLock) {
      // Confirmation Prompt for Lock
      Alert.alert(
        "Confirm Lock",
        "Are you sure? Once locked, you cannot change attendance for today.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "LOCK & SUBMIT", onPress: () => processUpload(true) }
        ]
      );
    } else {
      // Just Submit
      processUpload(false);
    }
  };

  const processUpload = async (lockAction) => {
    setLoading(true);

    // 1. Prepare Data
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateStr = `${day}/${month}/${year}`;
    const timeStr = now.toLocaleTimeString();

    const payload = {
      className: className,
      section: section,
      teacher: teacherName,
      date: dateStr,
      time: timeStr,
      students: studentList.map(s => ({
        rollNo: s.rollNo,
        name: s.name,
        status: attendance[s.id]
      }))
    };

    // 2. Save Local State (Persist "Locked" status if true)
    await saveToLocal(attendance, lockAction);
    if (lockAction) setIsLocked(true);

    // 3. Upload or Queue
    const netInfo = await NetInfo.fetch();
    
    if (netInfo.isConnected) {
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        const result = await response.text();

        if (result.includes("Success")) {
          Alert.alert("Success", lockAction ? "Attendance Locked & Submitted!" : "Attendance Saved & Submitted!");
          if (lockAction) navigation.replace('Login'); // Go back if locked
        } else {
          Alert.alert("Error", "Server error. Data saved locally.");
        }
      } catch (error) {
        saveOffline(payload);
      }
    } else {
      saveOffline(payload);
    }

    setLoading(false);
  };

  const saveOffline = async (payload) => {
    try {
      const existingQueue = await AsyncStorage.getItem('attendanceQueue');
      let queue = existingQueue ? JSON.parse(existingQueue) : [];
      queue.push(payload);
      await AsyncStorage.setItem('attendanceQueue', JSON.stringify(queue));
      Alert.alert("Saved Offline", "No Internet. Saved locally.");
    } catch (e) { Alert.alert("Error", "Could not save."); }
  };

  const renderStudent = ({ item }) => {
    const status = attendance[item.id]; 
    // If locked, buttons look 'disabled' (opacity reduced)
    const btnStyle = isLocked ? { opacity: 0.5 } : {};

    return (
      <View style={styles.studentRow}>
        <View style={styles.info}>
          <Text style={styles.rollNo}>{item.rollNo}</Text>
          <Text style={styles.name}>{item.name}</Text>
        </View>

        <View style={[styles.buttons, btnStyle]} pointerEvents={isLocked ? "none" : "auto"}>
          <TouchableOpacity style={[styles.btn, status === 'P' ? styles.btnGreen : styles.btnOutline]} onPress={() => markAttendance(item.id, 'P')}>
            <Text style={status === 'P' ? styles.textWhite : styles.textGreen}>P</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, status === 'A' ? styles.btnRed : styles.btnOutline]} onPress={() => markAttendance(item.id, 'A')}>
            <Text style={status === 'A' ? styles.textWhite : styles.textRed}>A</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, status === 'L' ? styles.btnYellow : styles.btnOutline]} onPress={() => markAttendance(item.id, 'L')}>
            <Text style={status === 'L' ? styles.textWhite : styles.textYellow}>L</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Formatted Date for Header
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'short', day: '2-digit' };
  const formattedDate = new Date().toLocaleDateString('en-US', dateOptions);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1a237e" barStyle="light-content" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance Record</Text>
        <View style={styles.subHeaderRow}>
          <Text style={styles.teacherName}>{teacherName}</Text>
          <View style={styles.gradeBadge}>
            <Text style={styles.gradeText}>{className}-{section}</Text>
          </View>
        </View>
        <Text style={styles.headerDate}>{formattedDate}</Text>
        
        {/* LOCK INDICATOR IN HEADER */}
        {isLocked && (
          <View style={styles.lockedBadge}>
            <Ionicons name="lock-closed" size={14} color="white" />
            <Text style={styles.lockedText}> LOCKED</Text>
          </View>
        )}
      </View>

      {/* TABLE HEADER */}
      <View style={styles.tableHeader}>
        <Text style={[styles.columnText, { flex: 0.8 }]}>Roll No</Text>
        <Text style={[styles.columnText, { flex: 2 }]}>Student Name</Text>
        <Text style={[styles.columnText, { flex: 1.5, textAlign: 'center' }]}>Status</Text>
      </View>

      {/* LIST */}
      <FlatList
        data={studentList}
        keyExtractor={item => item.id}
        renderItem={renderStudent}
        contentContainerStyle={{ padding: 15, paddingBottom: 120 }} // Extra space for 2 buttons
      />

      {/* ACTION BUTTONS */}
      {!isLocked ? (
        <View style={styles.actionContainer}>
          {/* SUBMIT BUTTON */}
          <TouchableOpacity 
            style={[styles.actionBtn, styles.submitBtn]} 
            onPress={() => handleSubmission(false)}
            disabled={loading}
          >
            <Text style={styles.submitText}>SAVE / SUBMIT</Text>
          </TouchableOpacity>

          {/* LOCK BUTTON */}
          <TouchableOpacity 
            style={[styles.actionBtn, styles.lockBtn]} 
            onPress={() => handleSubmission(true)}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Ionicons name="lock-closed-outline" size={20} color="white" />}
            <Text style={styles.submitText}> LOCK</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.lockedFooter}>
          <Ionicons name="lock-closed" size={24} color="#666" />
          <Text style={styles.lockedFooterText}>Attendance is Locked for Today</Text>
        </View>
      )}
    </View>
  );
}

// =======================
// STYLING
// =======================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  
  header: { 
    backgroundColor: '#1a237e', 
    paddingHorizontal: 20, paddingTop: 35, paddingBottom: 15,
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
    elevation: 4
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#e8eaf6', marginBottom: 5 },
  subHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5, width: '100%' },
  teacherName: { fontSize: 20, color: '#ffcc80', fontWeight: 'bold' },
  gradeBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 },
  gradeText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  headerDate: { fontSize: 13, color: '#c5cae9', fontWeight: '500' },

  lockedBadge: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#e74c3c', 
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, 
    borderRadius: 4, marginTop: 5 
  },
  lockedText: { color: 'white', fontSize: 12, fontWeight: 'bold' },

  tableHeader: { flexDirection: 'row', backgroundColor: '#dfe6e9', paddingVertical: 12, paddingHorizontal: 15, marginTop: 15, marginHorizontal: 15, borderRadius: 10, alignItems: 'center' },
  columnText: { fontWeight: 'bold', color: '#636e72', fontSize: 14 },

  studentRow: { backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, marginBottom: 10, borderRadius: 12, elevation: 2 },
  info: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  rollNo: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#f1f2f6', textAlign: 'center', textAlignVertical: 'center', fontWeight: 'bold', color: '#2f3542', marginRight: 10, fontSize: 14 },
  name: { fontSize: 16, color: '#2f3542', fontWeight: '500', flex: 1, flexWrap: 'wrap' },
  
  buttons: { flexDirection: 'row', gap: 8 },
  btn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
  btnOutline: { borderColor: '#ced6e0', backgroundColor: 'transparent' },
  btnGreen: { backgroundColor: '#03a045ff', borderColor: '#03a045ff' },
  btnRed: { backgroundColor: '#c90112ff', borderColor: '#c90112ff' },
  btnYellow: { backgroundColor: '#ffba3bff', borderColor: '#ffba3bff' },
  textWhite: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  textGreen: { color: '#2ed573', fontWeight: 'bold', fontSize: 16 },
  textRed: { color: '#ff4757', fontWeight: 'bold', fontSize: 16 },
  textYellow: { color: '#ffa502', fontWeight: 'bold', fontSize: 16 },

  // NEW ACTION BUTTONS
  actionContainer: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
    flexDirection: 'row', justifyContent: 'space-between', gap: 15
  },
  actionBtn: {
    flex: 1, padding: 18, borderRadius: 12, 
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
    elevation: 5
  },
  submitBtn: { backgroundColor: '#1a237e' }, // Blue
  lockBtn: { backgroundColor: '#c0392b' },   // Red

  submitText: { color: 'white', fontWeight: 'bold', fontSize: 14, letterSpacing: 0.5 },

  lockedFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#dfe6e9', padding: 20,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
    borderTopLeftRadius: 20, borderTopRightRadius: 20
  },
  lockedFooterText: { marginLeft: 10, color: '#636e72', fontWeight: 'bold', fontSize: 16 }
});