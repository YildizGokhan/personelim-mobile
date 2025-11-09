import React, { useEffect } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { Layout, Text, Button, Card } from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import useAuthStore from "../store/authStore";
import usePersonelStore from "../store/personelStore";

const EmployeeDashboardScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const {
    currentPersonel,
    fetchMyData,
    myLeaves,
    myAdvances,
    fetchMyLeaves,
    fetchMyAdvances,
    myTimesheets,
    fetchMyTimesheets,
  } = usePersonelStore();

  useEffect(() => {
    fetchMyData();
    fetchMyLeaves();
    fetchMyAdvances();
    fetchMyTimesheets();
  }, []);

  const quickActions = [
    {
      title: "Profilim",
      subtitle: "Kişisel bilgilerimi görüntüle",
      action: () => navigation.navigate("MyProfile"),
      color: "#2196F3",
      icon: "person-outline",
    },
    {
      title: "İzin Talebi",
      subtitle: "Yeni izin talebi oluştur",
      action: () => navigation.navigate("CreateLeave"),
      color: "#4CAF50",
      icon: "calendar-outline",
    },
    {
      title: "Avans Talebi",
      subtitle: "Avans talebi oluştur",
      action: () => navigation.navigate("CreateAdvance"),
      color: "#FF9800",
      icon: "card-outline",
    },
    {
      title: "Mesai Kaydı",
      subtitle: "Çalışma saatlerini yönet",
      action: () => navigation.navigate("Timesheets"),
      color: "#00BCD4",
      icon: "time-outline",
    },
    {
      title: "İzin Geçmişi",
      subtitle: "Geçmiş izin taleplerimi görüntüle",
      action: () => navigation.navigate("MyLeaves"),
      color: "#9C27B0",
      icon: "time-outline",
    },
  ];

  const QuickActionCard = ({ action }) => (
    <Card
      style={[styles.actionCard, { borderLeftColor: action.color }]}
      onPress={action.action}
    >
      <View style={styles.actionContent}>
        <View style={styles.actionIcon}>
          <Ionicons name={action.icon} size={24} color={action.color} />
        </View>
        <View style={styles.actionText}>
          <Text category="s1" style={styles.actionTitle}>
            {action.title}
          </Text>
          <Text category="c1" style={styles.actionSubtitle}>
            {action.subtitle}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Layout style={styles.content}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Card style={styles.headerCard}>
            <Text category="h4" style={styles.welcomeText}>
              Hoş geldiniz! 👋
            </Text>
            <Text category="s1" style={styles.userName}>
              {currentPersonel
                ? `${currentPersonel.firstName} ${currentPersonel.lastName}`
                : user?.name}
            </Text>
            <Text category="c1" style={styles.userRole}>
              {currentPersonel?.position || "Çalışan"}
            </Text>
            <Text category="c1" style={styles.department}>
              {currentPersonel?.department}
            </Text>
          </Card>

          {/* Statistics Cards */}
          <View style={styles.statsContainer}>
            <Card style={styles.statCard}>
              <Text category="h6" style={styles.statNumber}>
                {myLeaves?.length || 0}
              </Text>
              <Text category="s2" style={styles.statLabel}>
                İzin Taleplerim
              </Text>
            </Card>

            <Card style={styles.statCard}>
              <Text category="h6" style={styles.statNumber}>
                {myAdvances?.length || 0}
              </Text>
              <Text category="s2" style={styles.statLabel}>
                Avans Taleplerim
              </Text>
            </Card>

            <Card style={styles.statCard}>
              <Text category="h6" style={styles.statNumber}>
                {myLeaves?.filter((leave) => leave.status === "approved")
                  .length || 0}
              </Text>
              <Text category="s2" style={styles.statLabel}>
                Onaylanan İzinler
              </Text>
            </Card>

            <Card style={styles.statCard}>
              <Text category="h6" style={styles.statNumber}>
                {myLeaves?.filter((leave) => leave.status === "pending")
                  .length || 0}
              </Text>
              <Text category="s2" style={styles.statLabel}>
                Bekleyen İzinler
              </Text>
            </Card>

            <Card style={styles.statCard}>
              <Text category="h6" style={styles.statNumber}>
                {myTimesheets?.length || 0}
              </Text>
              <Text category="s2" style={styles.statLabel}>
                Mesai Kayıtlarım
              </Text>
            </Card>
          </View>

          {/* Quick Actions */}
          <Card style={styles.actionsCard}>
            <Text category="h6" style={styles.actionsTitle}>
              Hızlı İşlemler
            </Text>
            <View style={styles.actionsContainer}>
              {quickActions.map((action, index) => (
                <QuickActionCard key={index} action={action} />
              ))}
            </View>
          </Card>

          {/* Recent Activities */}
          <Card style={styles.recentCard}>
            <Text category="h6" style={styles.recentTitle}>
              Son Aktiviteler
            </Text>
            <View style={styles.recentList}>
              {myLeaves?.slice(0, 3).map((leave, index) => (
                <View key={index} style={styles.recentItem}>
                  <View style={styles.recentIcon}>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#2196F3"
                    />
                  </View>
                  <View style={styles.recentContent}>
                    <Text category="s2">{leave.type} izni</Text>
                    <Text category="c1">
                      {leave.startDate} - {leave.endDate}
                    </Text>
                    <Text
                      category="c1"
                      style={[
                        styles.statusText,
                        {
                          color:
                            leave.status === "approved"
                              ? "#4CAF50"
                              : leave.status === "rejected"
                              ? "#F44336"
                              : "#FF9800",
                        },
                      ]}
                    >
                      {leave.status === "approved"
                        ? "Onaylandı"
                        : leave.status === "rejected"
                        ? "Reddedildi"
                        : "Bekliyor"}
                    </Text>
                  </View>
                </View>
              ))}
              {(!myLeaves || myLeaves.length === 0) && (
                <View style={styles.emptyState}>
                  <Text category="s2" style={styles.emptyText}>
                    Henüz aktivite bulunmuyor
                  </Text>
                </View>
              )}
            </View>
          </Card>

          <Card style={styles.recentCard}>
            <Text category="h6" style={styles.recentTitle}>
              Son Mesai Kayıtları
            </Text>
            <View style={styles.recentList}>
              {myTimesheets?.slice(0, 3).map((timesheet, index) => (
                <View key={index} style={styles.recentItem}>
                  <View style={styles.recentIcon}>
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color="#00BCD4"
                    />
                  </View>
                  <View style={styles.recentContent}>
                    <Text category="s2">
                      {timesheet?.date
                        ? new Date(timesheet.date).toLocaleDateString("tr-TR")
                        : "Tarih belirtilmedi"}
                    </Text>
                    <Text category="c1">
                      {[
                        timesheet?.startTime ||
                          timesheet?.clockIn ||
                          timesheet?.inTime,
                        timesheet?.endTime ||
                          timesheet?.clockOut ||
                          timesheet?.outTime,
                      ]
                        .filter(Boolean)
                        .join(" - ")}
                    </Text>
                    {timesheet?.notes && (
                      <Text category="c1" style={styles.timesheetNote}>
                        {timesheet.notes}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
              {(!myTimesheets || myTimesheets.length === 0) && (
                <View style={styles.emptyState}>
                  <Text category="s2" style={styles.emptyText}>
                    Henüz mesai kaydı bulunmuyor
                  </Text>
                </View>
              )}
            </View>
          </Card>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  headerCard: {
    marginBottom: 16,
  },
  welcomeText: {
    marginBottom: 8,
  },
  userName: {
    marginBottom: 4,
    fontWeight: "600",
  },
  userRole: {
    color: "#666",
    marginBottom: 2,
  },
  department: {
    color: "#999",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    width: "48%",
    marginBottom: 8,
    alignItems: "center",
    paddingVertical: 16,
  },
  statNumber: {
    color: "#2196F3",
    marginBottom: 4,
  },
  statLabel: {
    textAlign: "center",
    color: "#666",
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionsTitle: {
    marginBottom: 16,
  },
  actionsContainer: {
    gap: 8,
  },
  actionCard: {
    marginBottom: 8,
    borderLeftWidth: 4,
    paddingVertical: 12,
  },
  actionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionIcon: {
    marginRight: 12,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    marginBottom: 2,
    fontWeight: "600",
  },
  actionSubtitle: {
    color: "#666",
  },
  recentCard: {
    marginBottom: 16,
  },
  recentTitle: {
    marginBottom: 16,
  },
  recentList: {
    gap: 12,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  recentIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  recentContent: {
    flex: 1,
  },
  statusText: {
    marginTop: 4,
    fontWeight: "600",
  },
  emptyState: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#999",
  },
  timesheetNote: {
    marginTop: 4,
    color: "#757575",
  },
});

export default EmployeeDashboardScreen;
