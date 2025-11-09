import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Keyboard,
  Modal,
} from "react-native";
import {
  Layout,
  Text,
  Input,
  Button,
  Card,
  Datepicker,
} from "@ui-kitten/components";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import usePersonelStore from "../store/personelStore";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";

const timesheetSchema = z
  .object({
    date: z
      .string()
      .min(1, "Tarih zorunludur")
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Tarih formatı YYYY-MM-DD şeklinde olmalıdır"
      ),
    startTime: z
      .string()
      .min(1, "Başlangıç saati zorunludur")
      .regex(/^\d{2}:\d{2}$/, "Saat formatı HH:MM şeklinde olmalıdır"),
    endTime: z
      .string()
      .min(1, "Bitiş saati zorunludur")
      .regex(/^\d{2}:\d{2}$/, "Saat formatı HH:MM şeklinde olmalıdır"),
    breakMinutes: z
      .string()
      .optional()
      .transform((value) => (value ? Number(value) : undefined))
      .refine(
        (value) => value === undefined || (!Number.isNaN(value) && value >= 0),
        {
          message: "Mola süresi dakika cinsinden olmalı ve negatif olamaz",
        }
      ),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.startTime || !data.endTime) return true;
      const [startHour, startMinute] = data.startTime.split(":").map(Number);
      const [endHour, endMinute] = data.endTime.split(":").map(Number);
      return (
        endHour > startHour ||
        (endHour === startHour && endMinute > startMinute)
      );
    },
    {
      path: ["endTime"],
      message: "Bitiş saati başlangıç saatinden sonra olmalıdır",
    }
  );

const normalizeTimeField = (value) => {
  if (!value) return "";
  if (typeof value !== "string") return value;
  const isoMatch = value.match(/T(\d{2}:\d{2})/);
  if (isoMatch) return isoMatch[1];
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  return value.slice(0, 5);
};

