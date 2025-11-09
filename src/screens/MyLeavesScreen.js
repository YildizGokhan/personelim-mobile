import React, { useEffect, useState } from "react";
import { StyleSheet, View, FlatList, RefreshControl } from "react-native";
import {
  Layout,
  Text,
  Button,
  Card,
  ListItem,
  Divider,
} from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import usePersonelStore from "../store/personelStore";

const MyLeavesScreen = ({ navigation }) => {
  const { myLeaves, fetchMyLeaves, isLoading } = usePersonelStore();
  const [selectedStatus, setSelectedStatus] = useState(null);

  const statusOptions = [
    { label: "Tümü", value: null },
    { label: "Bekleyen", value: "pending" },
    { label: "Onaylanan", value: "approved" },
    { label: "Reddedilen", value: "rejected" },
  ];

  useEffect(() => {
    fetchMyLeaves(1, 10, selectedStatus);
  }, [selectedStatus, fetchMyLeaves]);

  const handleRefresh = () => {
    fetchMyLeaves(1, 10, selectedStatus);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "#4CAF50";
      case "rejected":
        return "#F44336";
      case "pending":
        return "#FF9800";
      default:
        return "#666";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "approved":
        return "Onaylandı";
      case "rejected":
        return "Reddedildi";
      case "pending":
        return "Bekliyor";
      default:
        return status;
    }
  };

  const getLeaveTypeText = (type) => {
    switch (type) {
      case "günlük":
        return "Günlük İzin";
      case "yıllık":
        return "Yıllık İzin";
      case "mazeret":
        return "Mazeret İzni";
      default:
        return type;
    }
  };

  const renderLeaveItem = ({ item }) => (
    <Card style={styles.leaveCard}>
      <View style={styles.leaveHeader}>
        <View style={styles.leaveTypeContainer}>
          <Ionicons name="calendar-outline" size={20} color="#2196F3" />
          <Text category="s1" style={styles.leaveType}>
            {getLeaveTypeText(item.type)}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text category="c2" style={styles.statusText}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.leaveContent}>
        <View style={styles.dateContainer}>
          <Text category="s2" style={styles.dateLabel}>
            Başlangıç:
          </Text>
          <Text category="p2" style={styles.dateValue}>
            {new Date(item.startDate).toLocaleDateString("tr-TR")}
          </Text>
        </View>

        <View style={styles.dateContainer}>
          <Text category="s2" style={styles.dateLabel}>
            Bitiş:
          </Text>
          <Text category="p2" style={styles.dateValue}>
            {new Date(item.endDate).toLocaleDateString("tr-TR")}
          </Text>
        </View>

        {item.reason && (
          <View style={styles.reasonContainer}>
            <Text category="s2" style={styles.reasonLabel}>
              Açıklama:
            </Text>
            <Text category="p2" style={styles.reasonText}>
              {item.reason}
            </Text>
          </View>
        )}

        <View style={styles.metaContainer}>
          <Text category="c1" style={styles.metaText}>
            Talep Tarihi: {new Date(item.createdAt).toLocaleDateString("tr-TR")}
          </Text>
          {item.approvedAt && (
            <Text category="c1" style={styles.metaText}>
              {item.status === "approved" ? "Onay" : "Red"} Tarihi:{" "}
              {new Date(item.approvedAt).toLocaleDateString("tr-TR")}
            </Text>
          )}
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Layout style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text category="h4" style={styles.title}>
            İzin Taleplerim
          </Text>
          <Button
            size="small"
            onPress={() => navigation.navigate("CreateLeave")}
          >
            + Yeni İzin
          </Button>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Text category="h6" style={styles.statNumber}>
              {myLeaves?.filter((leave) => leave.status === "approved")
                .length || 0}
            </Text>
            <Text category="s2" style={styles.statLabel}>
              Onaylanan
            </Text>
          </Card>

          <Card style={styles.statCard}>
            <Text category="h6" style={styles.statNumber}>
              {myLeaves?.filter((leave) => leave.status === "pending").length ||
                0}
            </Text>
            <Text category="s2" style={styles.statLabel}>
              Bekleyen
            </Text>
          </Card>

          <Card style={styles.statCard}>
            <Text category="h6" style={styles.statNumber}>
              {myLeaves?.filter((leave) => leave.status === "rejected")
                .length || 0}
            </Text>
            <Text category="s2" style={styles.statLabel}>
              Reddedilen
            </Text>
          </Card>
        </View>

        <View style={styles.filterRow}>
          {statusOptions.map((option) => {
            const active = option.value === selectedStatus;
            return (
              <Button
                key={option.value ?? "all"}
                size="tiny"
                appearance={active ? "filled" : "outline"}
                status={active ? "primary" : "basic"}
                style={styles.filterButton}
                onPress={() => setSelectedStatus(option.value)}
              >
                {option.label}
              </Button>
            );
          })}
        </View>

        {/* Leaves List */}
        {myLeaves && myLeaves.length > 0 ? (
          <FlatList
            data={myLeaves}
            renderItem={renderLeaveItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={handleRefresh}
              />
            }
            style={styles.list}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#ccc" />
            <Text category="s1" style={styles.emptyText}>
              Henüz izin talebiniz bulunmuyor
            </Text>
            <Text category="c1" style={styles.emptySubtext}>
              Yeni bir izin talebi oluşturmak için yukarıdaki butona tıklayın
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
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    minWidth: 90,
  },
  list: {
    flex: 1,
  },
  leaveCard: {
    marginBottom: 12,
  },
  leaveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  leaveTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  leaveType: {
    marginLeft: 8,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "white",
    fontWeight: "600",
  },
  leaveContent: {
    gap: 8,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateLabel: {
    color: "#666",
    minWidth: 80,
  },
  dateValue: {
    flex: 1,
  },
  reasonContainer: {
    marginTop: 8,
  },
  reasonLabel: {
    color: "#666",
    marginBottom: 4,
  },
  reasonText: {
    color: "#333",
  },
  metaContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  metaText: {
    color: "#999",
    marginBottom: 2,
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

export default MyLeavesScreen;
