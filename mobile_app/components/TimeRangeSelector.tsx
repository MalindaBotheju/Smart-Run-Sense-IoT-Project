import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const ranges = ["1H", "6H", "24H", "7D", "30D"] as const;
export type TimeRange = (typeof ranges)[number];

export default function TimeRangeSelector({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (r: TimeRange) => void;
}) {
  return (
    <View style={styles.container}>
      {ranges.map((r) => {
        const isActive = value === r;
        return (
          <TouchableOpacity
            key={r}
            style={[styles.btn, isActive && styles.activeBtn]}
            onPress={() => onChange(r)}
            activeOpacity={0.7}
          >
            <Text style={[styles.text, isActive && styles.activeText]}>
              {r}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
  },
  activeBtn: {
    backgroundColor: "rgb(253, 160, 98)", // Theme Orange
    borderColor: "rgb(253, 160, 98)",
  },
  text: {
    color: "#888",
    fontWeight: "600",
    fontSize: 13,
  },
  activeText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