const normalizeDateField = (value) => {
  if (!value) return "";
  if (typeof value !== "string") return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsedDate = new Date(value);
  if (!Number.isNaN(parsedDate.getTime())) {
    const year = parsedDate.getFullYear();
    const month = `${parsedDate.getMonth() + 1}`.padStart(2, "0");
    const day = `${parsedDate.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return value;
};

const formatDateToISO = (date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseTimeStringToDate = (value) => {
  const date = new Date();
  const timeMatch = value?.match(/^(\d{2}):(\d{2})$/);
  if (timeMatch) {
    const [, hh, mm] = timeMatch;
    date.setHours(Number(hh));
    date.setMinutes(Number(mm));
  }
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
};

const formatTimeFromDate = (date) => {
  if (!date) return "";
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
};

const CreateTimesheetScreen = ({ navigation, route }) => {
  const editableTimesheet = route?.params?.timesheet;

  const {
    createTimesheet,
    updateTimesheet,
    isLoading,
    fetchMyTimesheets,
    timesheetPagination,
  } = usePersonelStore();

  const defaultValues = useMemo(
    () => ({
      date: normalizeDateField(editableTimesheet?.date),
      startTime: normalizeTimeField(
        editableTimesheet?.startTime ||
          editableTimesheet?.clockIn ||
          editableTimesheet?.inTime
      ),
      endTime: normalizeTimeField(
        editableTimesheet?.endTime ||
          editableTimesheet?.clockOut ||
          editableTimesheet?.outTime
      ),
      breakMinutes:
        editableTimesheet?.breakMinutes ??
        editableTimesheet?.breakDuration ??
        editableTimesheet?.breakTime
          ? String(
              editableTimesheet?.breakMinutes ??
                editableTimesheet?.breakDuration ??
                editableTimesheet?.breakTime
            )
          : "",
      notes: editableTimesheet?.notes || editableTimesheet?.description || "",
    }),
    [editableTimesheet]
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(timesheetSchema),
    defaultValues,
  });

  const [iosTimePicker, setIosTimePicker] = useState({
    visible: false,
    field: null,
    date: new Date(),
  });

  const handleSuccessNavigation = () => {
    const currentPage = timesheetPagination?.page ?? 1;
    const currentLimit = timesheetPagination?.limit ?? 10;
    fetchMyTimesheets(currentPage, currentLimit);
    navigation.goBack();
  };

  const handleShowIosPicker = (field, initialDate) => {
    setIosTimePicker({
      visible: true,
      field,
      date: initialDate,
    });
  };

  const handleCloseIosPicker = () => {
    setIosTimePicker({
      visible: false,
      field: null,
      date: new Date(),
    });
  };

  const handleConfirmIosPicker = () => {
    if (iosTimePicker.field) {
      const formatted = formatTimeFromDate(iosTimePicker.date);
      setValue(iosTimePicker.field, formatted, { shouldValidate: true });
    }
    handleCloseIosPicker();
  };

  const openTimePicker = (fieldName) => {
    Keyboard.dismiss();
    const currentValue = getValues(fieldName);
    const initialDate = parseTimeStringToDate(currentValue);

    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: initialDate,
        mode: "time",
        is24Hour: true,
        onChange: (_, selectedDate) => {
          if (selectedDate) {
            const formatted = formatTimeFromDate(selectedDate);
            setValue(fieldName, formatted, { shouldValidate: true });
          }
        },
      });
    } else {
      handleShowIosPicker(fieldName, initialDate);
    }
  };

  const watchedStartTime = watch("startTime");
  const watchedEndTime = watch("endTime");
  const watchedBreakMinutes = watch("breakMinutes");

  const totalDurationMinutes = useMemo(() => {
    const toMinutes = (time) => {
      const match = time?.match(/^(\d{2}):(\d{2})$/);
      if (!match) return null;
      const [, hh, mm] = match;
      return Number(hh) * 60 + Number(mm);
    };

    const start = toMinutes(watchedStartTime);
    const end = toMinutes(watchedEndTime);
    if (start === null || end === null || end <= start) {
      return null;
    }

    const breakMinutes = Number(watchedBreakMinutes);
    const safeBreak = Number.isNaN(breakMinutes) ? 0 : Math.max(breakMinutes, 0);
    const duration = end - start - safeBreak;
    return duration > 0 ? duration : 0;
  }, [watchedStartTime, watchedEndTime, watchedBreakMinutes]);

  const totalDurationLabel =
    totalDurationMinutes !== null
      ? (totalDurationMinutes / 60).toFixed(2)
      : null;

  const onSubmit = async (formData) => {
    const payload = {
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      breakMinutes: formData.breakMinutes,
      notes: formData.notes?.trim() ? formData.notes.trim() : undefined,
    };

    let result;

    if (editableTimesheet?.id || editableTimesheet?._id) {
      const identifier = editableTimesheet.id || editableTimesheet._id;
      result = await updateTimesheet(identifier, payload);
    } else {
      result = await createTimesheet(payload);
    }

    if (result.success) {
      Alert.alert(
        "Başarılı",
        editableTimesheet ? "Mesai kaydı güncellendi" : "Mesai kaydı oluşturuldu",
        [{ text: "Tamam", onPress: handleSuccessNavigation }]
      );
    } else {
      Alert.alert(
        "Hata",
        result.error || "Mesai kaydı kaydedilirken bir hata oluştu"
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Layout style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Card style={styles.card}>
            <Text category="h5" style={styles.title}>
              {editableTimesheet ? "Mesai Kaydını Düzenle" : "Yeni Mesai Kaydı"}
            </Text>
            <Text category="c1" appearance="hint" style={styles.subtitle}>
              Tarih ve çalışma saatlerini doldurun. Saat alanlarını HH:MM
              formatında girin (örn. 09:00).
            </Text>

            <View style={styles.form}>
              <Controller
                control={control}
                name="date"
                render={({ field: { onChange, value } }) => (
                  <Datepicker
                    label="Tarih"
                    placeholder="Tarih seçin"
                    date={value ? new Date(value) : null}
                    onSelect={(nextDate) => {
                      const formatted = formatDateToISO(nextDate);
                      onChange(formatted);
                    }}
                    status={errors.date ? "danger" : "basic"}
                    caption={errors.date?.message}
                    style={styles.input}
                    min={new Date(2000, 0, 1)}
                    max={new Date(2100, 11, 31)}
                  />
                )}
              />

              <Controller
                control={control}
                name="startTime"
                render={({ field: { value } }) => (
                  <Input
                    label="Başlangıç Saati"
                    placeholder="09:00"
                    value={value}
                    status={errors.startTime ? "danger" : "basic"}
                    caption={errors.startTime?.message}
                    style={styles.input}
                    editable={false}
                    accessoryRight={() => <Text style={styles.timeSuffix}>🕒</Text>}
                    onTouchStart={(event) => {
                      event.stopPropagation();
                      openTimePicker("startTime");
                    }}
                    onFocus={(event) => {
                      event.preventDefault();
                      openTimePicker("startTime");
                    }}
                  />
                )}
              />

              <Controller
                control={control}
                name="endTime"
                render={({ field: { value } }) => (
                  <Input
                    label="Bitiş Saati"
                    placeholder="18:00"
                    value={value}
                    status={errors.endTime ? "danger" : "basic"}
                    caption={errors.endTime?.message}
                    style={styles.input}
                    editable={false}
                    accessoryRight={() => <Text style={styles.timeSuffix}>🕒</Text>}
                    onTouchStart={(event) => {
                      event.stopPropagation();
                      openTimePicker("endTime");
                    }}
                    onFocus={(event) => {
                      event.preventDefault();
                      openTimePicker("endTime");
                    }}
                  />
                )}
              />

              {totalDurationLabel && (
                <View style={styles.durationSummary}>
                  <Text category="s2" style={styles.durationLabel}>
                    Toplam süre: {totalDurationLabel} saat
                  </Text>
                </View>
              )}

              <Controller
                control={control}
                name="breakMinutes"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Toplam Mola (dakika)"
                    placeholder="60"
                    value={value ?? ""}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    status={errors.breakMinutes ? "danger" : "basic"}
                    caption={errors.breakMinutes?.message}
                    style={styles.input}
                    keyboardType="numeric"
                  />
                )}
              />

              <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Notlar"
                    placeholder="Bugün müşteri ziyaretleri yapıldı..."
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    status={errors.notes ? "danger" : "basic"}
                    caption={errors.notes?.message}
                    style={styles.input}
                    multiline
                    textStyle={styles.multilineInput}
                  />
                )}
              />
            </View>

            <Button
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              style={styles.submitButton}
            >
              {isLoading
                ? "Kaydediliyor..."
                : editableTimesheet
                ? "Güncelle"
                : "Kaydet"}
            </Button>
          </Card>
        </ScrollView>
        {Platform.OS === "ios" && iosTimePicker.visible && (
          <Modal transparent animationType="fade">
            <View style={styles.modalBackdrop}>
              <View style={styles.modalContent}>
                <Text category="s1" style={styles.modalTitle}>
                  Saat Seçin
                </Text>
                <DateTimePicker
                  value={iosTimePicker.date}
                  mode="time"
                  display="spinner"
                  onChange={(_, selectedDate) => {
                    if (selectedDate) {
                      setIosTimePicker((prev) => ({
                        ...prev,
                        date: selectedDate,
                      }));
                    }
                  }}
                />
                <View style={styles.modalButtons}>
                  <Button
                    appearance="ghost"
                    status="basic"
                    onPress={handleCloseIosPicker}
                    style={styles.modalButton}
                  >
                    İptal
                  </Button>
                  <Button
                    status="primary"
                    onPress={handleConfirmIosPicker}
                    style={styles.modalButton}
                  >
                    Seç
                  </Button>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </Layout>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  card: {
    paddingVertical: 20,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 16,
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  input: {
    marginBottom: 8,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    marginTop: 8,
  },
  timeSuffix: {
    fontSize: 16,
    paddingHorizontal: 8,
  },
  durationSummary: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#F4F6FB",
  },
  durationLabel: {
    textAlign: "center",
    color: "#2E3A59",
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: "100%",
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
  },
});

export default CreateTimesheetScreen;


