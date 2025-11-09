import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View, ScrollView, Alert } from "react-native";
import {
  Layout,
  Text,
  Button,
  Card,
  Input,
  Select,
  SelectItem,
  IndexPath,
  Datepicker,
  Toggle,
} from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import usePersonelStore from "../store/personelStore";

const personelSchema = z
  .object({
    employeeCode: z
      .string()
      .optional()
      .refine(
        (val) =>
          !val ||
          val.trim() === "" ||
          (val.trim().length >= 2 && val.trim().length <= 20),
        {
          message: "Personel kodu 2-20 karakter arasında olmalıdır",
        }
      ),
    firstName: z
      .string()
      .min(2, "Ad en az 2 karakter olmalıdır")
      .max(50, "Ad en fazla 50 karakter olabilir"),
    lastName: z
      .string()
      .min(2, "Soyad en az 2 karakter olmalıdır")
      .max(50, "Soyad en fazla 50 karakter olabilir"),
    profilePictureUrl: z
      .string()
      .optional()
      .refine(
        (val) => !val || val === "" || z.string().url().safeParse(val).success,
        {
          message: "Geçerli bir URL giriniz",
        }
      ),
    email: z
      .string()
      .email("Geçerli bir email adresi giriniz")
      .min(1, "Email adresi gereklidir"),
    phoneNumber: z
      .string()
      .optional()
      .refine(
        (val) =>
          !val ||
          val.trim() === "" ||
          /^(\+90|0)?[5][0-9]{9}$/.test(val.replace(/\s/g, "")),
        {
          message: "Geçerli bir Türkiye telefon numarası giriniz (05XX XXX XXXX)",
        }
      ),
    tcKimlikNo: z
      .string()
      .optional()
      .refine((val) => !val || val.trim() === "" || /^\d{11}$/.test(val), {
        message: "TC Kimlik No 11 haneli sayı olmalıdır",
      }),
    dateOfBirth: z.string().optional(),
    gender: z.enum(["Erkek", "Kadın", "Diğer"]).optional(),
    address: z
      .string()
      .max(500, "Adres en fazla 500 karakter olabilir")
      .optional(),
    position: z
      .string()
      .optional()
      .refine(
        (val) =>
          !val || val.trim() === "" || (val.length >= 2 && val.length <= 100),
        {
          message: "Pozisyon 2-100 karakter arasında olmalıdır",
        }
      ),
    department: z
      .string()
      .optional()
      .refine(
        (val) =>
          !val || val.trim() === "" || (val.length >= 2 && val.length <= 100),
        {
          message: "Departman 2-100 karakter arasında olmalıdır",
        }
      ),
    contractType: z
      .enum(["Belirsiz Süreli", "Belirli Süreli", "Part-time", "Stajyer"])
      .optional(),
    workingHoursPerDay: z.number().min(1).max(24).optional(),
    startDate: z.string().min(1, "Başlangıç tarihi gereklidir"),
    terminationDate: z.string().optional(),
    salary: z
      .string()
      .optional()
      .refine((val) => !val || val.trim() === "" || !isNaN(parseFloat(val)), {
        message: "Geçerli bir maaş tutarı giriniz",
      }),
    bankName: z.string().optional(),
    iban: z.string().optional(),
    insuranceInfo: z.string().optional(),
    isActive: z.boolean().optional(),
    createLoginAccount: z.boolean().default(false),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.createLoginAccount) {
      if (!data.password || data.password.trim().length < 6) {
        ctx.addIssue({
          path: ["password"],
          code: z.ZodIssueCode.custom,
          message: "Şifre en az 6 karakter olmalıdır",
        });
      }
      if (!data.confirmPassword || data.confirmPassword.trim().length < 6) {
        ctx.addIssue({
          path: ["confirmPassword"],
          code: z.ZodIssueCode.custom,
          message: "Şifre tekrarını giriniz",
        });
      }
      if (
        data.password &&
        data.confirmPassword &&
        data.password.trim() !== data.confirmPassword.trim()
      ) {
        ctx.addIssue({
          path: ["confirmPassword"],
          code: z.ZodIssueCode.custom,
          message: "Şifreler eşleşmiyor",
        });
      }
    }
  });

