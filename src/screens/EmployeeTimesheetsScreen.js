import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  Alert,
} from "react-native";
import { Layout, Text, Card, Button, Modal, Input } from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import usePersonelStore from "../store/personelStore";

const formatDate = (value) => {
  if (!value) return "-";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString("tr-TR");
  } catch (error) {
    return value;
  }
};

const formatTime = (value) => {
  if (!value) return "-";
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return value;
  }
};

const deriveDuration = (item) => {
  const totalHours =
    item.totalHours ??
    item.workedHours ??
    item.hours ??
    item.durationHours ??
    item.totalWorkedHours;

  if (totalHours !== undefined && totalHours !== null) {
    const numeric = Number(totalHours);
    if (!Number.isNaN(numeric)) {
      return `${numeric.toFixed(2)} saat`;
    }
  }

  const start = item.startTime || item.clockIn || item.inTime;
  const end = item.endTime || item.clockOut || item.outTime;
  if (!start || !end) return "-";
  const startDate = new Date(`1970-01-01T${formatTime(start)}:00`);
  const endDate = new Date(`1970-01-01T${formatTime(end)}:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "-";
  }
  const diffMinutes = (endDate - startDate) / (1000 * 60);
  if (diffMinutes <= 0) return "-";
  return `${(diffMinutes / 60).toFixed(2)} saat`;
};

const statusMeta = {
  approved: { label: "Onaylandı", color: "#4CAF50" },
  rejected: { label: "Reddedildi", color: "#F44336" },
  pending: { label: "Bekliyor", color: "#FF9800" },
};

const getTimesheetIdentifier = (entry) =>
  entry.id || entry._id || entry.timesheetId || entry.uuid || entry.code;

const EmployeeTimesheetsScreen = ({ route }) => {
  const { employeeId, employeeName } = route.params;

  const {
    employeeTimesheets,
    fetchEmployeeTimesheets,
    approveTimesheet,
    timesheetReviewPagination,
    timesheetReviewLoading,
  } = usePersonelStore();

  const [approvalModal, setApprovalModal] = useState({
    visible: false,
    status: "approved",
    timesheet: null,
  });
  const [approvalNote, setApprovalNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchEmployeeTimesheets(employeeId);
    }, [employeeId, fetchEmployeeTimesheets])
  );

  const handleRefresh = () => {
    fetchEmployeeTimesheets(employeeId, timesheetReviewPagination.page);
  };

  const openApprovalModal = (timesheet, status) => {
    setApprovalModal({
      visible: true,
      status,
      timesheet,
    });
    setApprovalNote(timesheet?.approvalNote || "");
  };

  const closeApprovalModal = () => {
    if (isSubmitting) {
      return;
    }
    setApprovalModal({
      visible: false,
      status: "approved",
      timesheet: null,
    });
    setApprovalNote("");
  };

  const handleSubmitApproval = async () => {
    if (!approvalModal.timesheet) {
      return;
    }
    const timesheetId = getTimesheetIdentifier(approvalModal.timesheet);
    if (!timesheetId) {
      Alert.alert("Hata", "Mesai kaydının kimliği bulunamadı.");
      return;
    }

    setIsSubmitting(true);
    const result = await approveTimesheet(
      employeeId,
      timesheetId,
      approvalModal.status,
      approvalNote.trim() === "" ? null : approvalNote.trim()
    );
    setIsSubmitting(false);

    if (!result.success) {
      Alert.alert(
        "Hata",
        result.error || "Mesai kaydı güncellenirken bir hata oluştu"
      );
    } else {
      closeApprovalModal();
    }
  };

  const renderTimesheet = ({ item }) => {
    const status =
      item.status ||
      item.approvalStatus ||
      (item.approved ? "approved" : "pending");
    const meta = statusMeta[status] || statusMeta.pending;

    return (
      <Card style={styles.timesheetCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Ionicons name="time-outline" size={22} color="#2196F3" />
            <View style={styles.headerText}>
              <Text category="s1">{formatDate(item.date)}</Text>
              {item.project || item.taskName ? (
                <Text category="c1" appearance="hint">
                  {item.project || item.taskName}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={[styles.statusChip, { backgroundColor: meta.color }]}>
            <Text style={styles.statusChipText}>{meta.label}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text category="s2" style={styles.detailLabel}>
            Başlangıç:
          </Text>
          <Text category="p2">{formatTime(item.startTime || item.clockIn)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text category="s2" style={styles.detailLabel}>
            Bitiş:
          </Text>
          <Text category="p2">{formatTime(item.endTime || item.clockOut)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text category="s2" style={styles.detailLabel}>
            Toplam Süre:
          </Text>
          <Text category="p2">{deriveDuration(item)}</Text>
        </View>
        {item.breakMinutes !== undefined && (
          <View style={styles.detailRow}>
            <Text category="s2" style={styles.detailLabel}>
              Mola:
            </Text>
            <Text category="p2">{item.breakMinutes} dk</Text>
          </View>
        )}
        {item.notes && (
          <View style={styles.notesContainer}>
            <Text category="s2" style={styles.detailLabel}>
              Not:
            </Text>
            <Text category="p2">{item.notes}</Text>
          </View>
        )}

        {item.approvalNote ? (
          <View style={styles.notesContainer}>
            <Text category="s2" style={styles.detailLabel}>
              Onay Notu:
            </Text>
            <Text category="p2">{item.approvalNote}</Text>
          </View>
        ) : null}
        {item.approvedAt ? (
          <View style={styles.detailRow}>
            <Text category="s2" style={styles.detailLabel}>
              Güncellenme:
            </Text>
            <Text category="p2">
              {formatDate(item.approvedAt)} {formatTime(item.approvedAt)}
            </Text>
          </View>
        ) : null}

        <View style={styles.actionRow}>
          {status === "pending" ? (
            <>
              <Button
                size="small"
                status="success"
                style={styles.actionButton}
                onPress={() => openApprovalModal(item, "approved")}
              >
                Onayla
              </Button>
              <Button
                size="small"
                status="danger"
                appearance="outline"
                style={styles.actionButton}
                onPress={() => openApprovalModal(item, "rejected")}
              >
                Reddet
              </Button>
            </>
          ) : (
            <Button
              size="small"
              status="basic"
              appearance="outline"
              style={styles.actionButton}
              onPress={() => openApprovalModal(item, "pending")}
            >
              Beklemeye Al
            </Button>
          )}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Layout style={styles.container}>
        <View style={styles.header}>
          <Text category="h4" style={styles.title}>
            {employeeName || "Çalışan"} Mesai Kayıtları
          </Text>
          <Text category="c1" appearance="hint">
            Toplam kayıt: {timesheetReviewPagination.total || 0}
          </Text>
        </View>

        <FlatList
          data={employeeTimesheets}
          keyExtractor={(item, index) =>
            getTimesheetIdentifier(item) || `timesheet-${index}`
          }
          renderItem={renderTimesheet}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={timesheetReviewLoading}
              onRefresh={handleRefresh}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={48} color="#ccc" />
              <Text category="s1" style={styles.emptyText}>
                Henüz kayıt bulunmadı
              </Text>
              <Text category="c1" appearance="hint" style={styles.emptyHint}>
                Çalışan bu güne kadar mesai kaydı oluşturmadı veya filtreye
                uyan sonuç yok.
              </Text>
            </View>
          }
        />

        <Modal
          visible={approvalModal.visible}
          backdropStyle={styles.modalBackdrop}
          onBackdropPress={closeApprovalModal}
        >
          <Card disabled style={styles.modalCard}>
            <Text category="h6" style={styles.modalTitle}>
              {approvalModal.status === "approved"
                ? "Mesaiyi Onayla"
                : approvalModal.status === "rejected"
                ? "Mesaiyi Reddet"
                : "Mesaiyi Beklemeye Al"}
            </Text>
            <Text category="c1" appearance="hint" style={styles.modalDescription}>
              {approvalModal.status === "approved"
                ? "Gerekli görüyorsanız mesai kaydı için kısa bir açıklama ekleyin."
                : approvalModal.status === "rejected"
                ? "Reddetme sebebini not olarak iletin (isteğe bağlı)."
                : "Kayıt yeniden incelemeye alınacak. İsterseniz bilgi notu ekleyin."}
            </Text>
            <Input
              label="Not (opsiyonel)"
              placeholder="Açıklama ekleyin..."
              value={approvalNote}
              multiline
              textStyle={styles.modalInput}
              onChangeText={setApprovalNote}
              style={styles.modalInputContainer}
            />
            <View style={styles.modalActions}>
              <Button
                appearance="ghost"
                status="basic"
                onPress={closeApprovalModal}
                disabled={isSubmitting}
                style={styles.modalButton}
              >
                İptal
              </Button>
              <Button
                status={
                  approvalModal.status === "approved"
                    ? "success"
                    : approvalModal.status === "rejected"
                    ? "danger"
                    : "primary"
                }
                onPress={handleSubmitApproval}
                disabled={isSubmitting}
                style={styles.modalButton}
              >
                {isSubmitting
                  ? "Gönderiliyor..."
                  : approvalModal.status === "approved"
                  ? "Onayla"
                  : approvalModal.status === "rejected"
                  ? "Reddet"
                  : "Kaydet"}
              </Button>
            </View>
          </Card>
        </Modal>
      </Layout>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 4,
  },
  listContent: {
    paddingBottom: 24,
  },
  timesheetCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerText: {
    flexShrink: 1,
  },
  statusChip: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusChipText: {
    color: "#fff",
    fontWeight: "600",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  detailLabel: {
    color: "#666",
  },
  notesContainer: {
    marginTop: 8,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    color: "#333",
  },
  emptyHint: {
    textAlign: "center",
    paddingHorizontal: 24,
  },
  modalBackdrop: {
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalCard: {
    width: 320,
  },
  modalTitle: {
    marginBottom: 8,
  },
  modalDescription: {
    marginBottom: 12,
  },
  modalInputContainer: {
    marginBottom: 16,
  },
  modalInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});

export default EmployeeTimesheetsScreen;


