import SensorLineChart from "@/components/SensorLineChart";
import TimeRangeSelector, { TimeRange } from "@/components/TimeRangeSelector";
import { fetchHistoricalData } from "@/lib/firestoreQueries";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChartDashboard() {
  const [range, setRange] = useState<TimeRange>("24H");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [range]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchHistoricalData(range);
      setRows(data || []); // Ensure data is never null
    } catch (e) {
      console.error("Error loading charts:", e);
    } finally {
      setLoading(false);
    }
  };

  // Safe Label Generator
  const getLabels = (data: any[]) => {
    if (!data || data.length === 0) return [];

    return data.map((r) => {
      if (!r.timestamp) return "";
      let date: Date;

      if (typeof r.timestamp.toDate === "function") date = r.timestamp.toDate();
      else if (r.timestamp instanceof Date) date = r.timestamp;
      else date = new Date(r.timestamp);

      if (isNaN(date.getTime())) return "";

      if (range === "1H" || range === "6H" || range === "24H") {
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else {
        return date.toLocaleDateString([], {
          month: "numeric",
          day: "numeric",
        });
      }
    });
  };

  const labels = getLabels(rows);

  // Helper to safely extract data (prevents crashes on old data)
  const getSafeData = (key: string) => {
    return rows.map((r) => {
      const val = r[key];
      // If value is undefined or null, return 0 to prevent crash
      return val !== undefined && val !== null ? val : 0;
    });
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="rgb(253, 160, 98)" />

      <SafeAreaView style={styles.headerSafe} edges={["top", "left", "right"]}>
        <View style={styles.headerContent}>
          <Text style={styles.pageTitle}>Analytics</Text>
          <Text style={styles.subTitle}>Historical trends & insights</Text>
        </View>
      </SafeAreaView>

      <View style={styles.bodyContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TimeRangeSelector value={range} onChange={setRange} />

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="rgb(253, 160, 98)" />
              <Text style={styles.loadingText}>Loading Chart Data...</Text>
            </View>
          ) : rows.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="stats-chart-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                No data available for this period.
              </Text>
            </View>
          ) : (
            <View>
              {/* Temperature */}
              <SensorLineChart
                title="Temperature"
                icon="thermometer-outline"
                unit="°C"
                data={getSafeData("temperature")}
                labels={labels}
                color="#FF9F1C"
              />

              {/* Humidity */}
              <SensorLineChart
                title="Humidity"
                icon="water-outline"
                unit="%"
                data={getSafeData("humidity")}
                labels={labels}
                color="#4CC9F0"
              />

              {/* Dust (NEW - Safe) */}
              <SensorLineChart
                title="Dust Levels"
                icon="filter-outline"
                unit="µg"
                data={getSafeData("dust")}
                labels={labels}
                color="#9D8189"
              />

              {/* eCO2 */}
              <SensorLineChart
                title="CO₂ Levels"
                icon="leaf-outline"
                unit="ppm"
                data={getSafeData("eco2")}
                labels={labels}
                color="#2EC4B6"
              />

              {/* TVOC */}
              <SensorLineChart
                title="TVOC"
                icon="flask-outline"
                unit="ppb"
                data={getSafeData("tvoc")}
                labels={labels}
                color="#7209B7"
              />

              {/* Gas Pollution (NEW - Safe) */}
              <SensorLineChart
                title="Gas Pollution"
                icon="cloud-outline"
                unit="Gas%"
                data={getSafeData("gas_pollution_percent")}
                labels={labels}
                color="#E71D36"
              />

              {/* AQI */}
              <SensorLineChart
                title="Air Quality"
                icon="cloud-circle-outline"
                unit="AQI"
                data={getSafeData("aqi")}
                labels={labels}
                color="#555555"
              />
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "rgb(253, 160, 98)" },
  headerSafe: { paddingBottom: 20 },
  headerContent: { paddingHorizontal: 24, paddingTop: 10 },
  pageTitle: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  subTitle: { fontSize: 14, color: "rgba(255,255,255,0.9)", marginTop: 4 },
  bodyContainer: {
    flex: 1,
    backgroundColor: "#f4f6fb",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  scrollContent: { padding: 24, paddingBottom: 50 },
  loadingContainer: { marginTop: 50, alignItems: "center" },
  loadingText: { marginTop: 10, color: "#888" },
  emptyContainer: { alignItems: "center", marginTop: 50 },
  emptyText: { color: "#999", marginTop: 10, fontSize: 14 },
});