const departments = [
  "İnsan Kaynakları",
  "Bilgi İşlem",
  "Pazarlama",
  "Satış",
  "Muhasebe",
  "Üretim",
  "Lojistik",
  "Diğer",
];

const contractTypes = [
  "Belirsiz Süreli",
  "Belirli Süreli",
  "Part-time",
  "Stajyer",
];

const genderOptions = ["Erkek", "Kadın", "Diğer"];

const formatDateToDDMMYYYY = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
};

const parseDDMMYYYYToDate = (dateString) => {
  if (!dateString) return new Date();
  const [day, month, year] = dateString.split(".");
  return new Date(year, month - 1, day);
};

const ensureIndex = (list, value) => {
  const idx = list.findIndex((item) => item === value);
  return idx >= 0 ? new IndexPath(idx) : new IndexPath(0);
};

const extractEmployeeId = (employee) => {
  if (!employee) return null;
  return (
    employee.id ||
    employee._id ||
    employee.employeeId ||
    employee.userId ||
    employee.uuid ||
    employee.guid ||
    null
  );
};

const getInitialValues = (personel) => {
  if (!personel) {
    return {
      employeeCode: "",
      firstName: "",
      lastName: "",
      profilePictureUrl: "",
      email: "",
      phoneNumber: "",
      tcKimlikNo: "",
      dateOfBirth: "",
      gender: genderOptions[0],
      address: "",
      position: "",
      department: departments[0],
      contractType: contractTypes[0],
      workingHoursPerDay: 8,
      startDate: formatDateToDDMMYYYY(new Date()),
      terminationDate: "",
      salary: "",
      bankName: "",
      iban: "",
      insuranceInfo: "",
      isActive: true,
      createLoginAccount: false,
      password: "",
      confirmPassword: "",
    };
  }

  const salaryValue =
    typeof personel.salary === "object"
      ? personel.salary?.grossAmount?.toString() ?? ""
      : personel.salary?.toString() ?? "";

  const bankNameValue =
    typeof personel.salary === "object"
      ? personel.salary?.bankName ?? ""
      : personel.bankName ?? "";

  const ibanValue =
    typeof personel.salary === "object"
      ? personel.salary?.iban ?? ""
      : personel.iban ?? "";

  const insuranceValue =
    typeof personel.insuranceInfo === "object"
      ? personel.insuranceInfo?.sicilNo ?? ""
      : personel.insuranceInfo ?? "";

  return {
    employeeCode: personel.employeeCode ?? "",
    firstName: personel.firstName ?? "",
    lastName: personel.lastName ?? "",
    profilePictureUrl: personel.profilePictureUrl ?? "",
    email: personel.email ?? "",
    phoneNumber: personel.phoneNumber ?? personel.phone ?? "",
    tcKimlikNo: personel.tcKimlikNo ?? "",
    dateOfBirth: personel.dateOfBirth
      ? formatDateToDDMMYYYY(personel.dateOfBirth)
      : "",
    gender: personel.gender ?? genderOptions[0],
    address: personel.address ?? "",
    position: personel.position ?? "",
    department: personel.department ?? departments[0],
    contractType: personel.contractType ?? contractTypes[0],
    workingHoursPerDay: personel.workingHoursPerDay ?? 8,
    startDate: personel.startDate
      ? formatDateToDDMMYYYY(personel.startDate)
      : formatDateToDDMMYYYY(new Date()),
    terminationDate: personel.terminationDate
      ? formatDateToDDMMYYYY(personel.terminationDate)
      : "",
    salary: salaryValue,
    bankName: bankNameValue,
    iban: ibanValue,
    insuranceInfo: insuranceValue,
    isActive: personel.isDeleted ? false : true,
    createLoginAccount: false,
    password: "",
    confirmPassword: "",
  };
};

