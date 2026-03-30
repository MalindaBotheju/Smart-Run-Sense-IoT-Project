import { db } from "@/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// --- COLOR PALETTE ---
const COLORS = {
  temp: "#FF9F1C",
  humidity: "#4CC9F0",
  dust: "#9D8189",
  tvoc: "#7209B7",
  eco2: "#2EC4B6",
  gas: "#E71D36",
  aqi: "#555555",
  safe: "#06D6A0", // Green Theme
  warning: "#FFD166",
  danger: "#EF476F",
  header: "rgb(253, 160, 98)", // Orange Header
};

// --- TYPES ---
type JoggingCondition = {
  label: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  summary: string;
};

type TimeSlot = {
  id: string;
  hour: number;
  timeLabel: string;
  temp: number;
  humidity: number;
  dust: number;
  aqi: number;
  tvoc: number;
  eco2: number;
  gas: number;
  condition: JoggingCondition;
};

// --- HELPER: METRICS ---
const getMetricConfig = (type: string, value: number) => {
  let identityColor = "#333";
  let icon: keyof typeof Ionicons.glyphMap = "analytics-outline";
  let statusLabel = "Normal";

  switch (type) {
    case "temp":
      identityColor = COLORS.temp;
      icon = "thermometer-outline";
      if (value > 32) statusLabel = "Hot";
      else if (value < 15) statusLabel = "Cold";
      else statusLabel = "Good";
      break;
    case "humidity":
      identityColor = COLORS.humidity;
      icon = "water-outline";
      if (value > 85) statusLabel = "High";
      else if (value < 30) statusLabel = "Dry";
      else statusLabel = "Comf.";
      break;
    case "dust":
      identityColor = COLORS.dust;
      icon = "filter-outline";
      if (value > 50) statusLabel = "High";
      else statusLabel = "Low";
      break;
    case "aqi":
      identityColor = COLORS.aqi;
      icon = "stats-chart-outline";
      if (value > 150) statusLabel = "Bad";
      else if (value > 100) statusLabel = "Mod.";
      else statusLabel = "Good";
      break;
    case "tvoc":
      identityColor = COLORS.tvoc;
      icon = "flask-outline";
      if (value > 500) statusLabel = "High";
      else statusLabel = "Safe";
      break;
    case "eco2":
      identityColor = COLORS.eco2;
      icon = "leaf-outline";
      if (value > 1000) statusLabel = "Stale";
      else statusLabel = "Fresh";
      break;
    case "gas":
      identityColor = COLORS.gas;
      icon = "cloud-outline";
      if (value > 50) statusLabel = "Polluted";
      else statusLabel = "Clear";
      break;
  }
  return { identityColor, icon, statusLabel };
};

// --- HELPER: TIPS ---
const generateActionableTips = (slot: TimeSlot): string[] => {
  const tips: string[] = [];
  if (slot.gas > 40 || slot.tvoc > 500)
    tips.push("High chemical pollution detected. Avoid heavy traffic routes.");
  if (slot.eco2 > 1200)
    tips.push("CO2 levels are high. Ensure good ventilation if indoors.");
  if (slot.aqi > 150 || slot.dust > 50)
    tips.push("Air quality is hazardous. Consider wearing an N95 mask.");
  if (slot.temp >= 32)
    tips.push("Heat warning. Hydrate frequently and take breaks.");
  if (tips.length === 0)
    tips.push("Conditions are optimal! Enjoy your activity.");
  return tips;
};

