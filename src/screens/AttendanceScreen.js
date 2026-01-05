import React, { useState, useLayoutEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { STUDENTS } from '../data/students';

// ====================================================
// ✅ YOUR GOOGLE SCRIPT URL
// ====================================================
const API_URL = "https://script.google.com/macros/s/AKfycbyVxVz0ZwSakv1egwz6lsS82vDzsSWmppAyU6ikfPD8W4nZeJfU9pI-NVKTas4QkhE2/exec";

export default function AttendanceScreen({ route, navigation }) {
  const { teacherName, className, section } = route.params;
  const classKey = `${className}-${section}`;
  const studentList = STUDENTS[classKey] || [];

  // Hide Default Header
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);

  // Mark Attendance Logic
  const markAttendance = (studentId, status) => {
    const currentHour = new Date().getHours();
    if (currentHour >= 12) {
      Alert.alert("Locked", "Attendance is locked after 12:00 PM.");
      return;
    }
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  // Submit Logic
  const submitData = async () => {
    const markedCount = Object.keys(attendance).length;
    if (markedCount < studentList.length) {
      Alert.alert("Incomplete", "Please mark attendance (P, A, or L) for all students.");
      return;
    }

    setLoading(true);

    const payload = {
      className: className,
      section: section,
      teacher: teacherName,
      students: studentList.map(s => ({
        rollNo: s.rollNo,
        name: s.name,
        status: attendance[s.id]
      }))
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const result = await response.text();

      if (result.includes("Success")) {
        Alert.alert(
          "Success",
          "Attendance synced to Google Sheets!",
          [{ text: "OK", onPress: () => navigation.replace('Login') }]
        );
      } else {
        Alert.alert("Error", "Server error. Please try again.");
      }
    } catch (error) {
      Alert.alert("Connection Error", "Check your internet connection.");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const renderStudent = ({ item }) => {
    const status = attendance[item.id];

    return (
      <View style={styles.studentRow}>
        <View style={styles.info}>
          <Text style={styles.rollNo}>{item.rollNo}</Text>
          <Text style={styles.name}>{item.name}</Text>
        </View>

        <View style={styles.buttons}>
          {/* P - Green */}
          <TouchableOpacity
            style={[styles.btn, status === 'P' ? styles.btnGreen : styles.btnOutline]}
            onPress={() => markAttendance(item.id, 'P')}
          >
            <Text style={status === 'P' ? styles.textWhite : styles.textGreen}>P</Text>
          </TouchableOpacity>

          {/* A - Red */}
          <TouchableOpacity
            style={[styles.btn, status === 'A' ? styles.btnRed : styles.btnOutline]}
            onPress={() => markAttendance(item.id, 'A')}
          >
            <Text style={status === 'A' ? styles.textWhite : styles.textRed}>A</Text>
          </TouchableOpacity>

          {/* L - Yellow */}
          <TouchableOpacity
            style={[styles.btn, status === 'L' ? styles.btnYellow : styles.btnOutline]}
            onPress={() => markAttendance(item.id, 'L')}
          >
            <Text style={status === 'L' ? styles.textWhite : styles.textYellow}>L</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Date Formatter (e.g., "Tuesday, Jan 06 2026")
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'short', day: '2-digit' };
  const formattedDate = new Date().toLocaleDateString('en-US', dateOptions);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1a237e" barStyle="light-content" />

      {/* BRANDED HEADER */}
      <View style={styles.header}>
        {/* ROW 1: Main Title (Pushed higher) */}
        <Text style={styles.headerTitle}>Attendance Record</Text>

        {/* ROW 2: Teacher (Left) & Grade (Right) */}
        <View style={styles.subHeaderRow}>
          <Text style={styles.teacherName}>{teacherName}</Text>
          
          <View style={styles.gradeBadge}>
            <Text style={styles.gradeText}>{className}-{section}</Text>
          </View>
        </View>

        {/* ROW 3: Date */}
        <Text style={styles.headerDate}>{formattedDate}</Text>
      </View>

      {/* TABLE HEADERS */}
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
        contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
      />

      {/* SUBMIT BUTTON */}
      <TouchableOpacity
        style={[styles.submitBtn, loading && { backgroundColor: '#ccc' }]}
        onPress={submitData}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>COMPLETE ATTENDANCE</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// =======================
// STYLING
// =======================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },

  // Header Container (Compact & Clean)
  header: {
    backgroundColor: '#1a237e',
    paddingHorizontal: 20,
    paddingTop: 35, // Pushed text higher (was 45)
    paddingBottom: 15, // Reduced bottom space (was 20)
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },

  // Line 1: Title
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e8eaf6', // Slightly softer white
    marginBottom: 5, // Tight spacing
  },

  // Line 2: Row for Teacher & Grade
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Push Left & Right
    marginBottom: 5, // Tight spacing
    width: '100%',
  },
  teacherName: {
    fontSize: 20,
    color: '#ffcc80', // Gold color
    fontWeight: 'bold',
  },
  gradeBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6
  },
  gradeText: { color: 'white', fontWeight: 'bold', fontSize: 14 },

  // Line 3: Date
  headerDate: {
    fontSize: 13,
    color: '#c5cae9', // Lighter purple/white
    fontWeight: '500'
  },

  // Table Header
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#dfe6e9',
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginTop: 15,
    marginHorizontal: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  columnText: { fontWeight: 'bold', color: '#636e72', fontSize: 14 },

  // List Item
  studentRow: {
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    elevation: 2
  },
  info: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  rollNo: {
    width: 35, height: 35, borderRadius: 17.5,
    backgroundColor: '#f1f2f6', textAlign: 'center', textAlignVertical: 'center',
    fontWeight: 'bold', color: '#2f3542', marginRight: 10, fontSize: 14
  },
  name: { fontSize: 16, color: '#2f3542', fontWeight: '500', flex: 1, flexWrap: 'wrap' },

  // Buttons
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

  // Submit Button
  submitBtn: {
    position: 'absolute', bottom: 30, left: 20, right: 20,
    backgroundColor: '#1a237e',
    padding: 18, borderRadius: 15, alignItems: 'center', elevation: 5
  },
  submitText: { color: 'white', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 }
});