const buildEmployeePayload = ({
  formData,
  selectedDepartmentIndex,
  selectedContractIndex,
  selectedGenderIndex,
  existingPersonel,
}) => {
  const startDateISO = formData.startDate
    ? parseDDMMYYYYToDate(formData.startDate).toISOString().split("T")[0]
    : null;

  const payload = {
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    email: formData.email.trim(),
    startDate: startDateISO,
    workingHoursPerDay: formData.workingHoursPerDay || 8,
    contractType:
      contractTypes[selectedContractIndex.row] || "Belirsiz Süreli",
    isActive:
      formData.isActive !== undefined
        ? formData.isActive
        : !existingPersonel?.isDeleted,
  };

  if (formData.employeeCode?.trim()) {
    payload.employeeCode = formData.employeeCode.trim();
  }
  if (formData.profilePictureUrl?.trim()) {
    payload.profilePictureUrl = formData.profilePictureUrl.trim();
  }
  if (formData.phoneNumber?.trim()) {
    payload.phoneNumber = formData.phoneNumber.trim();
  }
  if (formData.tcKimlikNo?.trim()) {
    payload.tcKimlikNo = formData.tcKimlikNo.trim();
  }
  if (formData.dateOfBirth?.trim()) {
    payload.dateOfBirth = parseDDMMYYYYToDate(formData.dateOfBirth)
      .toISOString()
      .split("T")[0];
  }

  payload.gender = genderOptions[selectedGenderIndex.row] ?? null;

  if (formData.address?.trim()) {
    payload.address = formData.address.trim();
  }
  if (formData.position?.trim()) {
    payload.position = formData.position.trim();
  }

  payload.department = departments[selectedDepartmentIndex.row] ?? null;

  if (formData.terminationDate?.trim()) {
    payload.terminationDate = parseDDMMYYYYToDate(formData.terminationDate)
      .toISOString()
      .split("T")[0];
  }

  const existingSalary =
    typeof existingPersonel?.salary === "object" ? existingPersonel.salary : {};

  payload.salary = {
    grossAmount:
      formData.salary && formData.salary.trim() !== ""
        ? parseFloat(formData.salary)
        : existingSalary?.grossAmount ?? 0,
    netAmount: existingSalary?.netAmount ?? 0,
    currency: existingSalary?.currency || "TL",
    bankName:
      formData.bankName && formData.bankName.trim() !== ""
        ? formData.bankName.trim()
        : existingSalary?.bankName ?? null,
    iban:
      formData.iban && formData.iban.trim() !== ""
        ? formData.iban.trim()
        : existingSalary?.iban ?? null,
  };

  payload.insuranceInfo = {
    sicilNo:
      formData.insuranceInfo && formData.insuranceInfo.trim() !== ""
        ? formData.insuranceInfo.trim()
        : typeof existingPersonel?.insuranceInfo === "object"
        ? existingPersonel.insuranceInfo?.sicilNo ?? null
        : existingPersonel?.insuranceInfo ?? null,
    startDate: startDateISO,
  };

  return payload;
};

