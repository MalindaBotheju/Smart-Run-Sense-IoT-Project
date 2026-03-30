import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;
const CHART_HEIGHT = 240;

// --- UPDATED INSIGHT LOGIC ---
const getInsight = (value: number, unit: string) => {
  if (unit === "°C") {
    if (value < 10) return { label: "Cold! Wear Jacket", icon: "snow-outline" };
    if (value >= 10 && value < 25)
      return { label: "Good for Jogging", icon: "walk-outline" };
    if (value >= 25 && value < 30)
      return { label: "Warm Weather", icon: "sunny-outline" };
    return { label: "Heat Warning!", icon: "flame-outline" };
  }
  if (unit === "°F") {
    if (value < 50) return { label: "Cold! Wear Jacket", icon: "snow-outline" };
    if (value >= 50 && value < 77)
      return { label: "Good for Jogging", icon: "walk-outline" };
    return { label: "High Heat", icon: "flame-outline" };
  }
  if (unit === "%") {
    // Humidity Logic
    if (value < 30) return { label: "Too Dry", icon: "water-outline" };
    if (value >= 30 && value <= 60)
      return { label: "Comfortable", icon: "happy-outline" };
    return { label: "Mold Risk!", icon: "thunderstorm-outline" };
  }
  if (unit === "Gas%") {
    // Gas Pollution Logic
    if (value < 20)
      return { label: "Clean Air", icon: "checkmark-circle-outline" };
    if (value < 50)
      return { label: "Moderate Gas", icon: "alert-circle-outline" };
    return { label: "High Pollution!", icon: "nuclear-outline" };
  }
  if (unit === "ppm") {
    if (value < 800) return { label: "Fresh Air", icon: "leaf-outline" };
    if (value < 1200) return { label: "Vent Room", icon: "bed-outline" };
    return { label: "Open Window!", icon: "alert-circle-outline" };
  }
  if (unit === "ppb") {
    if (value < 220)
      return { label: "Clean Air", icon: "shield-checkmark-outline" };
    return { label: "Chemicals Detected", icon: "skull-outline" };
  }
  if (unit === "µg") {
    // Dust / PM2.5 Logic
    if (value < 15) return { label: "Excellent Air", icon: "sparkles-outline" };
    if (value < 35) return { label: "Moderate", icon: "partly-sunny-outline" };
    return { label: "Dusty / Haze", icon: "cloud-offline-outline" };
  }
  if (unit === "AQI") {
    if (value <= 50) return { label: "Healthy Air", icon: "heart-outline" };
    if (value <= 100)
      return { label: "Moderate", icon: "alert-circle-outline" };
    return { label: "Unhealthy", icon: "medkit-outline" };
  }
  return { label: "Analyzing...", icon: "analytics-outline" };
};

export default function SensorLineChart({
  title,
  icon,
  data,
  labels,
  unit,
  color = "#1e90ff",
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  data: number[];
  labels: string[];
  unit: string;
  color?: string;
}) {
  const [selectedPoint, setSelectedPoint] = useState<{
    value: number;
    index: number;
    x: number;
    y: number;
  } | null>(null);

  const [useAltUnit, setUseAltUnit] = useState(false);

  if (!data || data.length === 0) return null;

  // Unit Conversion
  let displayData = data;
  let displayUnit = unit;
  if (useAltUnit) {
    if (unit === "°C") {
      displayUnit = "°F";
      displayData = data.map((d) => (d * 9) / 5 + 32);
    } else if (unit === "ppm") {
      displayUnit = "ppb";
      displayData = data.map((d) => d * 1000);
    }
  }

  const toggleUnit = () => {
    if (unit === "°C" || unit === "ppm") {
      setUseAltUnit(!useAltUnit);
      setSelectedPoint(null);
    }
  };

  const chartWidth = Math.max(screenWidth - 60, data.length * 50);

  // Fix: Pass 'unit' directly unless it's the special Gas case in UI
  const insight = selectedPoint
    ? getInsight(selectedPoint.value, unit)
    : { label: "", icon: "" };

  // For display purposes, remove the internal "Gas" tag if present
  const uiUnit = displayUnit === "Gas%" ? "%" : displayUnit;

  return (
    <View style={styles.card}>
      {/* 1. FIXED HEADER */}
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: color }]}>
          <Ionicons name={icon} size={18} color="#fff" />
        </View>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity style={styles.unitBadge} onPress={toggleUnit}>
          <Text style={styles.unitText}>
            {uiUnit} {unit === "°C" ? "⇄" : ""}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2. SCROLLABLE CHART AREA */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 40, paddingLeft: 10 }}
      >
        <View>
          {/* TOOLTIP OVERLAY */}
          {selectedPoint && (
            <View
              style={[
                styles.tooltip,
                {
                  backgroundColor: color,
                  top:
                    selectedPoint.y < 100
                      ? selectedPoint.y + 20
                      : selectedPoint.y - 100,
                  left: selectedPoint.x - 70,
                },
              ]}
            >
              <View style={styles.insightRow}>
                <Ionicons
                  name={insight.icon as any}
                  size={20}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.tooltipInsight}>{insight.label}</Text>
              </View>

              <Text style={styles.tooltipDate}>
                {labels[selectedPoint.index]} • {selectedPoint.value.toFixed(1)}{" "}
                {uiUnit}
              </Text>

              {/* TRIANGLE POINTER */}
              <View
                style={[
                  styles.triangle,
                  {
                    borderTopColor:
                      selectedPoint.y < 100 ? "transparent" : color,
                    borderBottomColor:
                      selectedPoint.y < 100 ? color : "transparent",
                    borderTopWidth: selectedPoint.y < 100 ? 0 : 10,
                    borderBottomWidth: selectedPoint.y < 100 ? 10 : 0,
                    bottom: selectedPoint.y < 100 ? "auto" : -10,
                    top: selectedPoint.y < 100 ? -10 : "auto",
                    left: 62,
                  },
                ]}
              />
            </View>
          )}

          {/* CHART */}
          <LineChart
            data={{
              labels: labels,
              datasets: [{ data: displayData }],
            }}
            width={chartWidth}
            height={CHART_HEIGHT}
            withDots={true}
            withInnerLines={true}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLabels={true}
            yAxisInterval={1}
            formatYLabel={(val) => parseFloat(val).toFixed(0)}
            onDataPointClick={(data) => {
              const { value, index, x, y } = data;
              setSelectedPoint({ value, index, x, y });
            }}
            chartConfig={{
              backgroundColor: "#fff",
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              decimalPlaces: 0,
              color: (opacity = 1) => color,
              labelColor: (opacity = 1) => `rgba(0,0,0,0.5)`,
              propsForBackgroundLines: { stroke: "#f0f0f0" },
              propsForDots: { r: "6", strokeWidth: "2", stroke: "#fff" },
              fillShadowGradientFrom: color,
              fillShadowGradientTo: "#fff",
            }}
            bezier
            style={styles.chart}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 0,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    zIndex: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  unitBadge: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  unitText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "700",
  },
  chart: {
    paddingRight: 50,
    marginLeft: -10,
    marginTop: 10,
  },
  tooltip: {
    position: "absolute",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    zIndex: 100,
    width: 150,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  tooltipInsight: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
    flexShrink: 1,
  },
  tooltipDate: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontWeight: "500",
  },
  triangle: {
    position: "absolute",
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
});
