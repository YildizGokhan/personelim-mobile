import React, { useEffect, useMemo } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  Alert,
} from "react-native";
import { Layout, Text, Button, Card } from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import usePersonelStore from "../store/personelStore";

const formatDate = (dateValue) => {
  if (!dateValue) return "-";
  try {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }
    return date.toLocaleDateString("tr-TR");
  } catch (error) {
    return dateValue;
  }
};

const formatTime = (timeValue) => {
  if (!timeValue) return "-";
  const normalized =
    typeof timeValue === "string" ? timeValue : String(timeValue);

  if (/^\d{2}:\d{2}$/.test(normalized)) {
    return normalized;
  }

  // Attempt to parse ISO strings
  try {
    const date = new Date(normalized);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  } catch (error) {
    return normalized;
  }

  return normalized;
};

const deriveTimesheetStatus = (timesheet) => {
  const status =
    timesheet?.status ||
    timesheet?.approvalStatus ||
    (timesheet?.approved ? "approved" : undefined);

  if (!status) {
    return {
      label: "Kaydedildi",
      color: "#2196F3",
    };
  }

  switch (status) {
    case "approved":
      return { label: "Onaylandı", color: "#4CAF50" };
    case "pending":
      return { label: "Beklemede", color: "#FF9800" };
    case "rejected":
      return { label: "Reddedildi", color: "#F44336" };
    default:
      return { label: status, color: "#607D8B" };
  }
};