const AddPersonelScreen = ({ navigation, route }) => {
  const { mode = "create", personel = null } = route?.params || {};
  const isEdit = mode === "edit";
  const existingPersonelId = isEdit ? extractEmployeeId(personel) : null;

  const initialValues = useMemo(
    () => getInitialValues(personel),
    [personel]
  );

  const {
    addPersonel,
    updatePersonel,
    createPersonelUser,
    fetchPersonelList,
    isLoading,
  } = usePersonelStore();

  const [selectedDepartmentIndex, setSelectedDepartmentIndex] = useState(() =>
    ensureIndex(departments, initialValues.department)
  );
  const [selectedContractIndex, setSelectedContractIndex] = useState(() =>
    ensureIndex(contractTypes, initialValues.contractType)
  );
  const [selectedGenderIndex, setSelectedGenderIndex] = useState(() =>
    ensureIndex(genderOptions, initialValues.gender)
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(personelSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    reset(initialValues);
    setSelectedDepartmentIndex(
      ensureIndex(departments, initialValues.department)
    );
    setSelectedContractIndex(
      ensureIndex(contractTypes, initialValues.contractType)
    );
    setSelectedGenderIndex(ensureIndex(genderOptions, initialValues.gender));
  }, [initialValues, reset]);

  const createLoginAccount = watch("createLoginAccount");

  const handleSuccessNavigation = () => {
    navigation.popToTop?.();
    navigation.navigate("PersonelList");
  };

  const onSubmit = async (formData) => {
    if (isEdit && !existingPersonelId) {
      Alert.alert("Hata", "Personel kimliği bulunamadı.");
      return;
    }

    const payload = buildEmployeePayload({
      formData,
      selectedDepartmentIndex,
      selectedContractIndex,
      selectedGenderIndex,
      existingPersonel: personel,
    });

    try {
      let result;
      if (isEdit) {
        result = await updatePersonel(existingPersonelId, payload);
      } else {
        result = await addPersonel(payload);
      }

      if (result.success) {
        let accountError = null;

        if (!isEdit && formData.createLoginAccount) {
          const employeeId = extractEmployeeId(result.employee);
          if (employeeId) {
            const accountResult = await createPersonelUser(
              employeeId,
              formData.email,
              formData.password?.trim()
            );
            if (!accountResult.success) {
              accountError =
                accountResult.error ||
                "Kullanıcı hesabı oluşturulurken bir hata oluştu.";
            }
          } else {
            accountError = "Personel kimliği alınamadığı için hesap açılamadı.";
          }
        }

        await fetchPersonelList();

        const message = isEdit
          ? "Personel bilgileri başarıyla güncellendi."
          : accountError
          ? `Personel kaydedildi ancak kullanıcı hesabı oluşturulamadı.\n\nDetay: ${accountError}`
          : "Personel ve kullanıcı hesabı başarıyla oluşturuldu.";

        Alert.alert(
          isEdit ? "Başarılı" : accountError ? "Personel eklendi" : "Başarılı",
          message,
          [
            {
              text: "Tamam",
              onPress: () => {
                handleSuccessNavigation();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Hata",
          result.error ||
            (isEdit
              ? "Personel güncellenirken bir hata oluştu"
              : "Personel eklenirken bir hata oluştu")
        );
      }
    } catch (error) {
      Alert.alert("Hata", "Beklenmeyen bir hata oluştu");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Layout style={styles.content}>
        <View style={styles.header}>
          <Text category="h4" style={styles.title}>
            {isEdit ? "Personeli Düzenle" : "Yeni Personel Ekle"}
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.formCard}>
            <Text category="h6" style={styles.sectionTitle}>
              Kişisel Bilgiler
            </Text>

            <Controller
              control={control}
              name="firstName"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Ad *"
                  placeholder="Adını giriniz"
                  value={value}
                  onChangeText={onChange}
                  status={errors.firstName ? "danger" : "basic"}
                  caption={errors.firstName?.message}
                  style={styles.input}
                />
              )}
            />

            <Controller
              control={control}
              name="lastName"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Soyad *"
                  placeholder="Soyadını giriniz"
                  value={value}
                  onChangeText={onChange}
                  status={errors.lastName ? "danger" : "basic"}
                  caption={errors.lastName?.message}
                  style={styles.input}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email *"
                  placeholder="email@ornek.com"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  status={errors.email ? "danger" : "basic"}
                  caption={errors.email?.message}
                  style={styles.input}
                />
              )}
            />

            <Controller
              control={control}
              name="phoneNumber"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Telefon"
                  placeholder="05XX XXX XXXX"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="phone-pad"
                  status={errors.phoneNumber ? "danger" : "basic"}
                  caption={errors.phoneNumber?.message}
                  style={styles.input}
                />
              )}
            />

            <Controller
              control={control}
              name="tcKimlikNo"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="TC Kimlik No"
                  placeholder="12345678901"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="numeric"
                  maxLength={11}
                  status={errors.tcKimlikNo ? "danger" : "basic"}
                  caption={errors.tcKimlikNo?.message}
                  style={styles.input}
                />
              )}
            />

            <Controller
              control={control}
              name="dateOfBirth"
              render={({ field: { onChange, value } }) => (
                <View style={styles.input}>
                  <Text category="label" style={styles.label}>
                    Doğum Tarihi
                  </Text>
                  <Datepicker
                    date={value ? parseDDMMYYYYToDate(value) : null}
                    onSelect={(date) => onChange(formatDateToDDMMYYYY(date))}
                    accessoryRight={() => null}
                    placeholder="Doğum tarihi seçiniz"
                    status={errors.dateOfBirth ? "danger" : "basic"}
                    max={new Date()}
                    min={new Date(1900, 0, 1)}
                  />
                  {errors.dateOfBirth && (
                    <Text style={styles.errorText}>
                      {errors.dateOfBirth.message}
                    </Text>
                  )}
                </View>
              )}
            />

            <Select
              label="Cinsiyet"
              selectedIndex={selectedGenderIndex}
              onSelect={(index) => setSelectedGenderIndex(index)}
              value={genderOptions[selectedGenderIndex.row]}
              style={styles.input}
            >
              {genderOptions.map((gender) => (
                <SelectItem key={gender} title={gender} />
              ))}
            </Select>

            <Text category="h6" style={styles.sectionTitle}>
              İş Bilgileri
            </Text>

            <Controller
              control={control}
              name="employeeCode"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Personel Kodu"
                  placeholder="PER001"
                  value={value}
                  onChangeText={onChange}
                  status={errors.employeeCode ? "danger" : "basic"}
                  caption={errors.employeeCode?.message}
                  style={styles.input}
                />
              )}
            />

            <Controller
              control={control}
              name="position"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Pozisyon"
                  placeholder="Yazılım Geliştirici"
                  value={value}
                  onChangeText={onChange}
                  status={errors.position ? "danger" : "basic"}
                  caption={errors.position?.message}
                  style={styles.input}
                />
              )}
            />

            <Select
              label="Departman"
              selectedIndex={selectedDepartmentIndex}
              onSelect={(index) => setSelectedDepartmentIndex(index)}
              value={departments[selectedDepartmentIndex.row]}
              style={styles.input}
            >
              {departments.map((department) => (
                <SelectItem key={department} title={department} />
              ))}
            </Select>

            <Select
              label="Sözleşme Türü"
              selectedIndex={selectedContractIndex}
              onSelect={(index) => setSelectedContractIndex(index)}
              value={contractTypes[selectedContractIndex.row]}
              style={styles.input}
            >
              {contractTypes.map((contractType) => (
                <SelectItem key={contractType} title={contractType} />
              ))}
            </Select>

            <Controller
              control={control}
              name="salary"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Brüt Maaş (TL)"
                  placeholder="15000"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="numeric"
                  status={errors.salary ? "danger" : "basic"}
                  caption={errors.salary?.message}
                  style={styles.input}
                />
              )}
            />

            <Controller
              control={control}
              name="bankName"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Banka Adı"
                  placeholder="Ziraat Bankası"
                  value={value}
                  onChangeText={onChange}
                  status={errors.bankName ? "danger" : "basic"}
                  caption={errors.bankName?.message}
                  style={styles.input}
                />
              )}
            />

            <Controller
              control={control}
              name="iban"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="IBAN"
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                  value={value}
                  onChangeText={onChange}
                  status={errors.iban ? "danger" : "basic"}
                  caption={errors.iban?.message}
                  style={styles.input}
                />
              )}
            />

            <Controller
              control={control}
              name="startDate"
              render={({ field: { onChange, value } }) => (
                <View style={styles.input}>
                  <Text category="label" style={styles.label}>
                    İşe Başlama Tarihi *
                  </Text>
                  <Datepicker
                    date={value ? parseDDMMYYYYToDate(value) : new Date()}
                    onSelect={(date) => onChange(formatDateToDDMMYYYY(date))}
                    accessoryRight={() => null}
                    placeholder="İşe başlama tarihi seçiniz"
                    status={errors.startDate ? "danger" : "basic"}
                    min={new Date(2020, 0, 1)}
                  />
                  {errors.startDate && (
                    <Text style={styles.errorText}>
                      {errors.startDate.message}
                    </Text>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="terminationDate"
              render={({ field: { onChange, value } }) => (
                <View style={styles.input}>
                  <Text category="label" style={styles.label}>
                    İşten Ayrılma Tarihi
                  </Text>
                  <Datepicker
                    date={value ? parseDDMMYYYYToDate(value) : null}
                    onSelect={(date) => onChange(formatDateToDDMMYYYY(date))}
                    accessoryRight={() => null}
                    placeholder="İşten ayrılma tarihi seçiniz (isteğe bağlı)"
                    status={errors.terminationDate ? "danger" : "basic"}
                    min={new Date(2020, 0, 1)}
                  />
                  {errors.terminationDate && (
                    <Text style={styles.errorText}>
                      {errors.terminationDate.message}
                    </Text>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="workingHoursPerDay"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Günlük Çalışma Saati"
                  placeholder="8"
                  value={value?.toString() || "8"}
                  onChangeText={(text) =>
                    onChange(Number.parseInt(text, 10) || 8)
                  }
                  keyboardType="numeric"
                  status={errors.workingHoursPerDay ? "danger" : "basic"}
                  caption={errors.workingHoursPerDay?.message}
                  style={styles.input}
                />
              )}
            />

            <Text category="h6" style={styles.sectionTitle}>
              Ek Bilgiler
            </Text>

            <Controller
              control={control}
              name="profilePictureUrl"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Profil Resmi URL"
                  placeholder="https://example.com/photo.jpg"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="url"
                  autoCapitalize="none"
                  status={errors.profilePictureUrl ? "danger" : "basic"}
                  caption={errors.profilePictureUrl?.message}
                  style={styles.input}
                />
              )}
            />

            <Controller
              control={control}
              name="address"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Adres"
                  placeholder="Tam adres"
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                />
              )}
            />

            <Controller
              control={control}
              name="insuranceInfo"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Sigorta Bilgileri"
                  placeholder="SGK numarası veya sigorta detayları"
                  value={value}
                  onChangeText={onChange}
                  style={styles.input}
                />
              )}
            />

            {isEdit && (
              <Controller
                control={control}
                name="isActive"
                render={({ field: { onChange, value } }) => (
                  <Toggle
                    checked={value}
                    onChange={onChange}
                    style={styles.toggle}
                  >
                    Personel aktif
                  </Toggle>
                )}
              />
            )}

            {!isEdit && (
              <>
                <Controller
                  control={control}
                  name="createLoginAccount"
                  render={({ field: { onChange, value } }) => (
                    <Toggle
                      checked={value}
                      onChange={onChange}
                      style={styles.toggle}
                    >
                      Kullanıcı giriş hesabı oluştur
                    </Toggle>
                  )}
                />

                {createLoginAccount && (
                  <>
                    <Controller
                      control={control}
                      name="password"
                      render={({ field: { onChange, value } }) => (
                        <Input
                          label="Giriş Şifresi"
                          placeholder="En az 6 karakter"
                          value={value}
                          onChangeText={onChange}
                      secureTextEntry={!showPassword}
                          status={errors.password ? "danger" : "basic"}
                          caption={errors.password?.message}
                          style={styles.input}
                          accessoryRight={() => (
                        <Text
                          style={styles.passwordEye}
                          onPress={() => setShowPassword((prev) => !prev)}
                        >
                          {showPassword ? "🙈" : "👁"}
                        </Text>
                          )}
                        />
                      )}
                    />

                    <Controller
                      control={control}
                      name="confirmPassword"
                      render={({ field: { onChange, value } }) => (
                        <Input
                          label="Şifre Tekrarı"
                          placeholder="Şifreyi tekrar girin"
                          value={value}
                          onChangeText={onChange}
                      secureTextEntry={!showConfirmPassword}
                          status={errors.confirmPassword ? "danger" : "basic"}
                          caption={errors.confirmPassword?.message}
                          style={styles.input}
                      accessoryRight={() => (
                        <Text
                          style={styles.passwordEye}
                          onPress={() =>
                            setShowConfirmPassword((prev) => !prev)
                          }
                        >
                          {showConfirmPassword ? "🙈" : "👁"}
                        </Text>
                      )}
                        />
                      )}
                    />
                  </>
                )}
              </>
            )}
          </Card>

          <View style={styles.actionButtons}>
            <Button
              appearance="ghost"
              status="basic"
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
            >
              İptal
            </Button>
            <Button
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              style={styles.submitButton}
            >
              {isLoading
                ? isEdit
                  ? "Güncelleniyor..."
                  : "Ekleniyor..."
                : isEdit
                ? "Kaydet"
                : "Personel Ekle"}
            </Button>
          </View>
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
  header: {
    marginBottom: 16,
  },
  title: {
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  formCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    marginTop: 8,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontWeight: "600",
    color: "#333",
  },
  errorText: {
    color: "#FF3D71",
    fontSize: 12,
    marginTop: 4,
  },
  toggle: {
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 20,
  },
  passwordEye: {
    fontSize: 16,
    paddingHorizontal: 8,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});

export default AddPersonelScreen;
