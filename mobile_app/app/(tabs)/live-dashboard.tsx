import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  documentId,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { db } from "../../firebaseConfig";

export default function LiveDashboard() {
  const [data, setData] = useState<any>(null);

  /* ---------- FIRESTORE LISTENER ---------- */
  useEffect(() => {
    const q = query(
      collection(db, "sensor_data", "esp32", "readings"),
      orderBy(documentId(), "desc"),
      limit(1),
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) setData(snap.docs[0].data());
    });

    return unsub;
  }, []);

  /* ---------- HELPERS ---------- */
  const formatTime = (ts: any) =>
    ts?.toDate
      ? ts
          .toDate()
          .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "--:--";

  // Helper just for the text status now
  const getAQIStatusText = (aqi: number) => {
    if (aqi <= 2) return "Good";
    if (aqi <= 4) return "Moderate";
    return "Poor";
  };

  const aqiStatusText = getAQIStatusText(data?.aqi ?? 0);
  const AQI_THEME_COLOR = "#333333"; // Fixed black color for AQI card

  /* ---------- SENSOR CARD COMPONENT ---------- */
  const SensorCard = ({ iconName, label, value, unit, color }: any) => (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: color }]}>
        <Ionicons name={iconName} size={22} color="#fff" />
      </View>
      <View>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardValue}>
          {value ?? "--"} <Text style={styles.unit}>{unit}</Text>
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="rgb(253, 160, 98)" />

      {/* ---------------- HEADER ---------------- */}
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.pageTitle}>Live Monitor</Text>
            <Text style={styles.lastUpdate}>
              <Ionicons
                name="time-outline"
                size={14}
                color="rgba(255,255,255,0.8)"
              />{" "}
              Updated: {formatTime(data?.timestamp)}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* ---------------- BODY ---------------- */}
      <View style={styles.bodyContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* AQI HERO CARD - UPDATED (Static Black, No Icon) */}
          <View style={[styles.aqiCard, { borderColor: AQI_THEME_COLOR }]}>
            <View style={styles.aqiHeader}>
              <Text style={styles.aqiTitle}>Air Quality Index</Text>
              {/* Icon removed from here */}
            </View>

            <View style={styles.aqiRow}>
              <Text style={[styles.aqiValue, { color: AQI_THEME_COLOR }]}>
                {data?.aqi ?? "--"}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: AQI_THEME_COLOR },
                ]}
              >
                <Text style={styles.statusText}>{aqiStatusText}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Sensor Readings</Text>

          {/* SENSOR GRID */}
          <View style={styles.grid}>
            <SensorCard
              iconName="thermometer-outline"
              label="Temperature"
              value={data?.temperature?.toFixed(1)}
              unit="°C"
              color="#FF9F1C" // Orange
            />
            <SensorCard
              iconName="water-outline"
              label="Humidity"
              value={data?.humidity?.toFixed(1)}
              unit="%"
              color="#4CC9F0" // Blue
            />
            <SensorCard
              iconName="leaf-outline"
              label="CO₂"
              value={data?.eco2}
              unit="ppm"
              color="#2EC4B6" // Teal
            />

            {/* UPDATED: Gas Pollution Card */}
            <SensorCard
              iconName="cloud-outline"
              label="Gas Pollution"
              value={data?.gas_pollution_percent} // Matches Arduino JSON
              unit="%"
              color="#E71D36" // Red
            />

            <SensorCard
              iconName="flask-outline"
              label="TVOC"
              value={data?.tvoc}
              unit="ppb"
              color="#7209B7" // Purple
            />
            <SensorCard
              iconName="filter-outline"
              label="Dust"
              value={data?.dust?.toFixed(3)} // Fixed to 3 decimals
              unit="µg"
              color="#9D8189" // Grey
            />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "rgb(253, 160, 98)", // Theme Color
  },
  /* Header */
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
  /* Body */
  bodyContainer: {
    flex: 1,
    backgroundColor: "#f4f6fb",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  scrollContent: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 24,
    marginBottom: 16,
    marginLeft: 4,
  },
  /* AQI Hero Card */
  aqiCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    borderLeftWidth: 6,
  },
  aqiHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aqiTitle: {
    fontSize: 16,
    color: "#777",
    fontWeight: "600",
  },
  aqiRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  aqiValue: {
    fontSize: 42,
    fontWeight: "bold",
  },
  statusBadge: {
    marginLeft: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  /* Grid & Cards */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%", // Two columns
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 13,
    color: "#888",
    fontWeight: "500",
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 4,
  },
  unit: {
    fontSize: 12,
    color: "#aaa",
    fontWeight: "normal",
  },
});
