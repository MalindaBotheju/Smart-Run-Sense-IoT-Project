import { db } from "@/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Prediction = {
  id: string;
  temperature: number;
  humidity: number;
  dust: number;
  aqi: number;
  tvoc: number;
  eco2: number;
  gas_pollution_percent: number; // Added new field
  predicted_time: any;
};

export default function PredictionDashboard() {
  const [data, setData] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    try {
      const ref = collection(db, "forecast", "esp32", "timeline");
      const q = query(ref, orderBy("predicted_time", "asc"));
      const snap = await getDocs(q);

      const list: Prediction[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));

      setData(list);
    } catch (e) {
      console.error("Prediction fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false); // Stop refresh spinner
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPredictions();
  };

  // --- UPDATED TIME FORMATTER (24H) ---
  const formatTime = (ts: any) => {
    if (!ts?.toDate) return "--";
    const date = ts.toDate();

    return date
      .toLocaleString("en-US", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(",", "");
  };

  /* ---------------- SUB-COMPONENTS ---------------- */

  const MiniMetric = ({ icon, value, unit, color }: any) => (
    <View style={styles.metricItem}>
      <Ionicons
        name={icon}
        size={16}
        color={color}
        style={{ marginBottom: 4 }}
      />
      <Text style={styles.metricValue}>
        {value} <Text style={styles.metricUnit}>{unit}</Text>
      </Text>
    </View>
  );

  const PredictionCard = ({ item }: { item: Prediction }) => (
    <View style={styles.card}>
      {/* Card Header: Time & AQI Badge */}
      <View style={styles.cardHeader}>
        <View style={styles.timeTag}>
          <Ionicons name="time" size={14} color="#fff" />
          <Text style={styles.timeText}>{formatTime(item.predicted_time)}</Text>
        </View>

        {/* AQI is distinct in the header */}
        <View style={styles.aqiBadge}>
          <Text style={styles.aqiText}>AQI: {item.aqi}</Text>
        </View>
      </View>

      {/* Card Body: Data Grid */}
      <View style={styles.metricGrid}>
        {/* Row 1: Basic Environmental */}
        <View style={styles.row}>
          <MiniMetric
            icon="thermometer-outline"
            value={item.temperature?.toFixed(1)}
            unit="°C"
            color="#FF9F1C"
          />
          <MiniMetric
            icon="water-outline"
            value={item.humidity?.toFixed(1)}
            unit="%"
            color="#4CC9F0"
          />
          <MiniMetric
            icon="filter-outline"
            value={item.dust?.toFixed(2)}
            unit="µg"
            color="#9D8189"
          />
        </View>

        <View style={styles.divider} />

        {/* Row 2: Gas & Chemical */}
        <View style={styles.row}>
          <MiniMetric
            icon="flask-outline"
            value={item.tvoc}
            unit="ppb"
            color="#7209B7"
          />
          <MiniMetric
            icon="leaf-outline"
            value={item.eco2}
            unit="ppm"
            color="#2EC4B6"
          />
          {/* Replaced Duplicate AQI with New Gas Metric */}
          <MiniMetric
            icon="cloud-outline"
            value={item.gas_pollution_percent?.toFixed(0)}
            unit="%" // Gas Pollution %
            color="#E71D36" // Red color for warning
          />
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="rgb(253, 160, 98)" />

      {/* ---------------- HEADER ---------------- */}
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.headerContent}>
          <Text style={styles.pageTitle}>Future Forecast</Text>
          <Text style={styles.subTitle}>Predicted environmental trends</Text>
        </View>
      </SafeAreaView>

      {/* ---------------- BODY ---------------- */}
      <View style={styles.bodyContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="rgb(253, 160, 98)" />
            <Text style={styles.loadingText}>Analyzing Data...</Text>
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <PredictionCard item={item} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["rgb(253, 160, 98)"]}
                tintColor="rgb(253, 160, 98)"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>
                  No predictions available yet.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "rgb(253, 160, 98)",
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
  subTitle: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#888",
    fontSize: 14,
  },
  listContent: {
    padding: 24,
    paddingBottom: 40,
  },
  /* Card Styles */
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginBottom: 16,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  timeTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgb(255, 120, 30)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  timeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 6,
  },
  aqiBadge: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  aqiText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#555",
  },
  metricGrid: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 12,
  },
  /* Mini Metric Item */
  metricItem: {
    alignItems: "center",
    width: "30%", // Ensures 3 items fit evenly
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  metricUnit: {
    fontSize: 10,
    color: "#aaa",
    fontWeight: "normal",
  },
  /* Empty State */
  emptyContainer: {
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    color: "#999",
    marginTop: 10,
    fontSize: 14,
  },
});