export default function Schedule() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dates, setDates] = useState<Date[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const days = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      days.push(d);
    }
    setDates(days);
  }, []);

  useEffect(() => {
    fetchScheduleFromFirestore(selectedDate);
  }, [selectedDate]);

  const analyzeConditions = (slot: any): JoggingCondition => {
    const { temp, aqi, dust, gas, tvoc } = slot;
    if (aqi > 150 || dust > 60 || gas > 70 || temp > 35) {
      return {
        label: "Not Recommended",
        color: COLORS.danger,
        icon: "alert-circle",
        summary: "Hazardous conditions detected.",
      };
    }
    if (dust > 35 || aqi > 100 || temp > 30 || tvoc > 400 || gas > 40) {
      return {
        label: "Caution Required",
        color: COLORS.warning,
        icon: "warning",
        summary: "Pollution or heat levels elevated.",
      };
    }
    return {
      label: "Good to Run",
      color: COLORS.safe,
      icon: "checkmark-circle",
      summary: "Conditions are safe and clear.",
    };
  };

  const fetchScheduleFromFirestore = async (date: Date) => {
    setLoading(true);
    setSlots([]);
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, "forecast", "esp32", "timeline"),
        where("predicted_time", ">=", startOfDay),
        where("predicted_time", "<=", endOfDay),
        orderBy("predicted_time", "asc"),
      );

      const querySnapshot = await getDocs(q);
      const fetchedSlots: TimeSlot[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.predicted_time) return;
        const timestamp = data.predicted_time.toDate();
        const h = timestamp.getHours();
        const m = timestamp.getMinutes();

        // We define a small "tolerance" window.
        // Data arriving at 5:00, 5:01, 5:02 count as "00"
        // Data arriving at 5:30, 5:31, 5:32 count as "30"
        const isFullHour = m >= 0 && m < 5;
        const isHalfHour = m >= 30 && m < 35;

        // --- CHANGED HERE ---
        // Removed the check for JOGGING_START_HOUR and JOGGING_END_HOUR.
        // Now checks ONLY if it is a :00 or :30 timestamp.
        if (isFullHour || isHalfHour) {
          const rawData = {
            temp: data.temperature || 0,
            humidity: data.humidity || 0,
            dust: data.dust || 0,
            aqi: data.aqi || 0,
            tvoc: data.tvoc || 0,
            eco2: data.eco2 || 400,
            gas: data.gas_pollution_percent || 0,
          };
          const condition = analyzeConditions(rawData);

          const displayMinute = isHalfHour ? "30" : "00";
          const timeLabel = `${h.toString().padStart(2, "0")}:${displayMinute}`;

          fetchedSlots.push({
            id: doc.id,
            hour: h,
            timeLabel: timeLabel,
            temp: parseFloat(rawData.temp.toFixed(1)),
            aqi: Math.round(rawData.aqi),
            dust: parseFloat(rawData.dust.toFixed(1)),
            humidity: parseFloat(rawData.humidity.toFixed(1)),
            tvoc: Math.round(rawData.tvoc),
            eco2: Math.round(rawData.eco2),
            gas: Math.round(rawData.gas),
            condition,
          });
        }
      });
      setSlots(fetchedSlots);
    } catch (error) {
      console.error("Error fetching schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setModalVisible(true);
  };

  const handleSchedule = () => {
    if (!selectedSlot) return;
    setModalVisible(false);
    Alert.alert(
      "✅ Reminder Set",
      `You will be reminded at ${selectedSlot.timeLabel}.`,
    );
  };

  const renderDetailModal = () => {
    if (!selectedSlot) return null;
    const tips = generateActionableTips(selectedSlot);
    const MetricItem = ({ title, value, unit, type }: any) => {
      const { identityColor, icon, statusLabel } = getMetricConfig(
        type,
        Number(value),
      );
      return (
        <View style={styles.metricCard}>
          <View style={styles.metricHeaderRow}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: identityColor + "15" },
              ]}
            >
              <Ionicons name={icon} size={20} color={identityColor} />
            </View>
            <Text style={styles.metricTitle}>{title}</Text>
          </View>
          <Text style={styles.metricValue}>
            {value} <Text style={styles.metricUnit}>{unit}</Text>
          </Text>
          <View
            style={[styles.statusBadge, { backgroundColor: identityColor }]}
          >
            <Text style={styles.statusBadgeText}>{statusLabel}</Text>
          </View>
        </View>
      );
    };

    return (
      <Modal
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Details for {selectedSlot.timeLabel}
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View
              style={[
                styles.statusHero,
                { backgroundColor: selectedSlot.condition.color },
              ]}
            >
              <Ionicons
                name={selectedSlot.condition.icon}
                size={48}
                color="#fff"
              />
              <Text style={styles.heroLabel}>
                {selectedSlot.condition.label}
              </Text>
              <Text style={styles.heroSummary}>
                {selectedSlot.condition.summary}
              </Text>
            </View>

            <Text style={styles.sectionHeader}>Environment Data</Text>
            <View style={styles.gridContainer}>
              <MetricItem
                title="Temperature"
                value={selectedSlot.temp}
                unit="°C"
                type="temp"
              />
              <MetricItem
                title="Humidity"
                value={selectedSlot.humidity}
                unit="%"
                type="humidity"
              />
              <MetricItem
                title="Dust Level"
                value={selectedSlot.dust}
                unit="µg"
                type="dust"
              />
              <MetricItem
                title="AQI"
                value={selectedSlot.aqi}
                unit=""
                type="aqi"
              />
              <MetricItem
                title="TVOC"
                value={selectedSlot.tvoc}
                unit="ppb"
                type="tvoc"
              />
              <MetricItem
                title="eCO2"
                value={selectedSlot.eco2}
                unit="ppm"
                type="eco2"
              />
              <MetricItem
                title="Gas Poll."
                value={selectedSlot.gas}
                unit="%"
                type="gas"
              />
            </View>

            <Text style={styles.sectionHeader}>Guidelines and Tips</Text>
            <View style={styles.guidelinesBox}>
              {tips.map((tip, index) => (
                <View key={index} style={styles.guideRowPointwise}>
                  <Text style={styles.guideBullet}>•</Text>
                  <Text style={styles.guideTextPointwise}>{tip}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalActionBtn}
              onPress={handleSchedule}
            >
              <Ionicons
                name="alarm-outline"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.modalBtnText}>Set Reminder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    // 1. MAIN CONTAINER IS ORANGE (Matches Header)
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.header} />

      {/* 2. HEADER */}
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.headerContent}>
          <Text style={styles.pageTitle}>Plan Your Activity</Text>
          <Text style={styles.lastUpdate}>
            Check chemicals, air, and weather
          </Text>
        </View>
      </SafeAreaView>

      {/* 3. BODY: White with Curved Top */}
      <View style={styles.bodyContainer}>
        {/* Calendar Strip */}
        <View style={styles.dateStripContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {dates.map((date, index) => {
              const isSelected = date.getDate() === selectedDate.getDate();
              const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
                date.getDay()
              ];
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateItem,
                    isSelected && styles.dateItemSelected,
                  ]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text
                    style={[styles.dayName, isSelected && styles.textSelected]}
                  >
                    {dayName}
                  </Text>
                  <Text
                    style={[
                      styles.dayNumber,
                      isSelected && styles.textSelected,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* The List Content */}
        <View style={styles.listContent}>
          <Text style={styles.sectionTitle}>
            {selectedDate.toDateString() === new Date().toDateString()
              ? "Today's Schedule"
              : selectedDate.toLocaleDateString()}
          </Text>

          {loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#06D6A0" />
              <Text style={styles.emptyText}>Loading forecast...</Text>
            </View>
          ) : slots.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cloud-offline-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                No data available for this date.
              </Text>
            </View>
          ) : (
            <FlatList
              data={slots}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.cleanSlotCard}
                  onPress={() => openDetail(item)}
                >
                  <View style={styles.cleanTimeBox}>
                    <Text style={styles.cleanTimeText}>{item.timeLabel}</Text>
                  </View>
                  <View style={styles.cleanInfoBox}>
                    <Text
                      style={[
                        styles.cleanStatusLabel,
                        { color: item.condition.color },
                      ]}
                    >
                      {item.condition.label}
                    </Text>
                    <Text style={styles.cleanSummaryText}>
                      {item.condition.summary}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>

      {renderDetailModal()}
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  // 1. Main Background (Orange)
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.header,
  },

  // 2. Clean Header
  headerSafe: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  lastUpdate: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },

  // 3. Body Container
  bodyContainer: {
    flex: 1,
    backgroundColor: "#f4f6fb",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
    paddingTop: 20,
  },

  // 4. Date Strip
  dateStripContainer: {
    height: 85,
    paddingLeft: 20,
    marginBottom: 10,
  },
  dateItem: {
    width: 60,
    height: 75,
    backgroundColor: "#fff",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  dateItemSelected: {
    backgroundColor: COLORS.safe,
    borderColor: COLORS.safe,
  },
  dayName: { fontSize: 12, color: "#888", marginBottom: 4 },
  dayNumber: { fontSize: 18, fontWeight: "bold", color: "#333" },
  textSelected: { color: "#fff" },

  // List Content
  listContent: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // === EXISTING STYLES ===
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 15,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  emptyText: { textAlign: "center", color: "#888", marginTop: 8 },

  cleanSlotCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  cleanTimeBox: {
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    width: 70,
  },
  cleanTimeText: { fontSize: 18, fontWeight: "bold", color: "#333" },
  cleanInfoBox: { flex: 1, paddingLeft: 16 },
  cleanStatusLabel: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  cleanSummaryText: { fontSize: 13, color: "#888" },

  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: "#fff" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: Platform.OS === "android" ? 40 : 50,
    backgroundColor: "#fff",
  },
  closeBtn: { padding: 5, marginRight: 15 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  modalScroll: { paddingBottom: 100 },
  statusHero: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  heroLabel: { fontSize: 24, fontWeight: "bold", color: "#fff", marginTop: 10 },
  heroSummary: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginTop: 5,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 20,
    marginTop: 25,
    marginBottom: 15,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  metricCard: {
    width: "31%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: "center",
    justifyContent: "space-between",
    height: 128,
  },
  metricHeaderRow: { alignItems: "center", marginBottom: 4 },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  metricTitle: {
    fontSize: 11,
    color: "#888",
    fontWeight: "600",
    textAlign: "center",
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 2,
  },
  metricUnit: { fontSize: 10, fontWeight: "normal", color: "#999" },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
    minWidth: 50,
    alignItems: "center",
  },
  statusBadgeText: { fontSize: 10, color: "#fff", fontWeight: "bold" },
  guidelinesBox: {
    marginHorizontal: 20,
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: 20,
  },
  guideRowPointwise: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
  },
  guideBullet: { fontSize: 18, color: "#333", marginRight: 8, lineHeight: 22 },
  guideTextPointwise: { fontSize: 15, color: "#333", flex: 1, lineHeight: 22 },
  modalFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  modalActionBtn: {
    flexDirection: "row",
    backgroundColor: "#06D6A0",
    borderRadius: 16,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#06D6A0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