const MyTimesheetsScreen = ({ navigation }) => {
  const {
    myTimesheets,
    isLoading,
    fetchMyTimesheets,
    deleteTimesheet,
    timesheetPagination,
  } = usePersonelStore();

  useEffect(() => {
    fetchMyTimesheets();
  }, [fetchMyTimesheets]);

  const handleRefresh = () => {
    const currentPage = timesheetPagination?.page ?? 1;
    const currentLimit = timesheetPagination?.limit ?? 10;
    fetchMyTimesheets(currentPage, currentLimit);
  };

  const totalTrackedHours = useMemo(() => {
    if (!myTimesheets?.length) return 0;
    return myTimesheets.reduce((acc, entry) => {
      const totalHours =
        entry?.totalHours ??
        entry?.workedHours ??
        entry?.hours ??
        entry?.durationHours ??
        0;
      return acc + (Number(totalHours) || 0);
    }, 0);
  }, [myTimesheets]);

  const handleDelete = (timesheetId) => {
    Alert.alert(
      "Mesai Kaydını Sil",
      "Bu mesai kaydını silmek istediğinden emin misin?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            const result = await deleteTimesheet(timesheetId);
            if (!result.success) {
              Alert.alert(
                "Hata",
                result.error || "Mesai kaydı silinirken bir hata oluştu"
              );
            }
          },
        },
      ]
    );
  };

  const renderTimesheetItem = ({ item }) => {
    const statusInfo = deriveTimesheetStatus(item);
    const startTime = item?.startTime || item?.clockIn || item?.inTime;
    const endTime = item?.endTime || item?.clockOut || item?.outTime;
    const breakMinutes =
      item?.breakMinutes ?? item?.breakDuration ?? item?.breakTime ?? 0;
    const totalHours =
      item?.totalHours ??
      item?.workedHours ??
      item?.hours ??
      item?.durationHours;

    return (
      <Card style={styles.timesheetCard}>
        <View style={styles.timesheetHeader}>
          <View style={styles.timesheetHeaderLeft}>
            <Ionicons name="time-outline" size={22} color="#2196F3" />
            <View style={styles.headerTextContainer}>
              <Text category="s1">{formatDate(item?.date)}</Text>
              {(item?.project || item?.taskName) && (
                <Text category="c1" appearance="hint">
                  {item?.project || item?.taskName}
                </Text>
              )}
            </View>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}
          >
            <Text category="c2" style={styles.statusText}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <View style={styles.timesheetContent}>
          <View style={styles.row}>
            <Text category="s2" style={styles.label}>
              Başlangıç
            </Text>
            <Text category="p2">{formatTime(startTime)}</Text>
          </View>
          <View style={styles.row}>
            <Text category="s2" style={styles.label}>
              Bitiş
            </Text>
            <Text category="p2">{formatTime(endTime)}</Text>
          </View>
          <View style={styles.row}>
            <Text category="s2" style={styles.label}>
              Molalar
            </Text>
            <Text category="p2">
              {breakMinutes ? `${breakMinutes} dk` : "Belirtilmemiş"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text category="s2" style={styles.label}>
              Toplam Süre
            </Text>
            <Text category="p2">
              {totalHours ? `${totalHours} saat` : "-"}
            </Text>
          </View>
          {item?.notes && (
            <View style={styles.notesContainer}>
              <Text category="s2" style={styles.label}>
                Not
              </Text>
              <Text category="p2" style={styles.notesText}>
                {item.notes}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardActions}>
          <Button
            appearance="ghost"
            size="small"
            accessoryLeft={(props) => (
              <Ionicons
                name="create-outline"
                size={18}
                color={props?.style?.tintColor || "#2196F3"}
              />
            )}
            onPress={() =>
              navigation.navigate("CreateTimesheet", { timesheet: item })
            }
          >
            Düzenle
          </Button>
          <Button
            appearance="ghost"
            status="danger"
            size="small"
            accessoryLeft={(props) => (
              <Ionicons
                name="trash-outline"
                size={18}
                color={props?.style?.tintColor || "#F44336"}
              />
            )}
            onPress={() => handleDelete(item?.id || item?._id)}
          >
            Sil
          </Button>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Layout style={styles.content}>
        <View style={styles.header}>
          <Text category="h4" style={styles.title}>
            Çalışma Kayıtlarım
          </Text>
          <Button
            size="small"
            onPress={() => navigation.navigate("CreateTimesheet")}
          >
            + Mesai Kaydı
          </Button>
        </View>

        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Text category="h6" style={styles.statNumber}>
              {myTimesheets?.length || 0}
            </Text>
            <Text category="s2" style={styles.statLabel}>
              Toplam Kayıt
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Text category="h6" style={styles.statNumber}>
              {totalTrackedHours.toFixed(1)}
            </Text>
            <Text category="s2" style={styles.statLabel}>
              Toplam Saat
            </Text>
          </Card>
        </View>

        {myTimesheets && myTimesheets.length > 0 ? (
          <FlatList
            data={myTimesheets}
            renderItem={renderTimesheetItem}
            keyExtractor={(item, index) =>
              item?.id || item?._id || `timesheet-${index}`
            }
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={48} color="#ccc" />
            <Text category="s1" style={styles.emptyText}>
              Henüz mesai kaydınız bulunmuyor
            </Text>
            <Text category="c1" style={styles.emptySubtext}>
              Yeni mesai oluşturmak için yukarıdaki butonu kullanabilirsiniz.
            </Text>
          </View>
        )}
      </Layout>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
    paddingVertical: 12,
  },
  statNumber: {
    color: "#2196F3",
    marginBottom: 4,
  },
  statLabel: {
    textAlign: "center",
    color: "#666",
  },
  listContent: {
    paddingBottom: 24,
  },
  timesheetCard: {
    marginBottom: 12,
  },
  timesheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  timesheetHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTextContainer: {
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontWeight: "600",
  },
  timesheetContent: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: "#666",
  },
  notesContainer: {
    marginTop: 8,
  },
  notesText: {
    marginTop: 4,
    color: "#333",
  },
  cardActions: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 8,
    color: "#666",
  },
  emptySubtext: {
    textAlign: "center",
    color: "#999",
    paddingHorizontal: 40,
  },
});

export default MyTimesheetsScreen;


