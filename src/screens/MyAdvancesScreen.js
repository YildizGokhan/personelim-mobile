import React, { useEffect, useState } from "react";
import { StyleSheet, View, FlatList, RefreshControl } from "react-native";
import { Layout, Text, Button, Card } from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import usePersonelStore from "../store/personelStore";

const MyAdvancesScreen = ({ navigation }) => {
  const { myAdvances, fetchMyAdvances, isLoading } = usePersonelStore();
  const [selectedStatus, setSelectedStatus] = useState(null);

  const statusOptions = [
    { label: "Tümü", value: null },
    { label: "Bekleyen", value: "pending" },
    { label: "Onaylanan", value: "approved" },
    { label: "Ödenen", value: "paid" },
    { label: "Reddedilen", value: "rejected" },
  ];

  useEffect(() => {
    fetchMyAdvances(1, 10, selectedStatus);
  }, [selectedStatus, fetchMyAdvances]);

  const handleRefresh = () => {
    fetchMyAdvances(1, 10, selectedStatus);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "#4CAF50";
      case "rejected":
        return "#F44336";
      case "pending":
        return "#FF9800";
      case "paid":
        return "#2196F3";
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
      case "paid":
        return "Ödendi";
      default:
        return status;
    }
  };

  const renderAdvanceItem = ({ item }) => (
    <Card style={styles.advanceCard}>
      <View style={styles.advanceHeader}>
        <View style={styles.amountContainer}>
          <Ionicons name="card-outline" size={20} color="#2196F3" />
          <Text category="h6" style={styles.amount}>
            {item.amount?.toLocaleString()} TL
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

      <View style={styles.advanceContent}>
        <View style={styles.reasonContainer}>
          <Text category="s2" style={styles.reasonLabel}>
            Açıklama:
          </Text>
          <Text category="p2" style={styles.reasonText}>
            {item.reason}
          </Text>
        </View>

        <View style={styles.metaContainer}>
          <Text category="c1" style={styles.metaText}>
            Talep Tarihi: {new Date(item.createdAt).toLocaleDateString("tr-TR")}
          </Text>
          {item.approvedAt && (
            <Text category="c1" style={styles.metaText}>
              {item.status === "approved" || item.status === "paid"
                ? "Onay"
                : "Red"}{" "}
              Tarihi: {new Date(item.approvedAt).toLocaleDateString("tr-TR")}
            </Text>
          )}
          {item.paidAt && (
            <Text category="c1" style={styles.metaText}>
              Ödeme Tarihi: {new Date(item.paidAt).toLocaleDateString("tr-TR")}
            </Text>
          )}
        </View>
      </View>
    </Card>
  );

  const totalAdvanceAmount =
    myAdvances?.reduce((total, advance) => {
      if (advance.status === "approved" || advance.status === "paid") {
        return total + (advance.amount || 0);
      }
      return total;
    }, 0) || 0;

  const pendingAdvanceAmount =
    myAdvances?.reduce((total, advance) => {
      if (advance.status === "pending") {
        return total + (advance.amount || 0);
      }
      return total;
    }, 0) || 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Layout style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text category="h4" style={styles.title}>
            Avans Taleplerim
          </Text>
          <Button
            size="small"
            onPress={() => navigation.navigate("CreateAdvance")}
          >
            + Yeni Avans
          </Button>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Text category="h6" style={styles.statNumber}>
              {myAdvances?.filter(
                (advance) =>
                  advance.status === "approved" || advance.status === "paid"
              ).length || 0}
            </Text>
            <Text category="s2" style={styles.statLabel}>
              Onaylanan
            </Text>
          </Card>

          <Card style={styles.statCard}>
            <Text category="h6" style={styles.statNumber}>
              {myAdvances?.filter((advance) => advance.status === "pending")
                .length || 0}
            </Text>
            <Text category="s2" style={styles.statLabel}>
              Bekleyen
            </Text>
          </Card>

          <Card style={styles.statCard}>
            <Text category="h6" style={styles.statNumber}>
              {myAdvances?.filter((advance) => advance.status === "paid")
                .length || 0}
            </Text>
            <Text category="s2" style={styles.statLabel}>
              Ödenen
            </Text>
          </Card>
        </View>

        {/* Amount Summary */}
        <View style={styles.summaryContainer}>
          <Card style={styles.summaryCard}>
            <Text category="s2" style={styles.summaryLabel}>
              Toplam Onaylanan Avans
            </Text>
            <Text category="h5" style={styles.summaryAmount}>
              {totalAdvanceAmount.toLocaleString()} TL
            </Text>
          </Card>

          <Card style={styles.summaryCard}>
            <Text category="s2" style={styles.summaryLabel}>
              Bekleyen Avans
            </Text>
            <Text category="h5" style={styles.summaryAmount}>
              {pendingAdvanceAmount.toLocaleString()} TL
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

        {/* Advances List */}
        {myAdvances && myAdvances.length > 0 ? (
          <FlatList
            data={myAdvances}
            renderItem={renderAdvanceItem}
            keyExtractor={(item, index) => item.id || item._id || `${index}`}
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
            <Ionicons name="card-outline" size={48} color="#ccc" />
            <Text category="s1" style={styles.emptyText}>
              Henüz avans talebiniz bulunmuyor
            </Text>
            <Text category="c1" style={styles.emptySubtext}>
              Yeni bir avans talebi oluşturmak için yukarıdaki butona tıklayın
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
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
    paddingVertical: 16,
  },
  summaryLabel: {
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  summaryAmount: {
    color: "#2196F3",
    fontWeight: "bold",
  },
  list: {
    flex: 1,
  },
  advanceCard: {
    marginBottom: 12,
  },
  advanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  amount: {
    marginLeft: 8,
    fontWeight: "600",
    color: "#2196F3",
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
  advanceContent: {
    gap: 8,
  },
  reasonContainer: {
    marginBottom: 8,
  },
  reasonLabel: {
    color: "#666",
    marginBottom: 4,
  },
  reasonText: {
    color: "#333",
  },
  metaContainer: {
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

export default MyAdvancesScreen;
